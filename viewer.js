/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 3D MODEL VIEWER - JavaScript Controller
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This file handles:
 * 1. Model switching (when user clicks different model options)
 * 2. Analytics tracking (views, interactions, time spent)
 * 3. Loading states and UI updates
 *
 * CONCEPTS COVERED:
 * - Event delegation (efficient click handling)
 * - State management (tracking current model and view time)
 * - Async/await (Firebase API calls)
 * - Custom events (model-viewer component events)
 */

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Firebase Realtime Database URL
 * This is where we store and retrieve analytics data.
 * It's the same URL used in your main site - keeps all data together!
 */
const FIREBASE_URL = 'https://blender-portfolio-default-rtdb.firebaseio.com';

/**
 * MODEL DATA
 * ==========
 * This object stores metadata about each of your Blender models.
 *
 * Why use an object instead of hardcoding in HTML?
 * 1. Single source of truth (change once, updates everywhere)
 * 2. Easy to add new models (just add another entry)
 * 3. Clean separation of data and presentation
 *
 * Each model has:
 * - name: Display name for the title
 * - description: Shown below the viewer
 * - category: For analytics grouping
 * - file: Path to the .glb file
 *
 * PLACEHOLDER PATHS: Replace 'models/xxx.glb' with your actual GLB files
 */
