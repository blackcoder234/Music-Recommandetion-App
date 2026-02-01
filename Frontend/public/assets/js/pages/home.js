
import api from '../api.js';
import Auth from '../auth.js';
import { displayMessage } from '../utils.js';

export async function init() {
    console.log("Initializing Home Page...");
    try {
        await Promise.all([
            loadRecentlyPlayed(),
            loadMadeForYou(),
            loadWeeklyTop(),
            loadNewReleases(),
            loadTrendingTable()
        ]);
        
        // Add Greeting based on time
        updateGreeting();

    } catch (error) {
        console.error("Home Page Load Error:", error);
    }
}

function updateGreeting() {
    const greetingEl = document.getElementById('home-greeting');
    if (!greetingEl) return;
    
    const h = new Date().getHours();
    let text = "Good Morning";
    if (h >= 12 && h < 18) text = "Good Afternoon";
    else if (h >= 18) text = "Good Evening";
    
    // Check if user is logged in
    // Note: We can't easily wait for Auth.getCurrentUser here if we want instant render.
    // But we can check if greeting usually includes name. Standard is just the greeting or "Good Morning, User".
    // For now, simpler: "Recently Played" is the section title.
    // Wait, the user asked for "Personalized Greeting".
    // "Good Morning" is good.
    // If I change the ID `home-greeting` content, I change the section title "Recently Played".
    // Ah, in index.html I put `Recently Played` inside the H3 with ID `home-greeting`.
    // So if I overwrite it, I lose "Recently Played".
    // Better logic: If we have recently played items, show "Recently Played".
    // The Greeting should ideally be separate.
    // But let's assume the user wants the Section Title to be the Greeting if valid? 
    // Or maybe I should specificy "Recently Played" as subtitle?
    // Let's prepend the greeting to a separate container if possible, or just set the text to "Good Morning" and let the content imply it's recent.
    // Actually, "Recently Played" is specific. "Good Morning" is vague. 
    // Let's stick to "Recently Played" as the title for that section.
    // And add a separate Greeting Header at the very top of the Dashboard content?
    // The user's layout in index.html has Hero Section first.
    // Standard is: Greeting -> Recents -> Hero -> Others.
    // But we have Hero -> Recents.
    // Let's just update the "Recently Played" title to "Recently Played" (Keep it)
    // And MAYBE insert a Greeting above the Hero? 
    // Let's skip the greeting text for now unless I move the Hero down.
    // But wait, the user request: "Add a 'Good Morning' greeting".
    // I will dynamically prepend it to the Main Container if I can.
    // For now, let's just focus on Recents and Hover Actions. I will modify the H3 only if it is "Good Morning".
    // Actually, I will set the H3 to "Recently Played" (default).
}

async function loadRecentlyPlayed() {
    const section = document.getElementById('recently-played-section');
    const container = document.getElementById('recently-played-container');
    if (!section || !container) return;

    // Check Auth
    const user = await Auth.getCurrentUser();
    if (!user) {
        // Guest -> Hide section
        section.classList.add('hidden');
        return;
    }

    try {
        // Fetch History
        // Endpoint: /playback/history
        const response = await api.request('/playback/history?limit=10');
        const history = response.data.history || []; // adjusted based on potential response structure?
        // Actually response might be array or { history: [] }
        // Let's assume standard ApiResponse structure.
        
        // Map history items (which have `track` populated) to track list
        // Filter out null tracks
        const tracks = history.map(h => h.track).filter(t => t);
        
        // Deduplicate by ID
        const uniqueTracks = [];
        const seen = new Set();
        for(const t of tracks) {
            if(!seen.has(t._id)) {
                seen.add(t._id);
                uniqueTracks.push(t);
            }
        }

        if (uniqueTracks.length === 0) {
            section.classList.add('hidden');
            return;
        }

        renderHorizontalList(container, uniqueTracks);
        section.classList.remove('hidden');

        // Since we have recents, maybe we update the title to Greeting?
        const h = new Date().getHours();
        let greeting = "Good Morning";
        if (h >= 12 && h < 18) greeting = "Good Afternoon";
        else if (h >= 18) greeting = "Good Evening";
        
        const titleEl = document.getElementById('home-greeting');
        if(titleEl) {
            titleEl.innerHTML = `<span class="opacity-70">${greeting}</span> <span class="mx-2">&bull;</span> Recently Played`;
        }

    } catch (error) {
        console.error("Failed to load history", error);
        section.classList.add('hidden');
    }
}

async function loadMadeForYou() {
    const section = document.getElementById('made-for-you-section');
    const container = document.getElementById('made-for-you-container');
    if (!section || !container) return;

    // Recommendations require authentication
    const user = await Auth.getCurrentUser();
    if (!user) return;

    try {
        const response = await api.request('/recommendation/for-you?limit=10', { 
            suppressAuthRedirect: true 
        });
        const tracks = response.data.tracks || [];

        if (tracks.length > 0) {
            renderHorizontalList(container, tracks);
            section.classList.remove('hidden');
        } else {
            section.classList.add('hidden');
        }
    } catch (error) {
        console.error("Failed to load Recommendations", error);
        section.classList.add('hidden');
    }
}

async function loadWeeklyTop() {
    const container = document.getElementById('weekly-top-songs-container');
    if (!container) return;

    try {
        const response = await api.request('/tracks?sort=-playCount&limit=10', {
            suppressAuthRedirect: true
        });
        const tracks = response.data.tracks || [];
        renderHorizontalList(container, tracks);
    } catch (error) {
        console.error("Failed to load Top Songs", error);
        container.innerHTML = `<div class="text-text-secondary pl-4">Unable to load charts.</div>`;
    }
}

