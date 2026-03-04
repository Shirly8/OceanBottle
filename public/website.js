// autoplay videos
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.screen__bg').forEach(video => {
    video.muted = true;
    video.play().catch(e => console.log('Video autoplay prevented:', e));
  });


  // play ambient sound
  const audio = document.getElementById('underwater-sound');
  if (audio) {
    audio.volume = 0.3;
    audio.play().catch(e => console.log('Audio autoplay blocked:', e));
  }
});



// scroll reveals — fade, spec, partner elements
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('on');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.fade, .spec, .partner').forEach(el => io.observe(el));