const MODELS = {
  dungeon: {
    name: 'Dungeon Environment',
    description: 'A medieval dungeon environment featuring stone walls, torches, and atmospheric lighting. Created in Blender with PBR materials, this scene demonstrates environmental storytelling and mood-setting through careful light placement.',
    category: 'Environment',
    file: 'models/dungeon.glb'
  },
  rocketship: {
    name: 'Rocketship',
    description: 'A stylized sci-fi rocketship with detailed hull plating, thruster arrays, and cockpit windows. Features metallic PBR materials and glass shaders for realistic reflections.',
    category: 'Vehicle',
    file: 'models/rocketship.glb'
  },
  ak47: {
    name: 'AK47 Assault Rifle',
    description: 'Detailed weapon model with accurate proportions, removable magazine, and weathered metal textures. Demonstrates hard-surface modeling techniques and realistic material work.',
    category: 'Weapon',
    file: 'models/ak47.glb'
  },
  awp: {
    name: 'AWP Sniper Rifle',
    description: 'Precision sniper rifle model featuring scope details, bipod, and accurate proportions. Showcases high-poly to low-poly workflow with baked normal maps.',
    category: 'Weapon',
    file: 'models/awp.glb'
  },
  pizza: {
    name: 'Pizza',
    description: 'A delicious-looking pizza with detailed toppings, melted cheese, and a golden crust. Demonstrates organic modeling and food-realistic texturing techniques.',
    category: 'Food',
    file: 'models/pizza.glb'
  },
  mouse: {
    name: 'Computer Mouse',
    description: 'Modern gaming mouse with ergonomic design, RGB accents, and clean topology. Features subdivision surface modeling and glossy plastic materials.',
    category: 'Tech',
    file: 'models/mouse.glb'
  },
  house: {
    name: 'House',
    description: 'Architectural house model with exterior details, windows, and landscaping. Demonstrates modular modeling techniques for game-ready assets.',
    category: 'Architecture',
    file: 'models/house.glb'
  },
  lighthouse: {
    name: 'Lighthouse',
    description: 'Coastal lighthouse scene with rocky terrain and ocean elements. Features environmental design, atmospheric fog, and dramatic lighting setup.',
    category: 'Environment',
    file: 'models/lighthouse.glb'
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// STATE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * STATE VARIABLES
 * ===============
 * These track the current state of the viewer.
 *
 * Why track state?
 * - currentModel: Know which model is displayed (for analytics)
 * - viewStartTime: Calculate how long user viewed each model
 * - interactionCount: Track engagement level
 *
 * This is a simple form of "state management" - in larger apps,
 * you'd use libraries like Redux or Zustand.
 */
let currentModel = 'dungeon';      // Which model is currently shown
let viewStartTime = Date.now();    // When did user start viewing this model?
let interactionCount = 0;          // How many times has user rotated/zoomed?
let hasTrackedInteraction = false; // Prevent spam-logging interactions

// ═══════════════════════════════════════════════════════════════════════════
// DOM ELEMENTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * DOM ELEMENT REFERENCES
 * ======================
 * We grab these once at load time, not every time we need them.
 *
 * Why?
 * - Performance: document.getElementById() has a cost
 * - Cleaner code: Reference by variable name instead of repeated lookups
 *
 * These are the elements we'll update when the user switches models.
 */
const modelViewer = document.getElementById('modelViewer');
const modelTitle = document.getElementById('modelTitle');
const modelDescription = document.getElementById('modelDescription');
const modelSelector = document.getElementById('modelSelector');
const progressBar = document.getElementById('progressBar');
const viewCountEl = document.getElementById('viewCount');
const interactionCountEl = document.getElementById('interactionCount');
const avgViewTimeEl = document.getElementById('avgViewTime');

// ═══════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * DOMContentLoaded EVENT
 * ======================
 * This event fires when the HTML has been fully parsed.
 * We wait for this before running our code to ensure all elements exist.
 *
 * Why not just put code at the bottom of the HTML?
 * - DOMContentLoaded is more reliable
 * - Works even if script is in <head>
 * - Industry standard practice
 */
document.addEventListener('DOMContentLoaded', () => {
  setupModelSelector();
  setupModelViewerEvents();
  loadModel('dungeon');
  trackPageView();
  fetchAndDisplayStats();

  // Hamburger menu functionality (same as main site)
  setupHamburgerMenu();
});

// ═══════════════════════════════════════════════════════════════════════════
// MODEL SELECTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * SETUP MODEL SELECTOR
 * ====================
 * This uses "event delegation" - we attach ONE click listener to the parent,
 * instead of one listener per button.
 *
 * How event delegation works:
 * 1. User clicks a model option
 * 2. Event "bubbles up" to the parent (modelSelector)
 * 3. We check event.target to see what was actually clicked
 * 4. Find the closest .model-option ancestor
 *
 * Benefits:
 * - Fewer event listeners = better performance
 * - Works for dynamically added elements
 * - Cleaner code
 */
function setupModelSelector() {
  modelSelector.addEventListener('click', (event) => {
    // Find the clicked model option (might be the icon or text inside it)
    const option = event.target.closest('.model-option');
    if (!option) return; // Clicked somewhere else

    const modelId = option.dataset.model;
    if (!modelId || modelId === currentModel) return; // Same model, no action

    // Switch to the new model
    loadModel(modelId);

    // Update active state in UI
    modelSelector.querySelectorAll('.model-option').forEach(opt => {
      opt.classList.remove('active');
    });
    option.classList.add('active');
  });
}

/**
 * LOAD MODEL
 * ==========
 * This function switches which 3D model is displayed.
 *
 * Steps:
 * 1. Track view duration of the previous model
 * 2. Update the model-viewer src attribute (triggers load)
 * 3. Update the info panel text
 * 4. Track the new model view in analytics
 * 5. Reset interaction tracking
 */
function loadModel(modelId) {
  const model = MODELS[modelId];
  if (!model) {
    console.error(`Model not found: ${modelId}`);
    return;
  }

  // Track how long user viewed the previous model
  if (currentModel && currentModel !== modelId) {
    trackModelViewDuration(currentModel);
  }

  // Update the model-viewer element
  // When we change `src`, the component automatically:
  // - Stops loading the old model
  // - Starts loading the new model
  // - Shows loading progress
  // - Renders when ready
  modelViewer.src = model.file;

  // Update info panel
  modelTitle.textContent = model.name;
  modelDescription.textContent = model.description;

  // Update state
  currentModel = modelId;
  viewStartTime = Date.now();
  interactionCount = 0;
  hasTrackedInteraction = false;

  // Track this model view
  trackModelView(modelId);

  console.log(`Loaded model: ${model.name}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// MODEL-VIEWER EVENTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * SETUP MODEL-VIEWER EVENTS
 * =========================
 * The <model-viewer> component fires custom events that we can listen to.
 *
 * Available events:
 * - 'load': Model finished loading
 * - 'progress': Loading progress updated
 * - 'camera-change': User rotated/zoomed (fires frequently!)
 * - 'ar-status': AR mode status changed
 * - 'error': Something went wrong
 *
 * We use these to:
 * - Show loading progress
 * - Track user interactions
 * - Log analytics events
 */
function setupModelViewerEvents() {
  // Loading progress
  modelViewer.addEventListener('progress', (event) => {
    const progress = event.detail.totalProgress * 100;
    progressBar.style.width = `${progress}%`;
  });

  // Model loaded successfully
  modelViewer.addEventListener('load', () => {
    progressBar.style.width = '100%';
    console.log(`Model loaded: ${currentModel}`);

    // Track successful load in Firebase Analytics
    if (typeof analytics !== 'undefined') {
      analytics.logEvent('3d_model_loaded', {
        model_name: currentModel
      });
    }

    // Fade out progress bar after a moment
    setTimeout(() => {
      progressBar.style.width = '0%';
    }, 500);
  });

  // User interaction (camera movement)
  // This fires FREQUENTLY when user rotates, so we throttle our tracking
  let lastInteractionTime = 0;
  modelViewer.addEventListener('camera-change', () => {
    const now = Date.now();

    // Throttle: Only count interactions every 500ms
    if (now - lastInteractionTime > 500) {
      interactionCount++;
      lastInteractionTime = now;

      // Update UI
      interactionCountEl.textContent = interactionCount;

      // Track first interaction (user engaged with the model)
      if (!hasTrackedInteraction) {
        hasTrackedInteraction = true;
        trackModelInteraction(currentModel);
      }
    }
  });

  // Error handling
  modelViewer.addEventListener('error', (event) => {
    console.error('Model loading error:', event.detail);

    // You could show a user-friendly error message here
    modelDescription.textContent = 'Error loading model. The GLB file may not exist yet.';
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// ANALYTICS TRACKING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * ANALYTICS OVERVIEW
 * ==================
 * We track several types of events:
 *
 * 1. Page Views: Someone opened the 3D viewer
 * 2. Model Views: Someone looked at a specific model
 * 3. View Duration: How long they looked at each model
 * 4. Interactions: Did they rotate/zoom the model?
 *
 * Data goes to TWO places:
 * - Firebase Analytics (Google's service, 24-hour delay)
 * - Firebase Realtime Database (our custom dashboard, instant)
 *
 * This dual tracking gives us:
 * - Rich analytics in Google's console (demographics, devices, etc.)
 * - Real-time data in our custom dashboard (live updates)
 */

/**
 * Get today's date in YYYY-MM-DD format
 * Used as the key for storing daily analytics
 */
function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

/**
 * TRACK PAGE VIEW
 * ===============
 * Called once when the viewer page loads.
 * Logs to both Firebase Analytics and our custom database.
 */
async function trackPageView() {
  // Firebase Analytics (Google's dashboard)
  if (typeof analytics !== 'undefined') {
    analytics.logEvent('3d_viewer_page_view', {
      timestamp: Date.now()
    });
  }

  // Custom database (for our real-time dashboard)
  await logToDatabase('3d_viewer_visits', 'total');
}

/**
 * TRACK MODEL VIEW
 * ================
 * Called when user switches to a new model.
 *
 * @param {string} modelId - The model that was viewed
 */
async function trackModelView(modelId) {
  // Firebase Analytics
  if (typeof analytics !== 'undefined') {
    analytics.logEvent('3d_model_viewed', {
      model_name: modelId,
      model_category: MODELS[modelId]?.category || 'unknown'
    });
  }

  // Custom database
  await logToDatabase('3d_model_views', modelId);

  // Update stats display
  fetchAndDisplayStats();
}

/**
 * TRACK MODEL VIEW DURATION
 * =========================
 * Called when user switches away from a model (or leaves the page).
 * Calculates how long they spent viewing and logs it.
 *
 * Why track duration?
 * - Views alone don't show engagement quality
 * - 30 seconds viewing = more engaged than 2 seconds
 * - Helps identify which models are most interesting
 *
 * @param {string} modelId - The model that was viewed
 */
async function trackModelViewDuration(modelId) {
  const durationSeconds = Math.floor((Date.now() - viewStartTime) / 1000);

  // Ignore very short views (probably accidental clicks)
  if (durationSeconds < 2) return;

  console.log(`View duration for ${modelId}: ${durationSeconds}s`);

  // Firebase Analytics
  if (typeof analytics !== 'undefined') {
    analytics.logEvent('3d_model_view_duration', {
      model_name: modelId,
      duration_seconds: durationSeconds
    });
  }

  // Store duration in our database for averaging
  await logDurationToDatabase(modelId, durationSeconds);
}

/**
 * TRACK MODEL INTERACTION
 * =======================
 * Called when user first interacts with a model (rotates/zooms).
 *
 * @param {string} modelId - The model that was interacted with
 */
async function trackModelInteraction(modelId) {
  // Firebase Analytics
  if (typeof analytics !== 'undefined') {
    analytics.logEvent('3d_model_interacted', {
      model_name: modelId
    });
  }

  // Custom database
  await logToDatabase('3d_model_interactions', modelId);
}

/**
 * LOG TO DATABASE (INCREMENT)
 * ===========================
 * Generic function to increment a counter in Firebase.
 *
 * Database structure:
 * analytics/
 *   3d_viewer/
 *     2026-01-02/
 *       3d_model_views/
 *         dungeon: 15
 *         ak47: 8
 *
 * @param {string} eventType - Type of event (3d_model_views, etc.)
 * @param {string} key - Specific item (model name, 'total', etc.)
 */
async function logToDatabase(eventType, key) {
  try {
    const today = getTodayDate();
    const path = `analytics/3d_viewer/${today}/${eventType}/${key}`;

    // GET current value
    const response = await fetch(`${FIREBASE_URL}/${path}.json`);
    const currentCount = (await response.json()) || 0;

    // PUT incremented value
    await fetch(`${FIREBASE_URL}/${path}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentCount + 1)
    });

  } catch (error) {
    console.warn('Analytics logging error:', error);
    // Analytics errors should never break the app
  }
}

