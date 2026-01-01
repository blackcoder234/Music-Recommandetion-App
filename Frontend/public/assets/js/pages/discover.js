
import api from '../api.js';
import { displayMessage, toggleLoader } from '../utils.js';

// DOM Elements
const searchInput = document.getElementById('discover-search');
const resultsContainer = document.getElementById('discover-results');
const genreButtons = document.querySelectorAll('.genre-filter');
const browseSection = document.getElementById('browse-all-section');
const resultsTitle = document.getElementById('results-title');

let currentSearch = '';
let currentGenre = '';

async function loadTracks() {
    toggleLoader(true);
    resultsContainer.innerHTML = '';
    
    try {
        const query = new URLSearchParams(window.location.search);
        const searchParam = query.get('search') || currentSearch;
        const genreParam = query.get('genre') || currentGenre;

        let endpoint = `/tracks?limit=20`;
        if (searchParam) endpoint += `&search=${encodeURIComponent(searchParam)}`;
        if (genreParam && genreParam !== 'All') endpoint += `&genre=${encodeURIComponent(genreParam)}`;
        
        const response = await api.request(endpoint);
        const tracks = response.data.tracks;

        renderTracks(tracks);
        
        if (resultsTitle) {
            if (searchParam) resultsTitle.textContent = `Search results for "${searchParam}"`;
            else if (genreParam && genreParam !== 'All') resultsTitle.textContent = `${genreParam} Songs`;
            else resultsTitle.textContent = 'Discover Songs';
        }

        // Hide Browse All if searching
        if (searchParam && browseSection) {
            browseSection.classList.add('hidden');
        } else if(browseSection) {
            browseSection.classList.remove('hidden');
        }

    } catch (error) {
        console.error("Discover Error:", error);
        displayMessage("Failed to load tracks", "error");
    } finally {
        toggleLoader(false);
    }
}

function renderTracks(tracks) {
    if (tracks.length === 0) {
        resultsContainer.innerHTML = '<div class="col-span-full text-center text-text-secondary py-12">No songs found.</div>';
        return;
    }

    resultsContainer.innerHTML = tracks.map(track => {
        const image = track.imageUrl || track.album?.coverImage || 'assets/images/album/album1.png';
        const artist = track.artist?.name || track.artist?.username || "Unknown Artist";
        
        return `
        <div class="group bg-[#181818] p-4 rounded-lg hover:bg-[#282828] transition-all duration-300 cursor-pointer play-track-btn" data-id="${track._id}">
            <div class="relative w-full aspect-square mb-4 rounded-md overflow-hidden shadow-lg">
                <img src="${image}" alt="${track.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                <div class="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex justify-end">
                    <button class="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white shadow-lg shadow-primary/40 hover:scale-110 transition-transform">
                        <svg class="w-5 h-5 fill-current ml-1" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    </button>
                </div>
            </div>
            <h3 class="text-white font-bold truncate mb-1">${track.title}</h3>
            <p class="text-sm text-text-secondary truncate hover:underline">${artist}</p>
        </div>
        `;
    }).join('');
}

// Setup Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Parse URL params initially
    const query = new URLSearchParams(window.location.search);
    const searchParam = query.get('search');
    
    // Set input value if present (global search input might be different, handle local if exists)
    if(searchInput && searchParam) {
        searchInput.value = searchParam;
    }

    loadTracks();

    // Genre Filters
    genreButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update UI
            genreButtons.forEach(b => {
                b.classList.remove('bg-white', 'text-black');
                b.classList.add('bg-surface', 'text-text-secondary');
            });
            btn.classList.remove('bg-surface', 'text-text-secondary');
            btn.classList.add('bg-white', 'text-black');
            
            currentGenre = btn.dataset.genre || btn.innerText;
            if(currentGenre === 'All') currentGenre = '';
            
            // Clear search when filtering by genre for cleaner UX
            currentSearch = ''; 
            if(searchInput) searchInput.value = '';
            
            // Update URL without reload
            const url = new URL(window.location);
            url.searchParams.delete('search');
            if(currentGenre) url.searchParams.set('genre', currentGenre);
            else url.searchParams.delete('genre');
            window.history.pushState({}, '', url);
            
            loadTracks();
        });
    });
});