async function loadNewReleases() {
    const container = document.getElementById('new-releases-container');
    if (!container) return;

    try {
        const response = await api.request('/tracks?sort=-createdAt&limit=10', {
             suppressAuthRedirect: true 
        });
        const tracks = response.data.tracks || [];
        renderHorizontalList(container, tracks);
    } catch (error) {
        console.error("Failed to load New Releases", error);
         container.innerHTML = `<div class="text-text-secondary pl-4">Unable to load releases.</div>`;
    }
}

async function loadTrendingTable() {
    const container = document.getElementById('trending-songs-body');
    if (!container) return;

    try {
        // Use Like count for Trending
        const response = await api.request('/tracks?sort=-likeCount&limit=5', {
             suppressAuthRedirect: true 
        });
        const tracks = response.data.tracks || [];
        renderTableRows(container, tracks);
    } catch (error) {
        console.error("Failed to load Trending Songs", error);
        container.innerHTML = `<tr><td colspan="5" class="text-text-secondary text-center py-4">Unable to load trending songs.</td></tr>`;
    }
}

function renderHorizontalList(container, tracks) {
    if (tracks.length === 0) {
        container.innerHTML = '<div class="text-text-secondary pl-4">No tracks found.</div>';
        return;
    }

    container.innerHTML = tracks.map(track => {
        const image = track.imageUrl || track.album?.coverImage || 'assets/images/album/default_album.png';
        const artist = track.artist?.name || track.artist?.username || "Unknown Artist";
        const artistId = track.artist?._id || track.artist?.id;
        const artistHtml = artistId 
             ? `<span class="hover:underline hover:text-white cursor-pointer" onclick="event.stopPropagation(); navigateToArtist('${artistId}')">${artist}</span>`
             : artist;
        const trackId = track._id || track.id;

        return `
        <div class="group cursor-pointer min-w-[160px] w-[160px] md:min-w-[180px] md:w-[180px] snap-start relative" data-id="${trackId}">
            <div class="relative aspect-square rounded-xl overflow-hidden mb-3 bg-[#181818] shadow-lg play-track-btn" data-id="${trackId}">
                <img 
                    src="${image}" 
                    alt="${track.title}" 
                    class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                >
                <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-[2px]">
                    <!-- Like Button -->
                    <button 
                        onclick="event.stopPropagation(); window.toggleLike('${trackId}')"
                        class="w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white backdrop-blur-md transition-colors"
                        title="Like"
                    >
                         <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                    </button>

                    <!-- Play Button -->
                    <button class="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white shadow-xl shadow-primary/30 hover:scale-110 active:scale-95 transition-all">
                        <svg class="w-6 h-6 ml-1 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    </button>
                    
                     <!-- Add to Playlist Button -->
                     <button onclick="event.stopPropagation(); window.openAddToPlaylistModal('${trackId}')" class="w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white backdrop-blur-md transition-colors" title="Add to Playlist">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                     </button>
                </div>
            </div>
            <h4 class="font-bold text-white truncate text-sm md:text-base">${track.title}</h4>
            <p class="text-xs md:text-sm text-text-secondary truncate hover:text-white transition-colors">${artistHtml}</p>
        </div>
        `;
    }).join('');
}

function renderTableRows(container, tracks) {
    if (tracks.length === 0) {
        container.innerHTML = '<tr><td colspan="5" class="text-text-secondary text-center py-4">No trending songs found.</td></tr>';
        return;
    }

    container.innerHTML = tracks.map((track, index) => {
        const image = track.imageUrl || track.album?.coverImage || 'assets/images/album/default_album.png';
        const artist = track.artist?.name || track.artist?.username || "Unknown Artist";
        const artistId = track.artist?._id || track.artist?.id;
        const artistHtml = artistId 
             ? `<span class="hover:underline hover:text-white cursor-pointer" onclick="event.stopPropagation(); navigateToArtist('${artistId}')">${artist}</span>`
             : artist;
        const albumName = track.album?.title || "Single";
        const minutes = Math.floor(track.duration / 60);
        const seconds = Math.floor(track.duration % 60);
        const durationStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        const trackId = track._id || track.id;

        return `
        <tr class="group hover:bg-white/5 transition-colors cursor-pointer play-track-btn" data-id="${trackId}">
            <td class="px-4 py-4 text-text-secondary w-12 text-center">${index + 1}</td>
            <td class="px-4 py-4">
              <div class="flex items-center gap-4">
                <img
                  src="${image}"
                  class="w-10 h-10 rounded object-cover shadow-sm"
                  loading="lazy"
                />
                <div class="min-w-0">
                  <div class="font-medium text-white group-hover:text-primary transition-colors truncate max-w-[150px] md:max-w-[200px]">
                    ${track.title}
                  </div>
                  <div class="text-xs text-text-secondary truncate max-w-[150px]">${artistHtml}</div>
                </div>
              </div>
            </td>
            <td class="px-4 py-4 text-text-secondary hidden md:table-cell truncate max-w-[150px]">
              ${albumName}
            </td>
            <td class="px-4 py-4 text-text-secondary hidden sm:table-cell w-20">
              ${durationStr}
            </td>
            <td class="px-4 py-4 w-16 text-right">
              <button 
                onclick="event.stopPropagation(); window.openAddToPlaylistModal('${trackId}')" 
                class="opacity-0 group-hover:opacity-100 text-text-secondary hover:text-white p-2 transition-all transform hover:scale-110 mr-1"
                title="Add to Playlist"
              >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
              </button>
              <button 
                onclick="event.stopPropagation(); window.toggleLike('${trackId}')"
                class="opacity-0 group-hover:opacity-100 text-text-secondary hover:text-primary p-2 transition-all transform hover:scale-110"
                title="Like"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                </svg>
              </button>
            </td>
        </tr>
        `;
    }).join('');
}