/**
 * LOG DURATION TO DATABASE
 * ========================
 * Stores view durations for calculating averages.
 *
 * We store:
 * - total_time: Sum of all view durations
 * - view_count: Number of views (for calculating average)
 *
 * Average = total_time / view_count
 *
 * @param {string} modelId - The model that was viewed
 * @param {number} seconds - Duration in seconds
 */
async function logDurationToDatabase(modelId, seconds) {
  try {
    const today = getTodayDate();
    const basePath = `analytics/3d_viewer/${today}/3d_model_durations/${modelId}`;

    // Get current totals
    const totalResponse = await fetch(`${FIREBASE_URL}/${basePath}/total_seconds.json`);
    const currentTotal = (await totalResponse.json()) || 0;

    const countResponse = await fetch(`${FIREBASE_URL}/${basePath}/view_count.json`);
    const currentCount = (await countResponse.json()) || 0;

    // Update both values
    await fetch(`${FIREBASE_URL}/${basePath}/total_seconds.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentTotal + seconds)
    });

    await fetch(`${FIREBASE_URL}/${basePath}/view_count.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentCount + 1)
    });

  } catch (error) {
    console.warn('Duration logging error:', error);
  }
}

/**
 * FETCH AND DISPLAY STATS
 * =======================
 * Gets today's analytics data and updates the stats bar.
 */
