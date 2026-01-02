# Blender Portfolio Code Walkthrough & Quiz

This document explains every line of the site code (HTML → JavaScript → CSS) in the order the browser processes it. Each section lists the original line numbers so you can cross-reference the files.

## 1) `index.html` (page structure and content)
- **Line 1 – `<!DOCTYPE html>`**: Declares HTML5 so the browser uses the modern parsing rules.
- **Line 2 – `<html lang="en">`**: Starts the root element and tells assistive tech the content language is English.
- **Lines 3–8 – `<head>` section**: Wraps metadata such as character set, responsive viewport, document title, and the CSS link to `styles.css` that controls presentation.
- **Lines 10–38 – `<body>` + navigation bar**
  - Line 11: `<nav id="main-nav">` fixes the navigation container for layout and styling hooks.
  - Lines 12–16: The hamburger button (`id="nav-toggle"`) shows/hides the menu on mobile. It uses `aria-*` attributes for accessibility (labels and expanded state).
  - Lines 18–20: Brand section with a short "CB" logo.
  - Lines 22–37: Main navigation list. Each `li > a` is a link; the first is marked `.active` for the current page. Lines 24–36 implement a dropdown labeled "Projects" with nested links to each project page.
- **Lines 39–42 – `<header>`**: Hero banner title and subtitle describing the portfolio.
- **Lines 43–53 – `#hero` section**: Friendly introduction paragraph text welcoming visitors and setting expectations.
- **Lines 55–190 – `#projects` section**
  - Line 56: Section heading.
  - Lines 57–188: A CSS grid of project cards, each wrapped in an anchor linking to its project detail page.
  - For each project block (Dungeon, Rocketship, AK47, AWP, Pizza, Mouse, House, Lighthouse):
    - `div.project-card`: Card container for hover effects and layout.
    - `div.upvote-container` + `button.upvote-btn`: Heart button with `data-project` identifying the project. Children: `.heart-icon` shows the heart character; `.vote-count` shows current votes.
    - Media preview: either a looping `<video>` (Dungeon) or `<img>` tag pointing to a thumbnail.
    - `<h3>` title, `<p>` description, and a "View Project" span styled as a call-to-action.
- **Lines 192–193 – Script include and body close**: Loads `script.js` after the markup so the DOM exists when the code runs.

## 2) `script.js` (behavior and data flow)
The JavaScript is wrapped in a `DOMContentLoaded` listener (line 2) so it runs after the HTML is parsed.

### 2.1 Hamburger menu & dropdown (lines 4–67)
- Lines 7–9: Grab references to the toggle button, menu, and dropdown trigger.
- Lines 11–19: `resetDropdowns()` collapses any open dropdowns and clears inline `maxHeight` so CSS can animate cleanly.
- Lines 21–28: `closeMenu()` closes the whole nav, updates ARIA state, and resets dropdowns.
- Lines 30–67: Event wiring
  - Lines 31–38: Toggle menu open/closed on hamburger click; update `aria-expanded`; reset dropdowns when closing.
  - Lines 40–44: Close menu after clicking any nav link (good for mobile experience).
  - Lines 46–58: Dropdown toggle on small screens only (`innerWidth > 768` check). Uses `maxHeight` to animate open height.
  - Lines 60–66: On window resize, close/open elements appropriately so desktop view resets to a clean state.

### 2.2 Upvotes with Firebase + localStorage fallback (lines 69–195)
- Line 75: `FIREBASE_URL` points to a public Realtime Database endpoint.
- Line 77: Collect all `.upvote-btn` elements.
- Lines 79–91: `getCount(projectName)` fetches votes from Firebase (`fetch` GET). On error, falls back to `localStorage` so users still see a stored value.
- Lines 93–109: `setCount(projectName, count)` writes the count to Firebase via `PUT`; on error, stores locally.
- Lines 111–117: `incrementCount()` reads, adds one, writes, and returns the new count.
- Lines 119–125: `decrementCount()` subtracts one but never below zero.
- Lines 127–195: Initialize each upvote button
  - Lines 129–135: Read project name and cached "has voted" flag from `localStorage` to preserve user state.
  - Lines 136–141: If already voted, mark the button `.voted` and fill the heart.
  - Lines 142–149: Fetch shared count from Firebase; update text and cache locally; if it fails, show cached value.
  - Lines 151–195: Click handler
    - Prevents navigation (since buttons sit inside links).
    - Disables button while asynchronous work runs.
    - If user already voted: remove voted class, outline heart, set flag false, call `decrementCount()`, and update text/storage.
    - If not yet voted: add voted class, filled heart, set flag true, call `incrementCount()`, and update text/storage.
    - Lines 181–190: Error handling restores UI to previous state if network write fails.
    - Line 193: Re-enables the button.

