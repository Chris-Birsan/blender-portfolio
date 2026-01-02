Codex Plan: Fix Mobile “CB” Logo + Fix Mobile Nav Bug + Test + Commit + Push
Repo assumptions

Static site deployed on GitHub Pages with:

index.html

styles.css

script.js

projects/*.html (multiple pages with same nav)

PHASE 0 — Setup

Open repo root (GitHub folder).

Create a new branch:

git checkout -b fix/mobile-nav-logo


Start a local web server from repo root:

python -m http.server 8000


Open in browser:

http://localhost:8000/

Open Chrome DevTools → Toggle device toolbar:

iPhone 12/13 preset (390×844)

Also check 360×800 and 768×1024

PHASE 1 — Fix the “CB” Logo on Mobile (All Pages)
Goal

Make the “CB” logo look clean and properly placed on mobile on every page (home + project pages).

Steps

Identify the logo element in the nav:

Likely .nav-brand h2, .logo, or similar.

Ensure the nav markup is consistent across:

index.html

all projects/*.html

If markup differs, standardize it so the same CSS applies everywhere.

In styles.css, add/adjust a mobile media query:

@media (max-width: 768px) {
  /* mobile nav layout */
}


Inside that mobile section:

Force the nav bar to be a fixed top bar (height 60px)

Make the brand/logo vertically centered

Reduce logo font size + ensure no wrapping

Remove weird margins/padding that push “CB” out of place

Minimum mobile CSS requirements (Codex must tune to existing classes/IDs)

Nav container (example #main-nav or .sidebar):

position: fixed; top: 0; left: 0; width: 100%; height: 60px; z-index: 9999;

display: flex; align-items: center;

Logo container:

display: flex; align-items: center; height: 60px;

Logo text:

smaller font (ex: 18px–20px)

line-height: 1;

white-space: nowrap;

fix gradient clipping if used: -webkit-background-clip: text; -webkit-text-fill-color: transparent;

Acceptance checks (must verify)

Home page on mobile: “CB” not awkward/off-center

At least 2 project pages on mobile: same improvement

No clipping, no weird vertical misalignment

PHASE 2 — Fix Mobile Navigation Bug (Hamburger + Stable Behavior)
Goal

Mobile navigation should not “bug out” when clicked. It must open/close reliably.

Steps

Reproduce bug in mobile emulation:

Click nav/menu repeatedly

Navigate to other pages

Confirm what breaks (double toggles, stuck open, overlay issues, etc.)

Implement a stable mobile nav pattern:

Add a hamburger button if not present:

id="nav-toggle"

Wrap nav links in a container:

id="nav-menu"

In styles.css (mobile section):

Hide menu by default on mobile

Show menu when .open class is applied

Ensure correct z-index and positioning so it doesn’t glitch over/under content

Body must be offset for fixed top nav:

padding-top: 60px (or match actual height)

In script.js, add robust toggle logic:

On DOMContentLoaded:

Find #nav-toggle and #nav-menu

Toggle .open on click

Close menu when any nav link is clicked

Close menu on resize above 768px

Prevent duplicate event listeners (don’t attach listeners multiple times)

Acceptance checks (must verify)

Mobile emulation:

Hamburger opens/closes reliably with repeated clicks

Menu does not flicker or get stuck

Clicking a nav link closes the menu and navigates properly

No console errors

PHASE 3 — Mobile Testing Checklist (Codex must do these)

Codex must run and confirm each item:

Open index.html in browser (via local server)

DevTools → iPhone preset:

Check “CB” logo placement

Open/close nav 10 times (stress test)

Click menu links (confirm no bug)

Go to at least 2 pages in projects/ and confirm:

“CB” logo looks correct on mobile

Menu works there too

Resize back to desktop width:

Ensure nav still works normally

Ensure layout isn’t broken

Codex must report test results in final summary.

PHASE 4 — Commit + Push

Confirm changes:

git status


Commit with message:

git add .
git commit -m "Fix mobile logo layout and navigation"


Push branch:

git push origin fix/mobile-nav-logo


Merge to main (choose based on repo workflow):

If direct main allowed:

git checkout main
git merge fix/mobile-nav-logo
git push origin main


If PR workflow:

Open PR from fix/mobile-nav-logo → main, then merge

Final Output Requirements (Codex must include)

List of files changed

What was changed for logo styling

What was changed for mobile nav behavior

Confirmation of mobile tests performed (with which device preset)

Commit hash + confirmation pushed to main (or PR created)