import './app.css';
import { initOceanScene, disposeOceanScene, hideBottles, spawnOceanBottleLogo, checkCameraProximity, getOceanBottleLogo, fadeOutLogo } from './ocean-scene.js';

// Wait until the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  const appContainer = document.getElementById('app');

  const logo = '<img src="./Images/logo.avif" alt="Logo" class="logo" onClick="window.location.href=\'https://oceanbottle.co/\'" />';

  const firstScreen = `
    <div id="first-screen" class="screen">
      <video autoplay muted loop playsinline class="bg-video" preload="metadata">
        <source src="/Images/background1.mp4" type="video/mp4">
      </video>
      <div class="video-overlay"></div>
      ${logo}
      <div class="center">
        <h1>How many plastic water bottles do you use per day?</h1>
        <input type="number" id="bottle-input" placeholder="Enter number of bottles" />
        <button id="submit-button">OK</button>
      </div>
      <p class="bottom">Created by Shirley Huang</p>
    </div>
  `;

  const oceanScreen = `
    <div id="ocean-screen" class="screen">
      ${logo}
      <div id="ocean-loading" class="ocean-loading">
        <div class="loading-spinner"></div>
        <p class="loading-text" id="loading-text">Initializing ocean scene...</p>
        <div class="loading-progress">
          <div class="loading-progress-bar" id="loading-progress-bar"></div>
        </div>
        <div class="loading-progress">
          <div class="loading-progress-bar" id="loading-progress-bar"></div>
        </div>
      </div>
      <canvas id="renderCanvas" style="width: 100%; height: 100%; display: block;"></canvas>
      <div id="ocean-ui-overlay">
        <div class="ocean-bottom-content">
          <p id="impact-title" class="ocean-title">Your daily plastic usage is just a drop in the ocean, but it adds up.</p>
          <p id="impact-details" class="ocean-subtitle hidden">In just five years, your plastic use could add up to <span id="ocean-ten-year-usage">X</span> bottles</p>
          <button id="continue-button" class="continue-btn hidden"><img src="/Images/oceanbottle.png" alt="OceanBottle" class="button-icon" />Get an OceanBottle</button>
        </div>
      </div>
      <div class="keyboard-hint">
        <img src="/Images/keyboard_arrow.png" alt="Arrow keys" class="keyboard-icon">
        <span class="keyboard-label">Move Around</span>
      </div>
    </div>
  `;

  const secondScreen = `
    <div id="second-screen" class="screen hidden">
      ${logo}
      <div id="message-container" class="hidden">
        <h2>Your daily plastic usage is just a drop in the ocean, but it adds up.</h2>
      </div>
      <div id="message-container2" class="hidden">
        <h3>In just five years, your plastic use could add up to <span id="ten-year-usage">X</span> bottles - enough to pollute an entire coastline</h3>
      </div>
      <div id="drag-container" class="dragpart hidden">
        <div id="bottle-container" class="drag-area">
          <div id="ocean-bottle" class="draggable" draggable="true">
            <img src="/Images/bottle.png" class="bottleimage">
          </div>
        </div>
        <div id="cart" class="cart" ondrop="drop(event)" ondragover="allowDrop(event)" ondragleave="dragLeave(event)">
        </div>
      </div>
      <h4 id="drag-instructions" class="hidden">Drag the bottle to your cart to shop sustainable</h4>
    </div>
  `;

  // Navigation function to buy-now page
  const navigateToBuyNow = () => {
    window.location.href = '/buy-now.html';
  };

  appContainer.innerHTML = firstScreen;

  // Ensure video plays with better handling
  setTimeout(() => {
    const bgVideo = document.querySelector('.bg-video');
    if (bgVideo) {
      bgVideo.muted = true;
      const playPromise = bgVideo.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log('Video autoplay error:', error);
        });
      }
    }
  }, 100);

  const submitButton = document.getElementById('submit-button');
  const bottleInput = document.getElementById('bottle-input');

  // Allow Enter key to submit
  bottleInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      submitButton.click();
    }
  });

  submitButton.addEventListener('click', async () => {
    const dailyBottles = parseInt(bottleInput.value);

    if (!isNaN(dailyBottles) && dailyBottles > 0) {
      const tenYearUsage = dailyBottles * 365 * 5;

      // Show ocean screen with 3D visualization
      appContainer.innerHTML = oceanScreen;
      document.getElementById('ocean-ten-year-usage').textContent = tenYearUsage;

      // Initialize 3D ocean scene
      const canvas = document.getElementById('renderCanvas');
      const loadingOverlay = document.getElementById('ocean-loading');
      const loadingText = document.getElementById('loading-text');
      const progressBar = document.getElementById('loading-progress-bar');
      
      if (canvas) {
        try {
          // Update loading text
          if (loadingText) loadingText.textContent = 'Setting up 3D environment...';
          if (progressBar) progressBar.style.width = '20%';
          
          // Initialize scene
          await initOceanScene(canvas, dailyBottles);
          
          // Update progress
          if (loadingText) loadingText.textContent = 'Loading 3D models...';
          if (progressBar) progressBar.style.width = '60%';
          
          // Small delay to show progress
          await new Promise(resolve => setTimeout(resolve, 300));
          
          if (loadingText) loadingText.textContent = 'Finalizing scene...';
          if (progressBar) progressBar.style.width = '100%';
          
          // Hide loading overlay once scene is loaded
          await new Promise(resolve => setTimeout(resolve, 500));
          if (loadingOverlay) {
            loadingOverlay.style.opacity = '0';
            setTimeout(() => {
              loadingOverlay.style.display = 'none';
            }, 500);
          }

          // Show first message immediately
          setTimeout(() => {
            const impactTitle = document.getElementById('impact-title');
            if (impactTitle) {
              impactTitle.classList.add('fade-in');
            }
          }, 500);

          // Show second message after 5 seconds
          setTimeout(() => {
            const impactDetails = document.getElementById('impact-details');
            if (impactDetails) {
              impactDetails.classList.remove('hidden');
              impactDetails.classList.add('fade-in');
            }
          }, 5500);

          // Show button 5 seconds after the second message (10.5 seconds total)
          setTimeout(() => {
            const continueButton = document.getElementById('continue-button');
            if (continueButton) {
              continueButton.classList.remove('hidden');
              continueButton.classList.add('fade-in');
            }
          }, 10500);

          // Handle continue button - spawn logo and create proximity-based interaction
          const continueButton = document.getElementById('continue-button');
          if (continueButton) {
            let logoSpawned = false;
            let proximityCheckInterval = null;

            continueButton.addEventListener('click', async () => {
              if (!logoSpawned) {
                // First click: spawn OceanBottle logo
                continueButton.disabled = true;
                continueButton.textContent = 'Spawning...';

                await spawnOceanBottleLogo();

                continueButton.innerHTML = '<img src="/Images/oceanbottle.png" alt="OceanBottle" class="button-icon" />Move towards the OceanBottle';
                continueButton.disabled = true;
                logoSpawned = true;

                // Check if camera is close to logo
                proximityCheckInterval = setInterval(() => {
                  if (checkCameraProximity()) {
                    clearInterval(proximityCheckInterval);
                    continueButton.disabled = true;
                    continueButton.classList.add('cleaning-up');

                    // Animate the "..." in the button
                    let dotCount = 0;
                    const animateDots = setInterval(() => {
                      const dots = '.'.repeat((dotCount % 3) + 1);
                      continueButton.innerHTML = `Cleaning the ocean up${dots}`;
                      dotCount++;
                    }, 500); // Change dots every 500ms

                    // Fade out logo and hide bottles simultaneously
                    Promise.all([
                      fadeOutLogo(),
                      hideBottles()
                    ]).then(() => {
                      clearInterval(animateDots);
                      continueButton.textContent = 'Next';
                      continueButton.classList.remove('cleaning-up');
                      continueButton.disabled = false;

                      // Handle final click - navigate to buy-now page
                      continueButton.addEventListener('click', () => {
                        disposeOceanScene();
                        navigateToBuyNow();
                      }, { once: true });
                    });
                  }
                }, 100); // Check every 100ms
              }
            });
          }
        } catch (error) {
          console.error('Error initializing ocean scene:', error);
          // Hide loading overlay if it exists
          const loadingOverlay = document.getElementById('ocean-loading');
          if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
          }
          // Fallback to second screen if 3D fails
          appContainer.innerHTML = secondScreen;
          setupSecondScreen(dailyBottles, tenYearUsage);
        }
      }
    } else {
      alert('Please enter a valid number of bottles.');
    }
  });

  function setupSecondScreen(monthlyBottles, tenYearUsage) {
    // Start animations
    setTimeout(() => {
      const messageContainer = document.getElementById('message-container');
      if (messageContainer) {
        messageContainer.classList.remove('hidden');
        messageContainer.classList.add('fade-in');
      }

      setTimeout(() => {
        const messageContainer2 = document.getElementById('message-container2');
        if (messageContainer2) {
          messageContainer2.classList.remove('hidden');
          messageContainer2.classList.add('fade-in');
        }

        setTimeout(() => {
          const dragContainer = document.getElementById('drag-container');
          if (dragContainer) {
            dragContainer.classList.remove('hidden');
            dragContainer.classList.add('fade-in');
          }

          setTimeout(() => {
            const dragInstructions = document.getElementById('drag-instructions');
            if (dragInstructions) {
              dragInstructions.classList.remove('hidden');
              dragInstructions.classList.add('fade-in');
            }
          }, 1000);
        }, 2000);
      }, 3000);
    }, 400);

    document.getElementById('ten-year-usage').textContent = tenYearUsage;

    // Set up drag handlers after DOM is ready
    const oceanBottle = document.getElementById('ocean-bottle');
    const bottleImg = oceanBottle?.querySelector('img');

    if (oceanBottle) {
      oceanBottle.ondragstart = (e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.target.id || 'ocean-bottle');
        oceanBottle.classList.add('dragging');
      };
      oceanBottle.ondragend = () => {
        oceanBottle.classList.remove('dragging');
        const cart = document.getElementById('cart');
        if (cart) {
          cart.classList.remove('drag-over');
        }
      };
    }

    if (bottleImg) {
      bottleImg.ondragstart = (e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', 'ocean-bottle');
        oceanBottle.classList.add('dragging');
      };
    }
  }

  window.allowDrop = (e) => {
    e.preventDefault();
    const cart = document.getElementById('cart');
    if (cart) {
      cart.classList.add('drag-over');
    }
  };

  window.dragLeave = (e) => {
    const cart = document.getElementById('cart');
    if (cart && e.target.id === 'cart') {
      cart.classList.remove('drag-over');
    }
  };

  window.drag = (e) => {
    e.dataTransfer.setData('text', e.target.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  window.drop = (e) => {
    e.preventDefault();
    const cart = document.getElementById('cart');
    if (cart) {
      cart.classList.remove('drag-over');
    }

    let dropzone = e.target;

    // Check if dropped on cart or inside cart
    if (dropzone.id === 'cart' || dropzone.closest('#cart')) {
      // Successfully dropped bottle into cart - navigate to buy-now page
      navigateToBuyNow();
    }
  };
});
