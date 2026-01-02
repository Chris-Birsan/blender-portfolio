# Test Report

## Scope
Manual verification plan for the upvote toggle and analytics dashboard after the drift fix. Use the built-in reset helpers to start from a clean slate before running checks.

## Pre-flight Reset
- Visit any page with `?resetDemo=true` appended (e.g., `index.html?resetDemo=true`) to zero votes, analytics events for today, and clear voter flags without issuing DELETEs.
- Alternatively, open `analytics.html`, unlock the dashboard, and click **Reset Today** to perform the same cleanup and refresh the charts.

## Steps
1. Start the local server: `python -m http.server 8080` (from the repo root).
2. Open `index.html?resetDemo=true` once to reset data, then reload `index.html` normally.
3. Upvote a project, confirm the count increases, refresh the page, and confirm the state persists.
4. Unvote the same project, confirm the count decreases, refresh again, and confirm the state remains unvoted.
5. Toggle the same project multiple times (e.g., 5 on/off cycles) and verify the final vote count and the dashboard upvote metric both return to the starting value.
6. Open `analytics.html`, enter the dashboard password, click **Refresh Data**, and confirm hero metrics and the leaderboard reflect the interactions (non-zero where expected and zeroed after resets).

## Expected Outcomes
- Upvote counts and dashboard upvote totals stay aligned even after repeated toggles (no cumulative inflation).
- Reset flows bring today’s analytics and vote data back to zero without breaking the UI.
- Hamburger menu, lightbox navigation, and other existing UI behaviors remain intact.