### 2.3 Lightbox gallery (lines 197–306)
- Lines 201–211: Dynamically create a `#lightbox` overlay with close button, navigation arrows, image placeholder, and counter; append to `body`.
- Lines 213–220: Cache references to gallery images (any `.gallery-grid img` present on project detail pages) and the lightbox elements.
- Lines 221–223: Track the current index and array of images.
- Lines 225–235: Build the `images` array from the page thumbnails and attach click handlers to open the lightbox at the clicked image.
- Lines 237–264: Helper functions to open the lightbox, set the displayed image/counter, navigate next/previous (wrapping), and close (restoring page scroll).
- Lines 266–279: Wire the arrow buttons to navigate without closing the overlay.
- Lines 281–285: Close button handler.
- Lines 286–291: Close when clicking the dark backdrop instead of the image.
- Lines 293–304: Keyboard shortcuts: `Escape` closes; left/right arrows navigate when the lightbox is open.

## 3) `styles.css` (visual design)
CSS controls layout, colors, typography, cards, nav, buttons, lightbox, and responsive behavior.

### 3.1 Global typography & layout (lines 1–124)
- Lines 1–6: Base `body` styles (background, font, spacing).
- Lines 8–26: Heading and paragraph colors, sizes, and spacing for readability.
- Lines 28–44: Gradient animated header block with padding, rounding, and shadow.
- Lines 46–56: `@keyframes gradientWave` drives the moving gradient used by header and logo text.
- Lines 58–70: Header text styling.
- Lines 72–78: `#hero` card appearance.
- Lines 80–124: Project grid layout, card styling, hover elevation, and media sizing.

### 3.2 Sidebar navigation (lines 127–280)
- Lines 127–142: Fixed left sidebar sizing, padding, and layout column.
- Lines 144–171: Brand container and animated gradient text logo.
- Lines 173–191: Menu list reset and link base styles, including hover gradient overlay via `::before` pseudo-element (lines 194–213) and hover color change (lines 216–223). `.active` marks the current page.
- Lines 229–255: Dropdown styles, including `max-height` animation and nested link indentation.
- Lines 256–259: Body left margin to make room for the fixed sidebar on desktop.
- Lines 262–279: Link wrapper styling (`.project-card-link`) and call-to-action coloring.

### 3.3 Project detail pages (lines 282–383)
- Defines `.project-detail` container sizing, back button, headers, meta text, upvote button scaling, hero media presentation, description lists with custom bullets, and responsive grid for galleries.

### 3.4 Lightbox visuals (lines 384–574)
- Lines 384–400: Gallery grid layout and hover zoom.
- Lines 402–424: `.project-nav` and next-project button styling.
- Lines 428–474: `#lightbox` overlay positioning, dark backdrop, zoom animation, and close button hover color.
- Lines 476–574: Clickable gallery images cursor, upvote button styling (shape, shadows, voted color), navigation arrows (size, background), and on-screen counter bubble.

### 3.5 Hamburger & mobile responsiveness (lines 575–749)
- Lines 575–611: Base hamburger icon styling and transformation into an “X” when active.
- Lines 612–749 (`@media (max-width: 768px)`): Mobile layout rules
  - Navigation becomes a top bar; hamburger is visible; brand repositions; menu slides down with animated max-height and fades via opacity/pointer-events.
  - Body margins/padding adjust for the compact nav.
  - Header and hero padding shrink; project grid becomes a single column.
  - Project detail spacing reduces; lightbox arrows and close icon shrink and move inward for smaller screens.

## 4) How everything flows (E2E)
1. **HTML builds the structure:** The nav, hero, and project cards provide semantic anchors for styling and scripting.
2. **CSS paints the page:** The fixed sidebar, gradients, cards, and responsive media queries make the layout attractive on desktop and mobile.
3. **JavaScript enhances interactivity:**
   - Hamburger controls the sidebar on small screens.
   - Dropdown animates smoothly with `max-height`.
   - Upvote buttons read/write shared counts (Firebase) but fall back to local storage for resilience, while also storing per-user vote state.
   - Lightbox turns any gallery grid into an immersive viewer with keyboard support.
