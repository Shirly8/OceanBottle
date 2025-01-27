// app.js

// Function to change between screens
export const updateScreen = (screenHTML) => {
  const appContainer = document.getElementById('app');
  appContainer.innerHTML = screenHTML;
};
