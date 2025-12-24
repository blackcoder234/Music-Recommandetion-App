// 1. Mobile Menu Toggle
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');
if(mobileMenuBtn) {
    mobileMenuBtn.onclick = () => mobileMenu.classList.toggle('active');
}

// 2. Start Listening Button Logic
// Hero section-er "Start Listening Free" button-e click korle ditiyo website-e jabe
const startBtn = document.querySelector('.btn-hero-primary');
if(startBtn) {
    startBtn.onclick = () => {
        alert("Opening SoundWave Player...");
        window.location.href = "player.html"; // Eta tomar 2nd website-er link hobe
    };
}

// 3. Login / Sign In / Get Started Buttons
document.querySelectorAll('.btn-outline, .btn-primary, .btn-cta-primary').forEach(btn => {
    btn.onclick = () => {
        alert("Redirecting to Login/Sign-up Page...");
    };
});

// 4. Watch Demo Button
const demoBtn = document.querySelector('.btn-hero-secondary');
if(demoBtn) {
    demoBtn.onclick = () => {
        window.open('https://www.youtube.com', '_blank'); 
    };
}

// 5. Smooth Scroll (Features, About, Pricing button-er jonno)
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});