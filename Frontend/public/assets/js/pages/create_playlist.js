
import api from '../api.js';
import { displayMessage, toggleLoader } from '../utils.js';

const form = document.getElementById('create-playlist-form');

if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        toggleLoader(true);

        // Gather Form Data
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
                tracks: [] // Empty initial playlist
            };

            const response = await api.request('/playlists', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            if (response.data && response.data._id) {
                displayMessage("Playlist created successfully!", "success");
                setTimeout(() => {
                    window.location.href = `/playlist/${response.data._id}`;
                }, 1000);
            }

        } catch (error) {
            console.error("Create Playlist Error:", error);
            // API might return standard error message
            displayMessage(error.message || "Failed to create playlist", "error");
        } finally {
            toggleLoader(false);
        }
    });
}
