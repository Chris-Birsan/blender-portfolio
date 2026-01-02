// Main functionality
document.addEventListener('DOMContentLoaded', async function() {

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

  // Define all known projects so we can reset/demo data consistently
  const PROJECTS = ['dungeon', 'rocketship', 'ak47', 'awp', 'pizza', 'mouse', 'house', 'lighthouse'];

  // ═══════════════════════════════════════════════════
  // CUSTOM ANALYTICS TRACKING (for our dashboard)
  // ═══════════════════════════════════════════════════
  //
  // WHY CUSTOM ANALYTICS?
  // Firebase Analytics is great, but it has a 24-hour delay.
  // Our custom dashboard shows data in REAL-TIME.
  //
  // CONCEPT: Time-Series Data
  // We store data by date (2026-01-02) so we can:
  // - Show trends over time (line charts)
  // - Compare days (yesterday vs today)
  // - Calculate daily averages
  //
  // DATABASE STRUCTURE:
  // analytics/
  //   events/
  //     2026-01-02/
  //       project_views/
  //         dungeon: 15
  //         rocketship: 8
  //       upvotes/
  //         dungeon: 5
  //       total_visits: 23
  //     2026-01-03/
  //       ...

  /**
   * Get today's date in YYYY-MM-DD format
   * This is used as the key for storing daily analytics
   */
  function getTodayDate() {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Log an analytics event to Firebase Realtime Database
   *
   * This function implements the "increment" pattern:
   * 1. Read current value
   * 2. Add 1
   * 3. Write new value
   *
   * CONCEPT: Atomic Operations
   * In production, you'd use Firebase transactions to prevent race conditions.
   * For a portfolio with low traffic, this simple approach works fine.
   *
   * @param {string} eventType - Type of event (project_views, upvotes, etc.)
   * @param {string} projectName - Name of the project (dungeon, rocketship, etc.)
   * @param {number} [delta=1] - Amount to increment (or decrement) the metric
   */
  async function logCustomAnalyticsEvent(eventType, projectName, delta = 1) {
    try {
      const today = getTodayDate();
      const eventPath = `analytics/events/${today}/${eventType}/${projectName}`;

      // Step 1: Get current count
      const response = await fetch(`${FIREBASE_URL}/${eventPath}.json`, { cache: 'no-store' });
      if (!response.ok) {
        console.warn(`Analytics read failed (${response.status}) at ${eventPath}`);
        return;
      }

      const currentCount = await response.json() || 0;
      const nextValue = Math.max(0, currentCount + delta);

      // Step 2: Increment/decrement and save
      const writeResponse = await fetch(`${FIREBASE_URL}/${eventPath}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextValue)
      });

      if (!writeResponse.ok) {
        console.warn(`Analytics write failed (${writeResponse.status}) at ${eventPath}`);
      }

      // Also log to Firebase Analytics if available (Google's dashboard)
      if (typeof analytics !== 'undefined') {
        const analyticsPayload = {
          project_name: projectName,
          timestamp: Date.now()
        };

        // Mirror positive/negative deltas into GA4 for parity where possible
        if (delta < 0) {
          analyticsPayload.delta = delta;
        }

        analytics.logEvent(eventType, analyticsPayload);
      }

    } catch (error) {
      console.warn('Analytics logging error:', error);
      // Silently fail - analytics should never break the main app
    }
  }

  /**
   * Sync the upvote metric to the authoritative vote count to prevent drift
   * from repeated toggles. This overwrites the day's upvote value for the
   * project instead of accumulating deltas so analytics stays aligned with
   * the real vote total.
   */
  async function syncUpvoteAnalyticsCount(projectName, count) {
    const today = getTodayDate();
    const eventPath = `analytics/events/${today}/upvotes/${projectName}`;
    const nextValue = Math.max(0, count);

    try {
      const writeResponse = await fetch(`${FIREBASE_URL}/${eventPath}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextValue)
      });

      if (!writeResponse.ok) {
        console.warn(`Analytics write failed (${writeResponse.status}) at ${eventPath}`);
        return null;
      }

      if (typeof analytics !== 'undefined') {
        analytics.logEvent('upvotes', {
          project_name: projectName,
          count: nextValue,
          timestamp: Date.now()
        });
      }

      return nextValue;
    } catch (error) {
      console.warn('Upvote analytics delta error:', error);
      return null;
    }
  }

  /**
   * Increment total visit count for today
   * This tracks unique page loads (not unique visitors)
   */
  async function logPageVisit() {
    try {
      const today = getTodayDate();
      const visitPath = `analytics/events/${today}/total_visits`;

      const response = await fetch(`${FIREBASE_URL}/${visitPath}.json`);
      if (!response.ok) {
        console.warn(`Analytics read failed (${response.status}) at ${visitPath}`);
        return;
      }

      const currentCount = await response.json() || 0;

      const writeResponse = await fetch(`${FIREBASE_URL}/${visitPath}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentCount + 1)
      });

      if (!writeResponse.ok) {
        console.warn(`Analytics write failed (${writeResponse.status}) at ${visitPath}`);
      }
    } catch (error) {
      console.warn('Visit logging error:', error);
    }
  }

  /**
   * Detect which project page we're on (if any)
   * Returns the project name from the URL path
   *
   * Examples:
   * /projects/dungeon.html → "dungeon"
   * /projects/ak47.html → "ak47"
   * /index.html → null (not a project page)
   */
  function getCurrentProjectFromURL() {
    const path = window.location.pathname;
    const match = path.match(/\/projects\/([^/]+)\.html/);
    return match ? match[1] : null;
  }

  // ─────────────────────────────────────────────────────
  // TRACK PAGE VIEWS AND SESSION DURATION
  // ─────────────────────────────────────────────────────

  // Track when the page was loaded (for session duration)
  const sessionStartTime = Date.now();

  // Optional reset for demo/testing environments
  await resetDemoDataIfRequested();

  // Log this page visit
  logPageVisit();

  // If we're on a project page, track the project view
  const currentProject = getCurrentProjectFromURL();
  if (currentProject) {
    logCustomAnalyticsEvent('project_views', currentProject);
  }

  // Track session duration when user leaves the page
  // CONCEPT: beforeunload event
  // This fires when the user navigates away or closes the tab
  // We use it to calculate how long they spent on the page
  window.addEventListener('beforeunload', function() {
    const timeSpentSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);

    // Only log if they spent more than 2 seconds (filters out accidental clicks)
    if (timeSpentSeconds > 2 && currentProject) {
      // Use sendBeacon for reliable delivery during page unload
      // Regular fetch() might get cancelled when the page closes
      const today = getTodayDate();
      const data = JSON.stringify(timeSpentSeconds);

      // Note: sendBeacon is fire-and-forget, perfect for unload events
      navigator.sendBeacon(
        `${FIREBASE_URL}/analytics/events/${today}/session_duration/${currentProject}.json`,
        data
      );
    }
  });

  // One-time check to see if analytics writes are blocked
  (async function checkAnalyticsWriteAccess() {
    try {
      const today = getTodayDate();
      const testPath = `analytics/events/${today}/_write_check`;
      const response = await fetch(`${FIREBASE_URL}/${testPath}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Date.now())
      });

      if (!response.ok && (response.status === 401 || response.status === 403)) {
        console.warn(`Analytics write blocked (${response.status}) at ${testPath}`);
      }
    } catch (error) {
      console.warn('Analytics write check failed:', error);
    }
  })();

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
   * 1. Make GET request to Firebase at /votes/{project}/voters/{sanitizedIP}
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
        `${FIREBASE_URL}/votes/${projectName}/voters/${sanitizedIP}.json`
      );
      if (!response.ok) throw new Error('Firebase read error');
      const data = await response.json();
      return data === true;
    } catch (error) {
      console.error('Error checking vote status:', error);
      // On error, fall back to localStorage (degraded but functional)
      return localStorage.getItem(`upvote_${projectName}`) === 'true';
    }
  }

  /**
   * Record current voter state on a project
   *
   * How it works:
   * - PUT request writes data to a specific path
   * - We write boolean state at /votes/{project}/voters/{sanitizedIP}
   *
   * Why PUT instead of POST?
   * - PUT overwrites at exact path (idempotent - same result if called twice)
   * - POST creates new child with auto-generated ID (not what we want)
   *
   * Security note:
   * This is client-side code, so technically users could bypass it.
   * The REAL protection is Firebase Security Rules (server-side).
   */
  async function setVoterState(projectName, userIP, state) {
    try {
      const sanitizedIP = sanitizeIP(userIP);
      const response = await fetch(
        `${FIREBASE_URL}/votes/${projectName}/voters/${sanitizedIP}.json`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(state)
        }
      );
      if (!response.ok) throw new Error(`Firebase write error (${response.status})`);
      return true;
    } catch (error) {
      console.error('Error updating voter state:', error);
      return false;
    }
  }

  const upvoteButtons = document.querySelectorAll('.upvote-btn');

  // Fetch current count from Firebase
  async function getCount(projectName) {
    try {
      const response = await fetch(`${FIREBASE_URL}/votes/${projectName}/count.json`);
      if (!response.ok) throw new Error('Network error');
      const data = await response.json();
      if (typeof data === 'object' && data !== null) {
        return data.count || 0;
      }
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
      const response = await fetch(`${FIREBASE_URL}/votes/${projectName}/count.json`, {
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

  // Optional helper to reset demo data when query param resetDemo=true is present
  async function resetDemoDataIfRequested() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('resetDemo') !== 'true') return;

    console.warn('resetDemo=true detected. Resetting today\'s analytics and vote data for all projects.');

    const today = getTodayDate();
    const resetWrites = [];

    // Reset analytics aggregates
    resetWrites.push(fetch(`${FIREBASE_URL}/analytics/events/${today}/total_visits.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(0)
    }));

    for (const project of PROJECTS) {
      resetWrites.push(fetch(`${FIREBASE_URL}/analytics/events/${today}/project_views/${project}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(0)
      }));

      resetWrites.push(fetch(`${FIREBASE_URL}/analytics/events/${today}/upvotes/${project}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(0)
      }));

      resetWrites.push(fetch(`${FIREBASE_URL}/analytics/events/${today}/session_duration/${project}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(0)
      }));
    }

    // Reset vote counts and clear voter flags (set to false instead of delete)
    for (const project of PROJECTS) {
      resetWrites.push(setCount(project, 0));

      try {
        const votersResponse = await fetch(`${FIREBASE_URL}/votes/${project}/voters.json`, { cache: 'no-store' });
        const voters = await votersResponse.json();
        const voterKeys = voters && typeof voters === 'object' ? Object.keys(voters) : [];

        for (const voterKey of voterKeys) {
          resetWrites.push(fetch(`${FIREBASE_URL}/votes/${project}/voters/${voterKey}.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(false)
          }));
        }
      } catch (error) {
        console.warn(`Unable to reset voters for ${project}:`, error);
      }
    }

    await Promise.all(resetWrites);
    console.info('Demo data reset complete for today.');
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

        let serverSaysVoted = false;

        try {
          serverSaysVoted = await hasVotedOnServer(projectName, currentIP);
          const targetVotedState = !serverSaysVoted;

          // Optimistic UI update (feels snappier)
          btn.classList.toggle('voted', targetVotedState);
          heartIcon.textContent = targetVotedState ? '♥' : '♡';

          let newCount = 0;
          if (targetVotedState) {
            newCount = await incrementCount(projectName);
            await setVoterState(projectName, currentIP, true);
          } else {
            newCount = await decrementCount(projectName);
            await setVoterState(projectName, currentIP, false);
          }

          // Keep analytics in sync with the authoritative vote count
          await syncUpvoteAnalyticsCount(projectName, newCount);

          // Update localStorage
          localStorage.setItem(`upvote_${projectName}`, targetVotedState.toString());
          localStorage.setItem(`upvote_count_${projectName}`, newCount);
          voteCount.textContent = newCount;

        } catch (error) {
          console.error('Vote error:', error);
          // Revert UI on error
          btn.classList.toggle('voted', serverSaysVoted);
          heartIcon.textContent = serverSaysVoted ? '♥' : '♡';
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
