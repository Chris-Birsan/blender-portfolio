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
  const FIREBASE_URL = 'https://blender-portfolio-default-rtdb.firebaseio.com';

  // ─────────────────────────────────────────────────────
  // IP-BASED VOTE LIMITING FUNCTIONS
  // ─────────────────────────────────────────────────────
  // Why IP limiting? Without it, users can:
  // - Clear localStorage and vote again
  // - Use different browsers to vote multiple times
  // - Use incognito mode to bypass local tracking
  // IP addresses are tracked server-side in Firebase, making them much harder to bypass.

  // Cache the user's IP to avoid repeated API calls
  let cachedUserIP = null;

  /**
   * Get user's IP address from ipify.org
   *
   * How it works:
   * 1. Check if we already fetched the IP this session (cached)
   * 2. If not, call ipify.org API which returns: { "ip": "192.168.1.1" }
   * 3. Cache the result so future calls are instant
   *
   * Why ipify.org?
   * - Free, no API key required
   * - Simple JSON response
   * - Reliable uptime
   * - Returns public IP (what servers see, not local 192.168.x.x)
   */
  async function getUserIP() {
    // Return cached IP if available (performance optimization)
    if (cachedUserIP) {
      return cachedUserIP;
    }

    try {
      const response = await fetch('https://api.ipify.org?format=json');
      if (!response.ok) throw new Error('ipify API error');
      const data = await response.json();
      cachedUserIP = data.ip;
      return cachedUserIP;
    } catch (error) {
      console.error('Error getting IP:', error);
      // Fallback: return null, caller should handle this gracefully
      return null;
    }
  }

  /**
   * Sanitize IP address for use as Firebase key
   *
   * Firebase paths cannot contain: . $ # [ ] /
   * So we replace periods with underscores: 192.168.1.1 → 192_168_1_1
   */
  function sanitizeIP(ip) {
    return ip.replace(/\./g, '_');
  }

  /**
   * Check if an IP has already voted on a project
   *
   * How it works:
   * 1. Make GET request to Firebase at /votedIPs/{project}/{sanitizedIP}
   * 2. If the path exists and equals true → user has voted
   * 3. If the path doesn't exist → returns null → user hasn't voted
   *
   * Firebase REST API:
   * - GET request = "read this data"
   * - Response is JSON (the value at that path, or null if doesn't exist)
   */
  async function hasVotedOnServer(projectName, userIP) {
    try {
      const sanitizedIP = sanitizeIP(userIP);
      const response = await fetch(
        `${FIREBASE_URL}/votedIPs/${projectName}/${sanitizedIP}.json`
      );
      if (!response.ok) throw new Error('Firebase read error');
      const data = await response.json();
      // data is `true` if IP exists, `null` if it doesn't
      return data === true;
    } catch (error) {
      console.error('Error checking vote status:', error);
      // On error, fall back to localStorage (degraded but functional)
      return localStorage.getItem(`upvote_${projectName}`) === 'true';
    }
  }

  /**
   * Record that an IP has voted on a project
   *
   * How it works:
   * - PUT request writes data to a specific path
   * - We write `true` at /votedIPs/{project}/{sanitizedIP}
   *
   * Why PUT instead of POST?
   * - PUT overwrites at exact path (idempotent - same result if called twice)
   * - POST creates new child with auto-generated ID (not what we want)
   *
   * Security note:
   * This is client-side code, so technically users could bypass it.
   * The REAL protection is Firebase Security Rules (server-side).
   * We'll set rules so an IP can only be written ONCE per project.
   */
  async function recordVote(projectName, userIP) {
    try {
      const sanitizedIP = sanitizeIP(userIP);
      const response = await fetch(
        `${FIREBASE_URL}/votedIPs/${projectName}/${sanitizedIP}.json`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(true)
        }
      );
      if (!response.ok) throw new Error('Firebase write error');
      return true;
    } catch (error) {
      console.error('Error recording vote:', error);
      return false;
    }
  }

  /**
   * Remove vote record for an IP (for toggle/unvote functionality)
   *
   * How it works:
   * - DELETE request removes data at the specified path
   * - Removes the entry at /votedIPs/{project}/{sanitizedIP}
   *
   * Security consideration:
   * This allows users to "undo" their vote. In a production app,
   * you might want to prevent this to avoid vote manipulation.
   * For a portfolio, toggle voting is fine and provides better UX.
   */
  async function removeVoteRecord(projectName, userIP) {
    try {
      const sanitizedIP = sanitizeIP(userIP);
      const response = await fetch(
        `${FIREBASE_URL}/votedIPs/${projectName}/${sanitizedIP}.json`,
        {
          method: 'DELETE'
        }
      );
      if (!response.ok) throw new Error('Firebase delete error');
      return true;
    } catch (error) {
      console.error('Error removing vote record:', error);
      return false;
    }
  }

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

  // ─────────────────────────────────────────────────────
  // INITIALIZE UPVOTE BUTTONS
  // ─────────────────────────────────────────────────────
  // This runs once when the page loads.
  // We need to:
  // 1. Get the user's IP (for vote checking)
  // 2. For each button: check if this IP has voted, set UI accordingly
  // 3. Attach click handlers

  async function initializeUpvoteButtons() {
    // Step 1: Get user's IP address upfront
    // We do this ONCE and reuse it for all buttons (performance)
    const userIP = await getUserIP();

    // If we couldn't get IP, we'll fall back to localStorage-only mode
    // This happens if ipify.org is blocked (ad blockers) or user is offline
    if (!userIP) {
      console.warn('Could not get user IP. Falling back to localStorage-only mode.');
    }

    // Step 2: Initialize each button
    upvoteButtons.forEach(async btn => {
      const projectName = btn.dataset.project;
      const heartIcon = btn.querySelector('.heart-icon');
      const voteCount = btn.querySelector('.vote-count');

      // Determine vote state:
      // Priority 1: Check Firebase (server-side, authoritative)
      // Priority 2: Fall back to localStorage if Firebase check fails
      let hasVoted = false;

      if (userIP) {
        // Check server-side vote status
        hasVoted = await hasVotedOnServer(projectName, userIP);
        // Sync localStorage with server state (keeps them in sync)
        localStorage.setItem(`upvote_${projectName}`, hasVoted.toString());
      } else {
        // Fallback to localStorage if no IP available
        hasVoted = localStorage.getItem(`upvote_${projectName}`) === 'true';
      }

      // Update UI to reflect vote state
      if (hasVoted) {
        btn.classList.add('voted');
        heartIcon.textContent = '♥';
      } else {
        btn.classList.remove('voted');
        heartIcon.textContent = '♡';
      }

      // Fetch and display the vote count from Firebase
      try {
        const count = await getCount(projectName);
        voteCount.textContent = count;
        localStorage.setItem(`upvote_count_${projectName}`, count);
      } catch (error) {
        voteCount.textContent = localStorage.getItem(`upvote_count_${projectName}`) || 0;
      }

      // ─────────────────────────────────────────────────────
      // CLICK HANDLER - The main voting logic
      // ─────────────────────────────────────────────────────
      btn.addEventListener('click', async function(e) {
        e.preventDefault();
        e.stopPropagation();

        // Disable button during API call (prevents double-clicks)
        btn.disabled = true;

        // Get fresh IP in case it changed (rare, but possible)
        const currentIP = await getUserIP();

        if (!currentIP) {
          // Can't verify identity - show error and abort
          alert('Unable to verify your identity. Please check your internet connection and try again.');
          btn.disabled = false;
          return;
        }

        const currentlyVoted = btn.classList.contains('voted');

        try {
          if (currentlyVoted) {
            // ═══════════════════════════════════════════════════
            // REMOVING A VOTE (unvote)
            // ═══════════════════════════════════════════════════

            // Double-check server state (in case of sync issues)
            const serverSaysVoted = await hasVotedOnServer(projectName, currentIP);
            if (!serverSaysVoted) {
              // Server says we haven't voted - sync UI and exit
              btn.classList.remove('voted');
              heartIcon.textContent = '♡';
              localStorage.setItem(`upvote_${projectName}`, 'false');
              btn.disabled = false;
              return;
            }

            // Optimistic UI update (feels snappier)
            btn.classList.remove('voted');
            heartIcon.textContent = '♡';

            // Update server: decrement count and remove IP record
            const newCount = await decrementCount(projectName);
            await removeVoteRecord(projectName, currentIP);

            // Update localStorage (backup/sync)
            localStorage.setItem(`upvote_${projectName}`, 'false');
            localStorage.setItem(`upvote_count_${projectName}`, newCount);
            voteCount.textContent = newCount;

          } else {
            // ═══════════════════════════════════════════════════
            // ADDING A VOTE
            // ═══════════════════════════════════════════════════

            // Check if already voted on server (prevents double-voting)
            const alreadyVoted = await hasVotedOnServer(projectName, currentIP);
            if (alreadyVoted) {
              // Server says we already voted - sync UI to match
              btn.classList.add('voted');
              heartIcon.textContent = '♥';
              localStorage.setItem(`upvote_${projectName}`, 'true');
              alert('You have already voted for this project!');
              btn.disabled = false;
              return;
            }

            // Optimistic UI update
            btn.classList.add('voted');
            heartIcon.textContent = '♥';

            // Update server: increment count and record IP
            const newCount = await incrementCount(projectName);
            await recordVote(projectName, currentIP);

            // Update localStorage
            localStorage.setItem(`upvote_${projectName}`, 'true');
            localStorage.setItem(`upvote_count_${projectName}`, newCount);
            voteCount.textContent = newCount;
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
          alert('An error occurred while voting. Please try again.');
        }

        btn.disabled = false;
      });
    });
  }

  // Run initialization
  initializeUpvoteButtons();

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
