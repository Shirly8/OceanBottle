// Smooth scroll behavior for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// Ensure videos autoplay properly
document.addEventListener('DOMContentLoaded', () => {
  const videos = document.querySelectorAll('.background-video');

  videos.forEach(video => {
    video.muted = true;
    video.play().catch(error => {
      console.log('Video autoplay prevented:', error);
    });
  });
});

// Intersection Observer for scroll animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('fade-in');
    }
  });
}, observerOptions);

// Observe sections for fade-in effects
document.querySelectorAll('.section').forEach(section => {
  observer.observe(section);
});
