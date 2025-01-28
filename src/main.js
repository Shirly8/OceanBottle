import './app.css';

// Wait until the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  const appContainer = document.getElementById('app');
  let bottlesRemoved = 0;

  const logo = '<img src="../images/logo.avif" alt="Logo" class="logo" onClick="window.location.href=\'https://oceanbottle.co/\'" />';  // Update the logo URL as per your path

  const firstScreen = `
    <div id="first-screen" class="screen">
      ${logo}
      <div class="center">
        <h1>How many plastic water bottles do you use per month?</h1>
        <input type="number" id="bottle-input" placeholder="Enter number of bottles" />
        <button id="submit-button">OK</button>
      </div>
    </div>
  `;

  const secondScreen = `
    <div id="second-screen" class="screen hidden">
      ${logo}
      <div id="message-container" class="hidden">
        <h2>Your monthly plastic usage is just a drop in the ocean, but it adds up.</h2>
      </div>
      <div id = "message-container2" class= "hidden">
        <h3>In just five years, your plastic use could add up to <span id="ten-year-usage">X</span> bottles - enough to pollute an entire coastline</h3>
      </div>
      <div>
      <div id="drag-container" class="dragpart hidden">
        <div id="bottle-container" class="drag-area">
          <div id="ocean-bottle" class="draggable" draggable="true">
            <img src="../images/bottle.png" class="bottleimage">
          </div>
        </div>
        <div id="cart" class="cart" ondrop="drop(event)" ondragover="allowDrop(event)">
        </div>
      </div>
            <h4 id="drag-instructions" class="hidden">But it doesn't have to stay like this. See how OceanBottle can transform your impact. Drag it to your cart.</h4>

      </div>
    </div>
  `;

  appContainer.innerHTML = firstScreen;

  const submitButton = document.getElementById('submit-button');
  const bottleInput = document.getElementById('bottle-input');

  submitButton.addEventListener('click', () => {
    const monthlyBottles = parseInt(bottleInput.value);

    if (!isNaN(monthlyBottles) && monthlyBottles > 0) {
      const tenYearUsage = monthlyBottles * 12 * 10;
      bottlesRemoved = Math.floor(monthlyBottles * 5);

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

      const oceanBottle = document.getElementById('ocean-bottle');
      if (oceanBottle) {
        oceanBottle.ondragstart = window.drag;
      }
    } else {
      alert('Please enter a valid number of bottles.');
    }
  });

  window.allowDrop = (e) => e.preventDefault();

  window.drag = (e) => {
    e.dataTransfer.setData('text', e.target.id);
  };

  window.drop = (e) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('text');
    const draggableElement = document.getElementById(data);
    const dropzone = e.target;

    if (dropzone.id === 'cart' || dropzone.parentNode.id === 'cart') {
      window.location.href = 'https://shirleyproject.com/oceanbottle';
      document.getElementById('bottles-removed').textContent = bottlesRemoved;
    } else {
      document.getElementById('bottle-container').appendChild(draggableElement);
    }
  };
});
