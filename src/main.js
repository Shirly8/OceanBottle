import './app.css';
import { initOceanScene, disposeOceanScene, hideBottles, spawnOceanBottleLogo, checkCameraProximity, fadeOutLogo } from './ocean-scene.js';


// text-to-speech — american male voice
const speak = (text) => {
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 0.8;
    utterance.volume = 0.7;

    const voices = speechSynthesis.getVoices();
    const americanVoice = voices.find(voice =>
      voice.name.includes('Aaron') ||
      voice.name.includes('Tom') ||
      voice.name.includes('Evan') ||
      voice.name.includes('Fred') ||
      (voice.name.includes('Google') && voice.name.includes('US')) ||
      (voice.lang === 'en-US' && voice.name.toLowerCase().includes('male'))
    ) || voices.find(voice => voice.lang === 'en-US');

    if (americanVoice) utterance.voice = americanVoice;
    speechSynthesis.speak(utterance);
  }
};


// preload voices
if ('speechSynthesis' in window) {
  speechSynthesis.getVoices();
  speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices();
}


// underwater ambient sound
let underwaterAudio = null;

const playUnderwaterSound = () => {
  if (!underwaterAudio) {
    underwaterAudio = new Audio('/Effects/UnderWater.mp3');
    underwaterAudio.loop = true;
    underwaterAudio.volume = 0.4;
  }
  underwaterAudio.play().catch(e => console.log('Audio play error:', e));
};

const stopUnderwaterSound = () => {
  if (underwaterAudio) {
    underwaterAudio.pause();
    underwaterAudio.currentTime = 0;
  }
};



