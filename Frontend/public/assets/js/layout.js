
export const PLAYER_HTML = `
    <!-- Player Bar -->
    <footer
      id="player-bar"
      class="hidden h-24 bg-[#181818] border-t border-white/5 flex items-center justify-between px-4 sm:px-6 z-50 fixed bottom-0 w-full cursor-pointer md:cursor-default transition-all duration-300"
    >
      <!-- Track Info -->
      <div class="flex items-center gap-4 w-1/3 min-w-0">
        <img
          id="track-image"
          src="" 
          alt="Album Art"
          class="w-14 h-14 rounded-md shadow-lg hidden sm:block bg-surface"
        />
        <div class="min-w-0">
          <div
            id="track-title"
            class="text-sm font-medium text-white truncate hover:underline cursor-pointer"
          >
            Select a song
          </div>
          <div
            id="track-artist"
            class="text-xs text-text-secondary truncate hover:underline cursor-pointer"
          >
            -
          </div>
        </div>
        <button
          id="like-btn"
          class="text-text-secondary hover:text-primary ml-2 hidden sm:block"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            ></path>
          </svg>
        </button>
      </div>

      <!-- Controls -->
      <div
        class="flex flex-col items-center max-w-lg w-full px-4"
        onclick="event.stopPropagation()"
      >
        <div class="flex items-center gap-6 mb-1">
          <button
            id="shuffle-btn"
            class="text-text-secondary hover:text-white transition-colors"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
              ></path>
            </svg>
          </button>
          <button
            id="prev-btn"
            class="text-text-secondary hover:text-white transition-colors"
          >
            <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
            </svg>
          </button>
          <button
            id="play-pause-btn"
            class="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform text-black shadow-lg shadow-white/10"
          >
            <svg
              id="play-icon"
              class="w-5 h-5 fill-current"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
            <svg
              id="pause-icon"
              class="w-5 h-5 fill-current hidden"
              viewBox="0 0 24 24"
            >
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          </button>
          <button
            id="next-btn"
            class="text-text-secondary hover:text-white transition-colors"
          >
            <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>
          <button
            id="repeat-btn"
            class="text-text-secondary hover:text-white transition-colors"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              ></path>
            </svg>
          </button>
        </div>
        <div
          class="w-full flex items-center gap-2 text-xs font-medium text-text-secondary"
        >
          <span id="time-current">0:00</span>
          <div
            id="progress-container"
            class="flex-1 h-1 bg-white/10 rounded-full group cursor-pointer relative"
          >
            <div
              id="progress-fill"
              class="absolute inset-y-0 left-0 bg-white w-0 group-hover:bg-primary rounded-full transition-all duration-100"
              style="width: 0%"
            ></div>
            <div
              id="progress-thumb"
              class="w-2.5 h-2.5 bg-white rounded-full absolute top-1/2 -translate-y-1/2 left-[0%] opacity-0 group-hover:opacity-100 shadow-md"
            ></div>
          </div>
          <span id="time-total">0:00</span>
        </div>
      </div>

      <!-- Volume -->
      <div
        class="flex items-center gap-2 w-1/3 justify-end"
        onclick="event.stopPropagation()"
      >
        <button class="text-text-secondary hover:text-white">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path>
            </svg>
        </button>
        <div
          id="volume-container"
          class="w-24 h-1 bg-white/10 rounded-full cursor-pointer relative group"
        >
          <div
            id="volume-fill"
            class="absolute inset-y-0 left-0 bg-white group-hover:bg-primary w-2/3 rounded-full"
          ></div>
        </div>
      </div>
    </footer>

    <!-- Mobile Full Screen Player Overlay (Simplified for injection) -->
    <div
      id="mobile-player"
      class="hidden fixed inset-0 bg-[#121212] z-[60] flex flex-col transform translate-y-full transition-transform duration-300 ease-in-out md:hidden"
    >
      <div class="flex items-center justify-between p-6">
        <button id="close-mobile-player" class="text-white p-2">
           <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
        </button>
        <span class="text-xs font-semibold tracking-widest text-text-secondary uppercase">Now Playing</span>
        <button class="text-white p-2"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"></path></svg></button>
      </div>

      <div class="flex-1 px-8 flex items-center justify-center">
        <div class="w-full aspect-square rounded-2xl overflow-hidden shadow-2xl relative">
          <img id="mobile-track-image" src="" class="w-full h-full object-cover bg-surface" />
        </div>
      </div>

      <div class="p-8 pb-12 space-y-8">
        <div class="flex justify-between items-end">
          <div>
            <h2 id="mobile-track-title" class="text-2xl font-bold text-white mb-1">Select a song</h2>
            <p id="mobile-track-artist" class="text-lg text-text-secondary">-</p>
          </div>
        </div>

        <div class="space-y-2">
            <div class="flex-1 h-1 bg-white/10 rounded-full relative group">
                <div id="mobile-progress-fill" class="absolute inset-y-0 left-0 bg-white rounded-full" style="width: 0%"></div>
            </div>
            <div class="flex justify-between text-xs text-text-secondary font-medium">
                <span id="mobile-time-current">0:00</span>
                <span id="mobile-time-total">0:00</span>
            </div>
        </div>

        <div class="flex items-center justify-between">
            <button><svg class="w-6 h-6 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg></button>
            <button title="Previous"><svg class="w-8 h-8 text-white fill-current" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg></button>
            <button id="mobile-play-btn" class="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white shadow-xl hover:scale-105 transition-transform">
                <svg id="mobile-play-icon" class="w-8 h-8 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                <svg id="mobile-pause-icon" class="w-8 h-8 fill-current hidden" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
            </button>
            <button title="Next"><svg class="w-8 h-8 text-white fill-current" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg></button>
            <button><svg class="w-6 h-6 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg></button>
        </div>
      </div>
    </div>
`;

export const MOBILE_NAV_HTML = `
    <!-- Mobile Bottom Navigation -->
    <nav class="md:hidden fixed bottom-0 w-full bg-[#121212] border-t border-white/5 flex justify-around items-center h-16 z-50 pb-safe">
      <a href="/" class="flex flex-col items-center gap-1 text-text-secondary hover:text-white">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
        <span class="text-[10px] font-medium">Home</span>
      </a>
      <a href="/discover" class="flex flex-col items-center gap-1 text-text-secondary hover:text-white">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        <span class="text-[10px] font-medium">Discover</span>
      </a>
      <a href="/library" class="flex flex-col items-center gap-1 text-text-secondary hover:text-white">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path></svg>
        <span class="text-[10px] font-medium">Library</span>
      </a>
      <a href="/profile" class="flex flex-col items-center gap-1 text-text-secondary hover:text-white">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <span class="text-[10px] font-medium">Profile</span>
      </a>
    </nav>
`;
