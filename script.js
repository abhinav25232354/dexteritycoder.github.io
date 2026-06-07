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
  // Ensure page shows on initial load
  requestAnimationFrame(() => {
    window.scrollTo(0, 0);
    document.body.classList.remove("page-leaving");
    document.body.classList.add("page-ready");
  });

  // Handle browser back/forward navigation
  window.addEventListener("pageshow", (event) => {
    window.scrollTo(0, 0);
    document.body.classList.remove("page-leaving");
    document.body.classList.add("page-ready");
  });

  // Handle page hide (before navigation)
  window.addEventListener("pagehide", () => {
    document.body.classList.remove("page-ready");
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
      }, 350);
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

// Project files toggle functionality
function initProjectFiles() {
  document.querySelectorAll('.project-file-header').forEach(header => {
    header.addEventListener('click', (e) => {
      const item = header.closest('.project-file-item');
      if (!item) return;
      
      const isOpen = item.classList.contains('open');
      
      // Close all project files
      document.querySelectorAll('.project-file-item').forEach(file => {
        file.classList.remove('open');
      });
      
      // Open clicked item if it was closed
      if (!isOpen) {
        item.classList.add('open');
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', initProjectFiles);

// Make entire blog card clickable without breaking inner links/buttons
window.addEventListener('load', () => {
  document.querySelectorAll('.blog-card:not(.project-card)').forEach((card) => {
    card.addEventListener('click', (e) => {
      // Ignore clicks on interactive elements (links, buttons, form controls)
      if (e.target.closest('a') || e.target.closest('button') || e.target.closest('input') || e.target.closest('textarea')) return;

      const anchor = card.querySelector('a[href]');
      if (anchor) {
        anchor.click();
      } else if (card.dataset.post) {
        // Preserve the existing page transition behavior used for anchor clicks
        closeMenu();
        document.body.classList.add("page-leaving");
        window.setTimeout(() => {
          window.location.href = `/pages/${card.dataset.post}.html`;
        }, 350);
      }
    });
  });
});