document.addEventListener('DOMContentLoaded', () => {
  const appContainer = document.getElementById('app');


  // store bottle count — shared across screens
  let count = 2;



  /* ═══════════════════════════════════════
     S1 — INTRO SCREEN
     Counter input, yearly calc, CTA
  ═══════════════════════════════════════ */
  const firstScreen = `
    <div id="first-screen" class="screen">
      <video autoplay muted loop playsinline class="screen__bg" preload="metadata">
        <source src="/Images/background1.mp4" type="video/mp4">
      </video>

      <nav class="nav">
        <a class="nav__logo" href="https://oceanbottle.co/">
          <span>ocean</span><span>bottle</span>
        </a>
      </nav>

      <div class="intro-body">
        <span class="intro-label fade">Your impact starts here</span>

        <h1 class="intro-q fade">
          How many plastic water bottles<br>
          do you use <span class="accent">per day?</span>
        </h1>

        <div class="intro-controls fade">

          <!-- counter -->
          <div class="counter">
            <button class="counter-btn" id="btn-minus" aria-label="Decrease">−</button>
            <div class="counter-val" id="bottle-count">2</div>
            <button class="counter-btn" id="btn-plus" aria-label="Increase">+</button>
          </div>

          <!-- meta + go button -->
          <div class="intro-meta">
            <p class="intro-meta-text">= <strong id="yearly-num">730</strong> bottles this year</p>
            <button class="btn btn--fill" id="btn-ok">
              See your impact
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </div>

        </div>
      </div>

      <p class="scene-cap">Your daily plastic usage is just a drop in the ocean, but it adds up.</p>
    </div>
  `;



  /* ═══════════════════════════════════════
     S2 — LOADING SCREEN
     Sonar animation, progress bar
  ═══════════════════════════════════════ */
  const loadingScreen = `
    <div id="loading-screen" class="screen">
      <div class="load-wrap">
        <div class="sonar">
          <div class="sonar-ring"></div>
          <div class="sonar-ring"></div>
          <div class="sonar-ring"></div>
          <div class="sonar-dot"></div>
        </div>
        <div style="display: flex; flex-direction: column; align-items: center; gap: 0.75rem">
          <span class="load-label" id="loading-text">Setting up 3D environment</span>
          <div class="load-track"><div class="load-fill" id="loading-fill"></div></div>
        </div>
      </div>
    </div>
  `;



  /* ═══════════════════════════════════════
     S3 — OCEAN 3D SCREEN
     Canvas + overlay text/buttons
  ═══════════════════════════════════════ */
  const oceanScreen = `
    <div id="ocean-screen" class="screen">
      <nav class="nav">
        <a class="nav__logo" href="https://oceanbottle.co/">
          <span>ocean</span><span>bottle</span>
        </a>
      </nav>

      <canvas id="renderCanvas"></canvas>

      <div id="ocean-ui-overlay">
        <div class="ocean-bottom-content">
          <p id="impact-title" class="ocean-title">Your daily plastic usage is just a drop in the ocean, but it adds up.</p>
          <p id="impact-details" class="ocean-subtitle hidden">In just five years, your plastic use could add up to <span id="ocean-five-year-usage">X</span> bottles</p>
          <button id="continue-button" class="continue-btn hidden">
            <img src="/Images/oceanbottle.png" alt="OceanBottle" class="button-icon" />
            Get an OceanBottle
          </button>
        </div>
      </div>

      <div class="keyboard-hint">
        <img src="/Images/keyboard_arrow.png" alt="Arrow keys" class="keyboard-icon">
        <span class="keyboard-label" id="movement-hint">Move Around</span>
      </div>

      <div class="rotate-phone-hint" id="rotate-phone-hint">
        <img src="/Images/rotatePhone.png" alt="Rotate phone" />
      </div>

      <button id="walk-btn" class="walk-btn hidden">WALK</button>
    </div>
  `;



  // navigate to landing page
  const navigateToBuyNow = () => {
    window.location.href = '/buy-now';
  };



  /* ═══════════════════════════════════════
     RENDER FIRST SCREEN
  ═══════════════════════════════════════ */
  appContainer.innerHTML = firstScreen;


  // autoplay video
  setTimeout(() => {
    const bgVideo = document.querySelector('.screen__bg');
    if (bgVideo) {
      bgVideo.muted = true;
      bgVideo.play().catch(e => console.log('Video autoplay error:', e));
    }
  }, 100);


  // fade in intro elements
  setTimeout(() => {
    document.querySelectorAll('#first-screen .fade').forEach((el, i) => {
      setTimeout(() => el.classList.add('on'), 120 + i * 75);
    });
  }, 100);



  /* ── counter logic ── */
  function setCount(n) {
    count = Math.max(0, Math.min(99, n));
    const countEl = document.getElementById('bottle-count');
    const yearEl = document.getElementById('yearly-num');
    if (countEl) countEl.textContent = count;
    if (yearEl) yearEl.textContent = (count * 365).toLocaleString();
  }

  document.getElementById('btn-minus').addEventListener('click', () => setCount(count - 1));
  document.getElementById('btn-plus').addEventListener('click', () => setCount(count + 1));



  /* ── "See your impact" button — go to loading then 3D ── */
  document.getElementById('btn-ok').addEventListener('click', async () => {
    if (count <= 0) return;

    const fiveYearUsage = count * 365 * 5;


    // show loading screen
    appContainer.innerHTML = loadingScreen;


    // small pause so sonar is visible
    await new Promise(resolve => setTimeout(resolve, 800));


    // swap to ocean screen
    appContainer.innerHTML = oceanScreen;


    // mobile hint
    const isMobile = window.innerWidth <= 768;
    const movementHint = document.getElementById('movement-hint');
    if (isMobile && movementHint) movementHint.textContent = 'Drag to Move';

    document.getElementById('ocean-five-year-usage').textContent = fiveYearUsage.toLocaleString();


    // init 3D scene
    const canvas = document.getElementById('renderCanvas');

    if (canvas) {
      try {
        await initOceanScene(canvas, count);

        // start underwater sound
        playUnderwaterSound();


        // show first message
        setTimeout(() => {
          const title = document.getElementById('impact-title');
          if (title) {
            title.classList.add('fade-in');
            speak('Your daily plastic usage is just a drop in the ocean, but it adds up.');
          }
        }, 500);


        // show second message after 5s
        setTimeout(() => {
          const details = document.getElementById('impact-details');
          if (details) {
            details.classList.remove('hidden');
            details.classList.add('fade-in');
            speak(`In just five years, your plastic use could add up to ${fiveYearUsage} bottles.`);
          }
        }, 5500);


        // show button after 14.5s
        setTimeout(() => {
          const btn = document.getElementById('continue-button');
          if (btn) {
            btn.classList.remove('hidden');
            btn.classList.add('fade-in');
            speak('Press to buy an OceanBottle and see what it can do.');
          }
        }, 14500);



        /* ── continue button — spawn logo, proximity check, cleanup ── */
        const continueButton = document.getElementById('continue-button');
        if (continueButton) {
          let logoSpawned = false;
          let proximityCheckInterval = null;

          continueButton.addEventListener('click', async () => {
            if (!logoSpawned) {
              continueButton.disabled = true;
              continueButton.textContent = 'Spawning...';

              await spawnOceanBottleLogo();

              continueButton.innerHTML = '<img src="/Images/oceanbottle.png" alt="OceanBottle" class="button-icon" />Move towards the OceanBottle';
              continueButton.disabled = true;
              logoSpawned = true;
              speak('Move towards the OceanBottle.');


              // proximity check loop
              proximityCheckInterval = setInterval(() => {
                if (checkCameraProximity()) {
                  clearInterval(proximityCheckInterval);
                  continueButton.disabled = true;
                  continueButton.classList.add('cleaning-up');
                  speak('Cleaning the ocean up.');

                  // animate dots
                  let dotCount = 0;
                  const animateDots = setInterval(() => {
                    const dots = '.'.repeat((dotCount % 3) + 1);
                    continueButton.innerHTML = `Cleaning the ocean up${dots}`;
                    dotCount++;
                  }, 500);

                  // fade out everything
                  Promise.all([fadeOutLogo(), hideBottles()]).then(() => {
                    clearInterval(animateDots);
                    continueButton.textContent = 'Next';
                    continueButton.classList.remove('cleaning-up');
                    continueButton.disabled = false;

                    // final click — go to landing page
                    continueButton.addEventListener('click', () => {
                      disposeOceanScene();
                      stopUnderwaterSound();
                      navigateToBuyNow();
                    }, { once: true });
                  });
                }
              }, 100);
            }
          });
        }



        /* ── mobile orientation handling ── */
        const rotatePhoneHint = document.getElementById('rotate-phone-hint');
        const walkBtn = document.getElementById('walk-btn');
        let walkInterval = null;

        function handleOrientationChange() {
          const isPortrait = window.innerHeight > window.innerWidth;

          if (isMobile) {
            if (isPortrait) {
              if (rotatePhoneHint) rotatePhoneHint.style.display = 'flex';
              if (walkBtn) walkBtn.classList.add('hidden');
              if (walkInterval) clearInterval(walkInterval);
            } else {
              if (rotatePhoneHint) rotatePhoneHint.style.display = 'none';
              if (walkBtn && logoSpawned) walkBtn.classList.remove('hidden');
            }
          }
        }

        window.addEventListener('orientationchange', handleOrientationChange);
        window.addEventListener('resize', handleOrientationChange);
        handleOrientationChange();


        // walk button — hold to move forward
        if (walkBtn) {
          walkBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            walkBtn.style.background = 'rgba(255,255,255,0.15)';
            if (walkInterval) clearInterval(walkInterval);
            walkInterval = setInterval(() => {
              const moveDirection = camera.getDirection(BABYLON.Axis.Z);
              camera.position.addInPlace(moveDirection.scale(0.8));
            }, 50);
          });

          walkBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            walkBtn.style.background = 'transparent';
            if (walkInterval) { clearInterval(walkInterval); walkInterval = null; }
          });

          walkBtn.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            walkBtn.style.background = 'transparent';
            if (walkInterval) { clearInterval(walkInterval); walkInterval = null; }
          });
        }


      } catch (error) {
        console.error('Error initializing ocean scene:', error);
      }
    }
  });
});
