import './app.css';

// Wait until the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  const appContainer = document.getElementById('app');

  const logo = '<img src="./Images/logo.avif" alt="Logo" class="logo" onClick="window.location.href=\'https://oceanbottle.co/\'" />';  // Update the logo URL as per your path

  const firstScreen = `
    <div id="first-screen" class="screen">
      <video autoplay muted loop playsinline class="bg-video" preload="metadata">
        <source src="/Images/background1.mp4" type="video/mp4">
      </video>
      <div class="video-overlay"></div>
      ${logo}
      <div class="center">
        <h1>How many plastic water bottles do you use per month?</h1>
        <input type="number" id="bottle-input" placeholder="Enter number of bottles" />
        <button id="submit-button">OK</button>
      </div>
      <p class = "bottom"> Created by Shirley Huang</>
    </div>
  `;

  const secondScreen = `
    <div id="second-screen" class="screen hidden">
      ${logo}
      <div id="message-container" class="hidden">
        <h2>Your monthly plastic usage is just a drop in the ocean, but it adds up.</h2>
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

  const thirdScreen = `
    <div id="third-screen" class="screen" style="width: 100vw; height: 100vh; padding: 0; margin: 0; overflow: auto; display: flex; flex-direction: column;">
      <iframe style="width: 100%; min-height: 100%; border: none; padding: 0; margin: 0; flex: 1;"
        src="https://www.canva.com/design/DAGdajMIf_k/ogzpkEWT--Tm9hg9u3vYUQ/view?embed" allowfullscreen>
      </iframe>
    </div>
  `;

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

  submitButton.addEventListener('click', () => {
    const monthlyBottles = parseInt(bottleInput.value);

    if (!isNaN(monthlyBottles) && monthlyBottles > 0) {
      const tenYearUsage = monthlyBottles * 12 * 10;

      appContainer.innerHTML = secondScreen;

      // Start animations
      setTimeout(() => {
        const messageContainer = document.getElementById('message-container');
        messageContainer.classList.remove('hidden');
        messageContainer.classList.add('fade-in');

        setTimeout(() => {
          const messageContainer = document.getElementById('message-container2');
          messageContainer.classList.remove('hidden');
          messageContainer.classList.add('fade-in');
        

        setTimeout(() => {
          const dragContainer = document.getElementById('drag-container');
          dragContainer.classList.remove('hidden');
          dragContainer.classList.add('fade-in');

          setTimeout(() => {
            const dragInstructions = document.getElementById('drag-instructions');
            dragInstructions.classList.remove('hidden');
            dragInstructions.classList.add('fade-in');
          }, 1000);   //Drag Instruction
        }, 2000); //Drag Container
        }, 3000); //usage
      }, 400); //Title

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
    } else {
      alert('Please enter a valid number of bottles.');
    }
  });

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
      // Successfully dropped bottle into cart - show Canva embed
      appContainer.innerHTML = thirdScreen;

      // Show the third screen
      const thirdScreenEl = document.getElementById('third-screen');
      if (thirdScreenEl) {
        thirdScreenEl.classList.remove('hidden');
      }
    }
  };
});
