
import api from '../api.js';
import { displayMessage, toggleLoader } from '../utils.js';

// State
let currentSearch = '';
let currentGenre = '';
let currentMood = '';
let currentPage = 1;
let hasNextPage = true;
let isLoading = false;
let allTracks = []; // Local cache of rendering

// DOM Elements vars
let searchInput;
let resultsContainer;
let genreButtons;
let moodSelect;
let loadMoreBtn;
let browseSection;
let resultsTitle;

export function init() {
    console.log("Initializing Discover Page...");
    
    // Bind Elements
    searchInput = document.getElementById('discover-search');
    resultsContainer = document.getElementById('discover-results');
    genreButtons = document.querySelectorAll('.genre-filter');
    moodSelect = document.getElementById('mood-filter');
    loadMoreBtn = document.getElementById('load-more-btn');
    browseSection = document.getElementById('browse-all-section');
    resultsTitle = document.getElementById('results-title');

    // Parse URL params
    const query = new URLSearchParams(window.location.search);
    const searchParam = query.get('search');
    const genreParam = query.get('genre');
    const moodParam = query.get('mood');
    
    if (searchParam) {
        currentSearch = searchParam;
        if(searchInput) searchInput.value = searchParam;
    }
    if (genreParam) {
        currentGenre = genreParam;
        updateGenreUI(currentGenre);
    }
    if (moodParam) {
        currentMood = moodParam;
        if(moodSelect) moodSelect.value = currentMood;
    }

    // Event Listeners
    if (searchInput) {
        searchInput.addEventListener('input', debounce((e) => {
            currentSearch = e.target.value;
            resetAndLoad();
        }, 500));
    }

    if (genreButtons) {
        genreButtons.forEach(btn => {
            btn.onclick = () => {
                const genre = btn.dataset.genre;
                if(currentGenre === genre) {
                     // Toggle off if same clicked? Standard behavior: Yes or No. 
                     // Usually "All" is default.
                     if(genre !== 'All') {
                         currentGenre = '';
                         updateGenreUI('All');
                     }
                } else {
                    currentGenre = genre === 'All' ? '' : genre;
                    updateGenreUI(genre);
                }
                resetAndLoad();
            };
        });
    }

    if (moodSelect) {
        moodSelect.addEventListener('change', (e) => {
            currentMood = e.target.value === 'All' ? '' : e.target.value;
            resetAndLoad();
        });
    }

    if (loadMoreBtn) {
        loadMoreBtn.onclick = () => {
            if(!isLoading && hasNextPage) {
                currentPage++;
                loadTracks(true);
            }
        };
    }

    // Browse Cards
    const browseCards = document.querySelectorAll('.browse-card');
    if (browseCards) {
        browseCards.forEach(card => {
            card.onclick = () => {
                const type = card.dataset.type;
                const value = card.dataset.value;
                
                // Reset Filters
                currentSearch = '';
                if(searchInput) searchInput.value = '';

                if (type === 'genre') {
                    currentGenre = value;
                    updateGenreUI(value);
                    // Standard UX: Picking a genre might not clear mood, but usually does to avoid 0 results
                    currentMood = ''; 
                    if(moodSelect) moodSelect.value = '';
                } else if (type === 'mood') {
                    currentMood = value;
                    if(moodSelect) moodSelect.value = value;
                    // Keep genre? Or reset? Let's reset genre to widen search for that mood
                    currentGenre = '';
                    updateGenreUI('All');
                }
                
                // Scroll to top of results (or top of page)
                const headerOffset = 100;
                const elementPosition = resultsTitle.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                
                window.scrollTo({
                     top: 0, // simple top
                     behavior: "smooth"
                });

                resetAndLoad();
            };
        });
    }

    // Initial Load
    resetAndLoad();
}

function updateGenreUI(activeGenre) {
    if (!genreButtons) return;
    genreButtons.forEach(btn => {
        const g = btn.dataset.genre;
        const isActive = g === activeGenre || (activeGenre === '' && g === 'All');
        
        if (isActive) {
            btn.classList.remove('bg-surface', 'text-text-secondary', 'border-white/5');
            btn.classList.add('bg-white', 'text-black', 'border-transparent');
        } else {
            btn.classList.add('bg-surface', 'text-text-secondary', 'border-white/5');
            btn.classList.remove('bg-white', 'text-black', 'border-transparent');
        }
    });
}

function resetAndLoad() {
    currentPage = 1;
    allTracks = [];
    hasNextPage = true;
    if (loadMoreBtn) loadMoreBtn.classList.add('hidden');
    loadTracks(false);
}

