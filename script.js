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
  // UPVOTE FUNCTIONALITY WITH SHARED COUNTS (CountAPI)
  // ═══════════════════════════════════════════════════
  const NAMESPACE = 'chris-birsan-blender-portfolio';
  const upvoteButtons = document.querySelectorAll('.upvote-btn');

  // Fetch current count from CountAPI
  async function getCount(projectName) {
    try {
      const response = await fetch(`https://api.countapi.xyz/get/${NAMESPACE}/${projectName}`);
      const data = await response.json();
      return data.value || 0;
    } catch (error) {
      console.error('Error fetching count:', error);
      // Fallback to localStorage count
      return parseInt(localStorage.getItem(`upvote_count_${projectName}`)) || 0;
    }
  }

  // Increment count on CountAPI
  async function incrementCount(projectName) {
    try {
      const response = await fetch(`https://api.countapi.xyz/hit/${NAMESPACE}/${projectName}`);
      const data = await response.json();
      return data.value || 1;
    } catch (error) {
      console.error('Error incrementing count:', error);
      // Fallback to localStorage
      const count = (parseInt(localStorage.getItem(`upvote_count_${projectName}`)) || 0) + 1;
      localStorage.setItem(`upvote_count_${projectName}`, count);
      return count;
    }
  }

  // Decrement count (CountAPI doesn't support decrement, so we use a workaround)
  async function decrementCount(projectName) {
    try {
      // CountAPI doesn't have a native decrement, so we'll use update endpoint
      const currentCount = await getCount(projectName);
      const newCount = Math.max(0, currentCount - 1);
      // Use the update endpoint to set the new value
      const response = await fetch(`https://api.countapi.xyz/update/${NAMESPACE}/${projectName}?amount=-1`);
      const data = await response.json();
      return Math.max(0, data.value || 0);
    } catch (error) {
      console.error('Error decrementing count:', error);
      const count = Math.max(0, (parseInt(localStorage.getItem(`upvote_count_${projectName}`)) || 0) - 1);
      localStorage.setItem(`upvote_count_${projectName}`, count);
      return count;
    }
  }

  // Initialize upvote buttons
  upvoteButtons.forEach(async btn => {
    const projectName = btn.dataset.project;
    const heartIcon = btn.querySelector('.heart-icon');
    const voteCount = btn.querySelector('.vote-count');

    // Check if user has already voted (stored in localStorage)
    const hasVoted = localStorage.getItem(`upvote_${projectName}`) === 'true';

    // Update UI for voted state
    if (hasVoted) {
      btn.classList.add('voted');
      heartIcon.textContent = '♥';
    }

    // Fetch and display the shared count from server
    try {
      const count = await getCount(projectName);
      voteCount.textContent = count;
      // Also update localStorage as backup
      localStorage.setItem(`upvote_count_${projectName}`, count);
    } catch (error) {
      // Use localStorage fallback
      voteCount.textContent = localStorage.getItem(`upvote_count_${projectName}`) || 0;
    }

    // Handle click
    btn.addEventListener('click', async function(e) {
      e.preventDefault();
      e.stopPropagation();

      const currentlyVoted = btn.classList.contains('voted');

      if (currentlyVoted) {
        // Remove vote
        btn.classList.remove('voted');
        heartIcon.textContent = '♡';
        localStorage.setItem(`upvote_${projectName}`, 'false');

        const newCount = await decrementCount(projectName);
        voteCount.textContent = newCount;
        localStorage.setItem(`upvote_count_${projectName}`, newCount);
      } else {
        // Add vote
        btn.classList.add('voted');
        heartIcon.textContent = '♥';
        localStorage.setItem(`upvote_${projectName}`, 'true');

        const newCount = await incrementCount(projectName);
        voteCount.textContent = newCount;
        localStorage.setItem(`upvote_count_${projectName}`, newCount);
      }
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
