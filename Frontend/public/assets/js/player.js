
import api from './api.js';
import { displayMessage } from './utils.js';

class AudioPlayer {
    constructor() {
        this.audio = new Audio();
        this.isPlaying = false;
        this.currentTrack = null;
        this.queue = [];
        this.originalQueue = []; // To un-shuffle
        this.currentIndex = 0;
        this.isShuffled = false;
        this.repeatMode = 'none'; // none, all, one

        // State for dragging
        this.isDraggingProgress = false;
        this.isDraggingVolume = false;

        // Defer DOM selection to allow for dynamic injection
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => { setTimeout(() => this.init(), 100); });
        } else {
            setTimeout(() => this.init(), 100);
        }
    }

    init() {
        // DOM Elements (Desktop)
        this.desktopPlayer = document.getElementById('player-bar');
        this.playPauseBtn = document.getElementById('play-pause-btn');
        this.playIcon = document.getElementById('play-icon');
        this.pauseIcon = document.getElementById('pause-icon');
        this.prevBtn = document.getElementById('prev-btn');
        this.nextBtn = document.getElementById('next-btn');
        this.shuffleBtn = document.getElementById('shuffle-btn');
        this.repeatBtn = document.getElementById('repeat-btn');
        this.progressBar = document.getElementById('progress-container');
        this.progressFill = document.getElementById('progress-fill');
        this.progressThumb = document.getElementById('progress-thumb');
        this.timeCurrent = document.getElementById('time-current');
        this.timeTotal = document.getElementById('time-total');
        this.volumeBtn = document.getElementById('volume-btn');
        this.volumeBar = document.getElementById('volume-container');
        this.volumeFill = document.getElementById('volume-fill');
        
        this.trackTitle = document.getElementById('track-title');
        this.trackArtist = document.getElementById('track-artist');
        this.trackImage = document.getElementById('track-image');

        // DOM Elements (Mobile)
        this.mobilePlayer = document.getElementById('mobile-player');
        this.closeMobilePlayerBtn = document.getElementById('close-mobile-player');
        this.mobilePlayBtn = document.getElementById('mobile-play-btn');
        this.mobilePlayIcon = document.getElementById('mobile-play-icon');
        this.mobilePauseIcon = document.getElementById('mobile-pause-icon');
        this.mobileTrackTitle = document.getElementById('mobile-track-title');
        this.mobileTrackArtist = document.getElementById('mobile-track-artist');
        this.mobileTrackImage = document.getElementById('mobile-track-image');
        this.mobileProgressFill = document.getElementById('mobile-progress-fill');
        this.mobileTimeCurrent = document.getElementById('mobile-time-current');
        this.mobileTimeTotal = document.getElementById('mobile-time-total');

        // Event Listeners - Controls
        if (this.playPauseBtn) this.playPauseBtn.onclick = () => this.togglePlay();
        if (this.mobilePlayBtn) this.mobilePlayBtn.onclick = () => this.togglePlay();
        
        if (this.nextBtn) this.nextBtn.onclick = () => this.next();
        if (this.prevBtn) this.prevBtn.onclick = () => this.prev();
        
        if (this.shuffleBtn) this.shuffleBtn.onclick = () => this.toggleShuffle();
        if (this.repeatBtn) this.repeatBtn.onclick = () => this.toggleRepeat();

        // Seek
        if (this.progressBar) {
            this.progressBar.addEventListener('click', (e) => this.seek(e, this.progressBar));
            this.progressBar.addEventListener('mousedown', () => { this.isDraggingProgress = true; });
        }
        // Mobile Seek (add logic if mobile player exists element)

        // Volume
        if (this.volumeBar) {
            this.volumeBar.addEventListener('click', (e) => this.setVolume(e));
            this.volumeBar.addEventListener('mousedown', () => { this.isDraggingVolume = true; });
        }
        if (this.volumeBtn) this.volumeBtn.onclick = () => this.toggleMute();

        // Dragging Global Listeners
        document.addEventListener('mousemove', (e) => {
            if (this.isDraggingProgress) this.seek(e, this.progressBar);
            if (this.isDraggingVolume) this.setVolume(e);
        });
        document.addEventListener('mouseup', () => {
            this.isDraggingProgress = false;
            this.isDraggingVolume = false;
        });

        // Mobile Overlay Toggles
        if (this.desktopPlayer) {
            // Open mobile player when clicking on track info in desktop bar only if screen is small?
            // Actually, usually tapping the mini player opens full player on mobile.
            // The desktop player bar acts as mini player on mobile (styled differently).
            this.desktopPlayer.addEventListener('click', (e) => {
                // If clicking controls, don't open
                if (e.target.closest('button') || e.target.closest('#volume-container') || e.target.closest('#progress-container')) return;
                
                if (window.innerWidth < 768) { // Mobile check
                    this.openMobilePlayer();
                }
            });
        }
        if (this.closeMobilePlayerBtn) {
            this.closeMobilePlayerBtn.onclick = () => this.closeMobilePlayer();
        }

        // Audio Events
        this.audio.ontimeupdate = () => this.updateProgress();
        this.audio.onended = () => this.onTrackEnd();
        this.audio.onloadedmetadata = () => {
             const formatted = this.formatTime(this.audio.duration);
             if (this.timeTotal) this.timeTotal.textContent = formatted;
             if (this.mobileTimeTotal) this.mobileTimeTotal.textContent = formatted;
        };

        // Initialize Volume
        this.audio.volume = 0.7; // Default
        this.updateVolumeUI();

        // Global Access
        window.player = this;
        window.playTrack = (id) => this.playTrackById(id);
        
        // Listen for global clicks
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.play-track-btn');
            if (btn) {
                e.preventDefault();
                e.stopPropagation();
                const id = btn.dataset.id;
                if (id) this.playTrackById(id);
            }
        });
    }

    setQueue(tracks) {
        this.queue = tracks;
        this.originalQueue = [...tracks];
        if (this.isShuffled) {
            this.shuffleQueue();
        }
    }

    shuffleQueue() {
        // Keep current track first if playing
        let current = null;
        if (this.currentTrack) {
            current = this.currentTrack;
        }
        
        // Filter out current from shuffle pool
        const pool = this.originalQueue.filter(t => !current || t._id !== current._id);
        
        // Shuffle pool
        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        
        // Reassemble
        if (current) this.queue = [current, ...pool];
        else this.queue = pool;
        
        this.currentIndex = 0; // Current track is now first
    }

    toggleShuffle() {
        this.isShuffled = !this.isShuffled;
        
        // Visual
        if (this.shuffleBtn) {
             this.shuffleBtn.style.color = this.isShuffled ? '#1DB954' : ''; // Primary Color
        }

        if (this.isShuffled) {
            this.shuffleQueue();
        } else {
            // Restore order
            // Find current track index in original
            const currentId = this.currentTrack ? this.currentTrack._id : null;
            this.queue = [...this.originalQueue];
            if (currentId) {
                this.currentIndex = this.queue.findIndex(t => t._id === currentId);
            }
        }
    }

    toggleRepeat() {
        // none -> all -> one -> none
        if (this.repeatMode === 'none') this.repeatMode = 'all';
        else if (this.repeatMode === 'all') this.repeatMode = 'one';
        else this.repeatMode = 'none';

        // Visual
        if (this.repeatBtn) {
            this.repeatBtn.style.color = this.repeatMode !== 'none' ? '#1DB954' : '';
            // Ideally replace icon for 'one'
            if (this.repeatMode === 'one') {
                this.repeatBtn.innerHTML = `
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15 M10 15a1 1 0 011-1h1a1 1 0 011 1v1a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1z"></path>
                </svg>`;
            } else {
                 this.repeatBtn.innerHTML = `
                 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                 </svg>`;
            }
        }
    }

    async playTrackById(id) {
        try {
            // Check queue
            const queueIndex = this.queue.findIndex(t => t._id === id);
            
            if (queueIndex !== -1) {
                this.currentIndex = queueIndex;
                const track = this.queue[queueIndex];
                
                if (this.currentTrack && this.currentTrack._id === id) {
                    this.togglePlay();
                    return;
                }
                
                this.loadTrack(track);
                return;
            }

            // Fetch
            const response = await api.request(`/tracks/${id}`);
            const track = response.data;
            
            if (!track) throw new Error("Track not found");

            // If not in queue, add to original queue and play
            // Or reset queue? Logic depends on app. 
            // Often if playing from a text link, we might replace queue or add.
            // Let's replace queue for simplicity
            this.setQueue([track]);
            this.currentIndex = 0;
            
            this.loadTrack(track);

        } catch (error) {
            console.error("Play Error:", error);
            displayMessage("Could not play track", "error");
        }
    }

    loadTrack(track) {
        this.currentTrack = track;
        this.audio.src = track.trackFile || track.audioUrl; 
        
        this.updateUI(track);
        
        if(this.desktopPlayer) this.desktopPlayer.classList.remove('hidden');

        this.play();
    }

    play() {
        this.audio.play().then(() => {
            this.isPlaying = true;
            this.updateIcons();
        }).catch(err => {
            console.error("Autoplay prevented", err);
        });
    }

    pause() {
        this.audio.pause();
        this.isPlaying = false;
        this.updateIcons();
    }

    togglePlay() {
        if (this.isPlaying) this.pause();
        else this.play();
    }

    updateIcons() {
        const showPlay = !this.isPlaying;
        
        // Desktop
        if (this.playIcon) this.playIcon.classList.toggle('hidden', !showPlay);
        if (this.pauseIcon) this.pauseIcon.classList.toggle('hidden', showPlay);
        
        // Mobile
        if (this.mobilePlayIcon) this.mobilePlayIcon.classList.toggle('hidden', !showPlay);
        if (this.mobilePauseIcon) this.mobilePauseIcon.classList.toggle('hidden', showPlay);
    }

    updateUI(track) {
        const title = track.title || "Unknown Title";
        const artist = track.artist?.name || track.artist?.username || "Unknown Artist";
        const image = track.imageUrl || track.album?.coverImage || 'assets/images/album/album1.png';

        // Desktop
        if (this.trackTitle) this.trackTitle.textContent = title;
        if (this.trackArtist) this.trackArtist.textContent = artist;
        if (this.trackImage) this.trackImage.src = image;

        // Mobile
        if (this.mobileTrackTitle) this.mobileTrackTitle.textContent = title;
        if (this.mobileTrackArtist) this.mobileTrackArtist.textContent = artist;
        if (this.mobileTrackImage) this.mobileTrackImage.src = image;
    }

    updateProgress() {
        if (this.isDraggingProgress) return; // Don't update while dragging

        const current = this.audio.currentTime;
        const duration = this.audio.duration;
        const percent = duration ? (current / duration) * 100 : 0;

        if (this.progressFill) this.progressFill.style.width = `${percent}%`;
        if (this.progressThumb) this.progressThumb.style.left = `${percent}%`;
        if (this.timeCurrent) this.timeCurrent.textContent = this.formatTime(current);

        if (this.mobileProgressFill) this.mobileProgressFill.style.width = `${percent}%`;
        if (this.mobileTimeCurrent) this.mobileTimeCurrent.textContent = this.formatTime(current);
    }

    seek(e, bar) {
        if (!this.audio.duration) return;
        
        const rect = bar.getBoundingClientRect();
        let x = e.clientX - rect.left;
        const width = rect.width;
        
        // Clamp
        if (x < 0) x = 0;
        if (x > width) x = width;

        const percent = x / width;
        this.audio.currentTime = percent * this.audio.duration;
        
        // Visual Update immediate
        if (this.progressFill) this.progressFill.style.width = `${percent * 100}%`;
        if (this.progressThumb) this.progressThumb.style.left = `${percent * 100}%`;
    }

    setVolume(e) {
        const rect = this.volumeBar.getBoundingClientRect();
        let x = e.clientX - rect.left;
        const width = rect.width;
        
        // Clamp
        if (x < 0) x = 0;
        if (x > width) x = width;

        const volume = x / width;
        this.audio.volume = volume;
        this.updateVolumeUI();
    }
    
    toggleMute() {
        if (this.audio.volume > 0) {
            this.lastVolume = this.audio.volume;
            this.audio.volume = 0;
        } else {
            this.audio.volume = this.lastVolume || 0.7;
        }
        this.updateVolumeUI();
    }

    updateVolumeUI() {
        const percent = this.audio.volume * 100;
        if (this.volumeFill) this.volumeFill.style.width = `${percent}%`;
    }

    next() {
        if (this.queue.length === 0) return;

        if (this.repeatMode === 'one') {
            this.audio.currentTime = 0;
            this.play();
            return;
        }

        if (this.currentIndex < this.queue.length - 1) {
            this.currentIndex++;
            this.loadTrack(this.queue[this.currentIndex]);
        } else if (this.repeatMode === 'all') {
            this.currentIndex = 0;
            this.loadTrack(this.queue[this.currentIndex]);
        }
    }

    prev() {
        if (this.audio.currentTime > 3) {
            this.audio.currentTime = 0;
            return;
        }
        
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.loadTrack(this.queue[this.currentIndex]);
        } else if (this.repeatMode === 'all') {
             this.currentIndex = this.queue.length - 1;
             this.loadTrack(this.queue[this.currentIndex]);
        }
    }

    onTrackEnd() {
        if (this.repeatMode === 'one') {
             this.audio.currentTime = 0;
             this.play();
        } else {
            this.next();
        }
    }

    openMobilePlayer() {
        if (this.mobilePlayer) {
            this.mobilePlayer.classList.remove('hidden');
            // Small delay to allow display block to take effect before transition
            requestAnimationFrame(() => {
                this.mobilePlayer.classList.remove('translate-y-full');
            });
        }
    }

    closeMobilePlayer() {
        if (this.mobilePlayer) {
            this.mobilePlayer.classList.add('translate-y-full');
            setTimeout(() => {
                this.mobilePlayer.classList.add('hidden');
            }, 300); // Match transition duration
        }
    }

    formatTime(seconds) {
        if (!seconds) return "0:00";
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    }
}

const player = new AudioPlayer();
export default player;