4. **Progressive enhancement:** If JS fails, the HTML still shows project links; CSS still presents them. Upvotes and lightbox simply won’t activate.

## 5) Study quiz (28 questions)
Test yourself after reading. Answers are at the end.

1. What does the `<!DOCTYPE html>` declaration accomplish for the page?
2. Why is `lang="en"` important on the `<html>` tag?
3. Which tag links the stylesheet, and why is it placed in `<head>`?
4. What accessibility roles do the `aria-label` and `aria-expanded` attributes serve on the hamburger button?
5. How does the dropdown behave differently on desktop vs. mobile?
6. Why is the script tag placed just before `</body>`?
7. What problem does wrapping code in `DOMContentLoaded` solve?
8. How does `navMenu.classList.toggle('open')` support the hamburger interaction?
9. Why does the dropdown click handler return early when `window.innerWidth > 768`?
10. What does `e.preventDefault()` do inside the upvote click handler?
11. How does the code remember whether the user has already voted on a project?
12. What is the purpose of `localStorage` in both `getCount` and `setCount`?
13. Why does `Math.max(0, currentCount - 1)` appear in `decrementCount`?
14. How does the UI respond if the Firebase request fails during a vote toggle?
15. Why is the upvote button disabled (`btn.disabled = true`) during the async work?
16. Where do the lightbox elements come from, and why are they created dynamically instead of being in the HTML?
17. How does the lightbox determine which image to show when you click a thumbnail?
18. What CSS property and pseudo-element create the gradient hover effect on nav links?
19. How does the fixed sidebar affect the body’s margin on desktop?
20. What grid rule (`grid-template-columns`) makes the project cards responsive?
21. Why do project card images and videos use `object-fit: cover`?
22. What does the `@keyframes gradientWave` animation control?
23. How does the mobile media query change the navigation layout?
24. Why do the hamburger bars rotate and fade when the menu is active?
25. How is the lightbox closed using the keyboard?
26. What prevents vote counts from becoming negative?
27. How does the site remain usable if JavaScript is disabled?
28. Why is the Firebase URL stored in a constant instead of repeating the string inline?

### Answer key
1. It enables HTML5 standards mode so modern browser rules apply.
2. It informs screen readers/search engines of the document language for accessibility and SEO.
3. `<link rel="stylesheet" href="styles.css">`; loading CSS in `<head>` lets the page render styled content as soon as it appears.
4. They describe the button’s purpose to assistive tech and announce whether the menu is open.
5. Desktop opens on hover (CSS), but mobile requires a click and uses animated `max-height` because hover isn’t reliable on touch devices.
6. It ensures the DOM exists before the script runs and avoids blocking page rendering.
7. It waits for the HTML to finish parsing so DOM queries (like `getElementById`) succeed.
8. It toggles the `.open` class, which CSS uses to expand or collapse the menu.
9. To avoid hijacking desktop hover behavior—click-to-open is only for small screens.
10. It stops the surrounding link from navigating away when the button is clicked.
11. A `localStorage` key `upvote_<project>` flags whether the user has voted.
12. It caches counts locally so the UI can show a value even if the network fails.
13. It guards against negative numbers when removing a vote.
14. The code restores the previous heart state so the UI stays consistent.
15. To prevent double-clicks and race conditions while the network request runs.
16. They are injected by JS so every project page can reuse the same lightbox markup without duplicating HTML.
17. The click handler stores the clicked index, then `updateLightboxImage()` displays that item from the `images` array.
18. The `.nav-link::before` pseudo-element with an animated linear gradient provides the hover stripe.
19. `body { margin-left: 250px; }` shifts content so it doesn’t sit under the fixed sidebar.
20. `grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));` lets the grid auto-fit cards.
21. It crops media to fill the card area without distorting aspect ratio.
22. It animates the gradient positions for both header and logo text backgrounds.
23. The nav becomes a 60px top bar with a slide-down menu; body padding adjusts to avoid overlap.
24. CSS transforms the spans into an “X” to visually indicate the menu can be closed.
25. Pressing `Escape` calls `closeLightbox()` when the overlay is visible.
26. The decrement function clamps the count with `Math.max(0, ...)`.
27. HTML and CSS still render content and navigation links; only JS-powered features (votes/lightbox/hamburger) fail gracefully.
28. A single constant avoids duplication and typos, making maintenance easier.