async function fetchAndDisplayStats() {
  try {
    const today = getTodayDate();

    // Fetch today's 3D viewer data
    const response = await fetch(`${FIREBASE_URL}/analytics/3d_viewer/${today}.json`);
    const data = await response.json();

    if (!data) {
      viewCountEl.textContent = '0';
      avgViewTimeEl.textContent = '0s';
      return;
    }

    // Calculate total views across all models
    const views = data['3d_model_views'] || {};
    const totalViews = Object.values(views).reduce((sum, count) => sum + count, 0);
    viewCountEl.textContent = totalViews;

    // Calculate average view time across all models
    const durations = data['3d_model_durations'] || {};
    let totalSeconds = 0;
    let totalViewCount = 0;

    Object.values(durations).forEach(model => {
      totalSeconds += model.total_seconds || 0;
      totalViewCount += model.view_count || 0;
    });

    const avgSeconds = totalViewCount > 0 ? Math.round(totalSeconds / totalViewCount) : 0;
    avgViewTimeEl.textContent = `${avgSeconds}s`;

  } catch (error) {
    console.warn('Error fetching stats:', error);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE UNLOAD TRACKING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * BEFOREUNLOAD EVENT
 * ==================
 * Fires when the user is about to leave the page.
 *
 * This is our last chance to log the final model's view duration.
 *
 * Why use beforeunload?
 * - Catches all exit scenarios (navigate away, close tab, refresh)
 * - Guaranteed to fire before page unloads
 *
 * Note: We use sendBeacon for reliability during unload.
 * Regular fetch() might get cancelled when the page closes.
 */
window.addEventListener('beforeunload', () => {
  // Calculate final view duration
  const durationSeconds = Math.floor((Date.now() - viewStartTime) / 1000);

  if (durationSeconds >= 2 && currentModel) {
    // Use sendBeacon for reliable delivery during page unload
    const today = getTodayDate();

    // Note: sendBeacon doesn't support complex operations,
    // so we just log the duration. The increment logic won't work here,
    // but we'll at least capture some data.
    navigator.sendBeacon(
      `${FIREBASE_URL}/analytics/3d_viewer/${today}/3d_model_durations/${currentModel}/last_duration.json`,
      JSON.stringify(durationSeconds)
    );
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// HAMBURGER MENU (Same as main site)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * HAMBURGER MENU SETUP
 * ====================
 * Replicates the mobile navigation from the main site.
 * This ensures consistent UX across all pages.
 */
function setupHamburgerMenu() {
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
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSOLE MESSAGE
// ═══════════════════════════════════════════════════════════════════════════

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║  3D Model Viewer Loaded!                                      ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  This viewer uses Google's model-viewer library with          ║
║  Firebase Analytics integration.                              ║
║                                                               ║
║  Technologies:                                                ║
║  • model-viewer (Three.js + WebGL under the hood)            ║
║  • Firebase Realtime Database (real-time analytics)          ║
║  • Firebase Analytics (Google's analytics dashboard)          ║
║                                                               ║
║  Add your GLB files to the /models/ folder:                   ║
║  • models/dungeon.glb                                         ║
║  • models/rocketship.glb                                      ║
║  • models/ak47.glb                                           ║
║  • etc.                                                       ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`);
