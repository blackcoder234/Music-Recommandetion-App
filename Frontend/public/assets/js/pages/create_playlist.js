
import api from '../api.js';
import Auth from '../auth.js';
import { displayMessage, toggleLoader } from '../utils.js';

export async function init() {
    console.log("Initializing Create Playlist...");
    
    // Auth Check
    const user = await Auth.getCurrentUser();
    if (!user) {
        window.location.href = '/login?redirect=/create_playlist';
        return;
    }

    const form = document.getElementById('create-playlist-form');
    if (form) {
        // Remove old listeners by cloning
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);
        
        newForm.addEventListener('submit', handleCreatePlaylist);
    }
}

async function handleCreatePlaylist(e) {
    e.preventDefault();
    toggleLoader(true);

    const playListTitle = document.getElementById('playlist-title').value.trim();
    const description = document.getElementById('playlist-desc').value.trim();
    const isPublic = document.getElementById('is-public').checked;

    if (!playListTitle) {
        displayMessage("Playlist title is required", "error");
        toggleLoader(false);
        return;
    }

    try {
        const payload = {
            playListTitle,
            description,
            isPublic,
            tracks: []
        };

        const response = await api.request('/playlists', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        if (response.data && response.data._id) {
            displayMessage("Playlist created successfully!", "success");
            setTimeout(() => {
                window.location.href = `/playlist.html?id=${response.data._id}`;
            }, 1000);
        }

    } catch (error) {
        console.error("Create Playlist Error:", error);
        displayMessage(error.message || "Failed to create playlist", "error");
    } finally {
        toggleLoader(false);
    }
}
