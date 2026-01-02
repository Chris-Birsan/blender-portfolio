// Main functionality
document.addEventListener('DOMContentLoaded', function() {

  // ═══════════════════════════════════════════════════
  // HAMBURGER MENU FUNCTIONALITY
  // ═══════════════════════════════════════════════════
  const hamburger = document.getElementById('hamburger');
  const navMenu = document.querySelector('.nav-menu');

  if (hamburger && navMenu) {
    hamburger.addEventListener('click', function() {
      hamburger.classList.toggle('active');
      navMenu.classList.toggle('active');
    });

    // Close menu when clicking on a link
    const navLinks = navMenu.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', function() {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
      });
    });
  }

  // ═══════════════════════════════════════════════════
  // UPVOTE FUNCTIONALITY WITH LOCALSTORAGE
  // ═══════════════════════════════════════════════════
  const upvoteButtons = document.querySelectorAll('.upvote-btn');

  upvoteButtons.forEach(btn => {
    const projectName = btn.dataset.project;
    const heartIcon = btn.querySelector('.heart-icon');
    const voteCount = btn.querySelector('.vote-count');

    // Load saved state from localStorage
    const isVoted = localStorage.getItem(`upvote_${projectName}`) === 'true';
    const count = parseInt(localStorage.getItem(`upvote_count_${projectName}`)) || 0;

    // Update UI based on saved state
    if (isVoted) {
      btn.classList.add('voted');
      heartIcon.textContent = '♥';
    }
    voteCount.textContent = count;

    // Handle click
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation(); // Prevent navigating to project page

      const currentlyVoted = btn.classList.contains('voted');
      let currentCount = parseInt(voteCount.textContent);

      if (currentlyVoted) {
        // Remove vote
        btn.classList.remove('voted');
        heartIcon.textContent = '♡';
        currentCount = Math.max(0, currentCount - 1);
        localStorage.setItem(`upvote_${projectName}`, 'false');
      } else {
        // Add vote
        btn.classList.add('voted');
        heartIcon.textContent = '♥';
        currentCount += 1;
        localStorage.setItem(`upvote_${projectName}`, 'true');
      }

      voteCount.textContent = currentCount;
      localStorage.setItem(`upvote_count_${projectName}`, currentCount);
    });
  });

  // ═══════════════════════════════════════════════════
  // LIGHTBOX FUNCTIONALITY WITH NAVIGATION
  // ═══════════════════════════════════════════════════

  // Create lightbox elements
  const lightbox = document.createElement('div');
  lightbox.id = 'lightbox';
  lightbox.innerHTML = `
    <span class="lightbox-close">&times;</span>
    <span class="lightbox-arrow lightbox-prev">&#10094;</span>
    <img class="lightbox-content" src="" alt="">
    <span class="lightbox-arrow lightbox-next">&#10095;</span>
    <div class="lightbox-counter">1 / 1</div>
  `;
  document.body.appendChild(lightbox);

  // Get all gallery images
  const galleryImages = document.querySelectorAll('.gallery-grid img');
  const lightboxImg = document.querySelector('.lightbox-content');
  const closeBtn = document.querySelector('.lightbox-close');
  const prevBtn = document.querySelector('.lightbox-prev');
  const nextBtn = document.querySelector('.lightbox-next');
  const counterEl = document.querySelector('.lightbox-counter');

  let currentIndex = 0;
  let images = [];

  // Build images array from gallery
  galleryImages.forEach((img, index) => {
    images.push({
      src: img.src,
      alt: img.alt
    });

    img.addEventListener('click', function() {
      currentIndex = index;
      openLightbox();
    });
  });

  function openLightbox() {
    if (images.length === 0) return;

    lightbox.style.display = 'flex';
    updateLightboxImage();
    document.body.style.overflow = 'hidden';
  }

  function updateLightboxImage() {
    lightboxImg.src = images[currentIndex].src;
    lightboxImg.alt = images[currentIndex].alt;
    counterEl.textContent = `${currentIndex + 1} / ${images.length}`;
  }

  function nextImage() {
    currentIndex = (currentIndex + 1) % images.length;
    updateLightboxImage();
  }

  function prevImage() {
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    updateLightboxImage();
  }

  function closeLightbox() {
    lightbox.style.display = 'none';
    document.body.style.overflow = 'auto';
  }

  // Event listeners for navigation
  if (prevBtn) {
    prevBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      prevImage();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      nextImage();
    });
  }

  // Close lightbox when clicking X
  if (closeBtn) {
    closeBtn.addEventListener('click', closeLightbox);
  }

  // Close lightbox when clicking outside image
  lightbox.addEventListener('click', function(e) {
    if (e.target === lightbox) {
      closeLightbox();
    }
  });

  // Keyboard navigation
  document.addEventListener('keydown', function(e) {
    if (lightbox.style.display === 'flex') {
      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowLeft') {
        prevImage();
      } else if (e.key === 'ArrowRight') {
        nextImage();
      }
    }
  });

});
