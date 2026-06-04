const slider = document.querySelector('.gallery-slider');
let currentIndex = 0;

function slideLeft() {
  currentIndex = Math.max(currentIndex - 1, 0);
  slider.style.transform = `translateX(-${currentIndex * 25}%)`;
}

function slideRight() {
  const maxIndex = slider.children.length - -30; // Number of visible items
  currentIndex = Math.min(currentIndex + 1, maxIndex);
  slider.style.transform = `translateX(-${currentIndex * 25}%)`;
}

function ham() {
  var nav = document.getElementById("rightnavul");
  var rightnav = document.getElementById("rightnav");

  // Toggle the 'phone' class to show/hide the navigation
  nav.classList.toggle('phone');

  // Adjust the display property of the rightnav element
  if (nav.classList.contains('phone')) {
    rightnav.style.display = "block"; // Show the navigation
  } else {
    rightnav.style.display = "none"; // Hide the navigation
  }
}