async function loadTracks(append = false) {
    if (isLoading) return;
    isLoading = true;

    if (!append) {
        toggleLoader(true);
        if (resultsContainer) resultsContainer.innerHTML = '';
        updateTitle();
    } else {
        if(loadMoreBtn) loadMoreBtn.textContent = 'Loading...';
    }

    try {
        let endpoint = `/tracks?page=${currentPage}&limit=20`;
        if (currentSearch) endpoint += `&search=${encodeURIComponent(currentSearch)}`;
        if (currentGenre) endpoint += `&genre=${encodeURIComponent(currentGenre)}`;
        if (currentMood) endpoint += `&mood=${encodeURIComponent(currentMood)}`;

        // Suppress redirect so guests can browse
        const response = await api.request(endpoint, { suppressAuthRedirect: true });
        const tracks = response.data.tracks || [];
        const pagination = response.data.pagination || {};

        if (append) {
            allTracks = [...allTracks, ...tracks];
        } else {
            allTracks = tracks;
        }

        hasNextPage = pagination.page < pagination.totalPages;

        renderTracks(tracks, append);

    } catch (error) {
        console.error("Discover Load Error:", error);
        displayMessage("Failed to load tracks", "error");
        if (!append && resultsContainer) resultsContainer.innerHTML = '<div class="col-span-full text-center text-text-secondary py-12">Something went wrong.</div>';
    } finally {
        isLoading = false;
        if (!append) toggleLoader(false);
        
        if (loadMoreBtn) {
            if (hasNextPage) {
                loadMoreBtn.classList.remove('hidden');
                loadMoreBtn.textContent = 'Load More';
            } else {
                loadMoreBtn.classList.add('hidden');
            }
        }
        
        // Update URL
        updateURLState();
    }
}

function updateTitle() {
    if (!resultsTitle) return;
    if (currentSearch) resultsTitle.textContent = `Results for "${currentSearch}"`;
    else if (currentGenre) resultsTitle.textContent = `${currentGenre} Music`;
    else if (currentMood) resultsTitle.textContent = `${currentMood} Vibes`;
    else resultsTitle.textContent = 'Discover';
}

function updateURLState() {
    const url = new URL(window.location);
    if(currentSearch) url.searchParams.set('search', currentSearch);
    else url.searchParams.delete('search');
    
    if(currentGenre) url.searchParams.set('genre', currentGenre);
    else url.searchParams.delete('genre');

    if(currentMood) url.searchParams.set('mood', currentMood);
    else url.searchParams.delete('mood');

    window.history.replaceState({}, '', url);
}

function renderTracks(tracks, append) {
    if (!resultsContainer) return;
    
    if (!append && tracks.length === 0) {
        resultsContainer.innerHTML = '<div class="col-span-full text-center text-text-secondary py-12 flex flex-col items-center"><svg class="w-12 h-12 mb-4 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>No songs found matching your criteria.</div>';
        return;
    }

    const html = tracks.map(track => {
        const image = track.imageUrl || track.album?.coverImage || 'assets/images/album/default_album.png';
        const artist = track.artist?.name || track.artist?.username || "Unknown Artist";
        const artistId = track.artist?._id || track.artist?.id;
        const artistHtml = artistId 
             ? `<span class="hover:underline hover:text-white cursor-pointer" onclick="event.stopPropagation(); navigateToArtist('${artistId}')">${artist}</span>`
             : artist;
        const trackId = track._id || track.id; // handle potentially different ID fields
        
        return `
        <div class="group cursor-pointer bg-[#181818] p-4 rounded-xl hover:bg-[#282828] transition-all duration-300 relative play-track-btn" data-id="${trackId}">
            <div class="relative w-full aspect-square mb-4 rounded-lg overflow-hidden shadow-lg">
                <img src="${image}" alt="${track.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy">
                
                 <!-- Overlay Actions -->
                <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                   
                    <!-- Like Button -->
                    <button 
                        onclick="event.stopPropagation(); window.toggleLike('${trackId}')"
                        class="w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white backdrop-blur-md transition-colors transform hover:scale-105"
                        title="Like"
                    >
                         <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                    </button>

                    <!-- Play -->
                    <button class="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white shadow-xl shadow-primary/40 hover:scale-110 active:scale-95 transition-all">
                        <svg class="w-6 h-6 ml-1 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    </button>

                    <!-- Add to Playlist -->
                    <button 
                        onclick="event.stopPropagation(); window.openAddToPlaylistModal('${trackId}')"
                        class="w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white backdrop-blur-md transition-all transform hover:scale-105"
                        title="Add to Playlist"
                    >
                         <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                    </button>
                    
                </div>
            </div>
            <h3 class="text-white font-bold truncate mb-1 text-base">${track.title}</h3>
            <p class="text-xs text-text-secondary truncate transition-colors">${artistHtml}</p>
        </div>
        `;
    }).join('');

    if (append) {
        resultsContainer.insertAdjacentHTML('beforeend', html);
    } else {
        resultsContainer.innerHTML = html;
    }
}

// Utils
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}
