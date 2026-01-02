// Main functionality
document.addEventListener('DOMContentLoaded', function() {

  // ═══════════════════════════════════════════════════
  // HAMBURGER MENU FUNCTIONALITY
  // ═══════════════════════════════════════════════════
  const navToggle = document.getElementById('nav-toggle');
  const navMenu = document.getElementById('nav-menu');
  const dropdownToggle = navMenu?.querySelector('.dropdown-toggle');

  const resetDropdowns = () => {
    navMenu?.querySelectorAll('.nav-dropdown.open').forEach(dropdown => {
      dropdown.classList.remove('open');
      const dropdownMenu = dropdown.querySelector('.dropdown-menu');
      if (dropdownMenu) {
        dropdownMenu.style.maxHeight = '';
      }
    });
  };

  const closeMenu = () => {
    if (navToggle) {
      navToggle.classList.remove('active');
      navToggle.setAttribute('aria-expanded', 'false');
    }
    navMenu?.classList.remove('open');
    resetDropdowns();
  };

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', function() {
      const isOpen = navMenu.classList.toggle('open');
      navToggle.classList.toggle('active', isOpen);
      navToggle.setAttribute('aria-expanded', isOpen.toString());
      if (!isOpen) {
        resetDropdowns();
      }
    });

    // Close menu when clicking on a link
    const navLinks = navMenu.querySelectorAll('a.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', closeMenu);
    });

    if (dropdownToggle) {
      dropdownToggle.addEventListener('click', function(e) {
        if (window.innerWidth > 768) return;
        e.preventDefault();

        const dropdown = dropdownToggle.closest('.nav-dropdown');
        const dropdownMenu = dropdown?.querySelector('.dropdown-menu');
        if (!dropdown || !dropdownMenu) return;

        const isOpen = dropdown.classList.toggle('open');
        dropdownMenu.style.maxHeight = isOpen ? `${dropdownMenu.scrollHeight}px` : '';
      });
    }

    window.addEventListener('resize', function() {
      if (window.innerWidth > 768) {
        closeMenu();
      } else {
        resetDropdowns();
      }
    });
  }

  // ═══════════════════════════════════════════════════
  // UPVOTE FUNCTIONALITY WITH FIREBASE REALTIME DATABASE
  // ═══════════════════════════════════════════════════

  // Firebase Realtime Database URL (free tier)
  // This uses a public Firebase database for shared vote counts
  const FIREBASE_URL = 'https://blender-portfolio-upvotes-default-rtdb.firebaseio.com';

  const upvoteButtons = document.querySelectorAll('.upvote-btn');

  // Fetch current count from Firebase
  async function getCount(projectName) {
    try {
      const response = await fetch(`${FIREBASE_URL}/votes/${projectName}.json`);
      if (!response.ok) throw new Error('Network error');
      const data = await response.json();
      return data || 0;
    } catch (error) {
      console.error('Error fetching count:', error);
      // Fallback to localStorage
      return parseInt(localStorage.getItem(`upvote_count_${projectName}`)) || 0;
    }
  }

  // Update count on Firebase
  async function setCount(projectName, count) {
    try {
      const response = await fetch(`${FIREBASE_URL}/votes/${projectName}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(count)
      });
      if (!response.ok) throw new Error('Network error');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error setting count:', error);
      localStorage.setItem(`upvote_count_${projectName}`, count);
      return count;
    }
  }

  // Increment count atomically
  async function incrementCount(projectName) {
    const currentCount = await getCount(projectName);
    const newCount = currentCount + 1;
    await setCount(projectName, newCount);
    return newCount;
  }

  // Decrement count atomically
  async function decrementCount(projectName) {
    const currentCount = await getCount(projectName);
    const newCount = Math.max(0, currentCount - 1);
    await setCount(projectName, newCount);
    return newCount;
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

    // Fetch and display the shared count from Firebase
    try {
      const count = await getCount(projectName);
      voteCount.textContent = count;
      localStorage.setItem(`upvote_count_${projectName}`, count);
    } catch (error) {
      voteCount.textContent = localStorage.getItem(`upvote_count_${projectName}`) || 0;
    }

    // Handle click
    btn.addEventListener('click', async function(e) {
      e.preventDefault();
      e.stopPropagation();

      // Disable button during API call
      btn.disabled = true;

      const currentlyVoted = btn.classList.contains('voted');

      try {
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
      } catch (error) {
        console.error('Vote error:', error);
        // Revert UI on error
        if (currentlyVoted) {
          btn.classList.add('voted');
          heartIcon.textContent = '♥';
        } else {
          btn.classList.remove('voted');
          heartIcon.textContent = '♡';
        }
      }

      btn.disabled = false;
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
