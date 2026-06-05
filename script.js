const slider = document.querySelector(".gallery-slider");
const galleryItems = slider ? Array.from(slider.children) : [];
let currentIndex = 0;
let itemsPerView = getItemsPerView();

function getItemsPerView() {
  if (window.innerWidth <= 680) {
    return 1;
  }

  if (window.innerWidth <= 1200) {
    return 2;
  }

  return 3;
}

function clampGalleryIndex() {
  if (!slider) {
    return;
  }

  itemsPerView = getItemsPerView();
  const maxIndex = Math.max(galleryItems.length - itemsPerView, 0);
  currentIndex = Math.min(currentIndex, maxIndex);
}

function updateGallery() {
  if (!slider || !galleryItems.length) {
    return;
  }

  clampGalleryIndex();
  const itemWidth = galleryItems[0].getBoundingClientRect().width;
  const gap = parseFloat(window.getComputedStyle(slider).gap || "0");
  const offset = currentIndex * (itemWidth + gap);
  slider.style.transform = `translateX(-${offset}px)`;
}

function slideLeft() {
  currentIndex = Math.max(currentIndex - 1, 0);
  updateGallery();
}

function slideRight() {
  clampGalleryIndex();
  const maxIndex = Math.max(galleryItems.length - itemsPerView, 0);
  currentIndex = Math.min(currentIndex + 1, maxIndex);
  updateGallery();
}

function ham() {
  document.body.classList.toggle("menu-open");
}

function closeMenu() {
  document.body.classList.remove("menu-open");
}

function handlePageTransitions() {
  requestAnimationFrame(() => {
    document.body.classList.add("page-ready");
  });

  document.querySelectorAll('a[href]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");

      if (!href || href.startsWith("#") || link.target === "_blank" || event.metaKey || event.ctrlKey) {
        return;
      }

      const url = new URL(link.href, window.location.href);

      if (url.origin !== window.location.origin) {
        return;
      }

      event.preventDefault();
      closeMenu();
      document.body.classList.add("page-leaving");

      window.setTimeout(() => {
        window.location.href = url.href;
      }, 220);
    });
  });
}

document.addEventListener("click", (event) => {
  if (!document.body.classList.contains("menu-open")) {
    return;
  }

  const nav = document.getElementById("rightnav");
  const trigger = document.querySelector(".ham");

  if (nav && trigger && !nav.contains(event.target) && !trigger.contains(event.target)) {
    closeMenu();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMenu();
  }
});

window.addEventListener("resize", updateGallery);
window.addEventListener("load", updateGallery);

handlePageTransitions();
