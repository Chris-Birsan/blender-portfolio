# agents.md — CODEX TASK: Revise Analytics Dashboard Leaderboard Metrics + Ranking

You are Codex operating inside this repository. Implement the UI + logic changes below exactly.

## Goal
Revise the Analytics Dashboard “Project Leaderboard” to:
1) Remove “AVG CONVERSION RATE” completely from the hero metrics
2) Replace “CONVERSION RATE” in the leaderboard with “Upvote Ratio” (or similar wording)
3) Change leaderboard ranking rules:
   - Primary sort: **highest Upvotes**
   - Tie-breaker #1: **higher Views**
   - Tie-breaker #2: **random order** (stable per render is fine)

This is a **static frontend** dashboard. Only update frontend files (HTML/CSS/JS). Do not change Firebase schema for this task.

---

## Files to Inspect / Modify
- `analytics.html` (dashboard layout + metric rendering + table headings)
- Any dashboard JS embedded in `analytics.html` or included scripts
- `styles.css` (only if needed for spacing/alignment after removing a hero card)

---

## Part A — Remove AVG CONVERSION RATE Hero Metric
### Required UI change
- Remove the entire hero metric card that currently displays:
  - `AVG CONVERSION RATE`
- After removal:
  - The hero metrics row should display **only 3 cards**:
    - Total Visits Today
    - Project Views Today
    - Upvotes Today

### Required code change
- Remove all calculations and DOM updates related to `avgConversionRate`
- Remove any formatting helpers specific to conversion rate

### Layout requirement
- Ensure the hero cards still look good (no awkward gaps).
- If the CSS grid assumes 4 columns, update it to 3 columns (responsive friendly).

---

## Part B — Replace “Conversion Rate” with “Upvote Ratio”
### Required concept
We are redefining the leaderboard metric to show:

**Upvote Ratio = (project_upvotes / total_upvotes_across_all_projects)**

- Express it as a percentage with 1 decimal (e.g., `33.3%`)
- If total_upvotes_across_all_projects is 0:
  - ratio should be `0%` for all projects
  - avoid division by zero

### Required UI change
In the Project Leaderboard table:
- Change the column header from `CONVERSION RATE` to:
  - `UPVOTE RATIO` (preferred)
  - or `SHARE OF UPVOTES`

The explanatory text under “Project Leaderboard” should also be updated:
- Replace “Ranked by view-to-upvote conversion rate” with something like:
  - “Ranked by total upvotes (ties broken by views). Upvote Ratio shows share of all upvotes.”

---

## Part C — Change Leaderboard Ranking Logic
### Current behavior (likely)
- ranked by conversion rate (upvotes/views)

### New required ranking behavior
Sort projects by:
1) **upvotes** (descending)
2) **views** (descending)
3) **random** if both tied

### Random tie handling requirement
- The “random” selection can be implemented as:
  - `Math.random()` comparator when ties happen
  - OR a deterministic “random” per render using a seeded approach
- It is acceptable if the tie order changes when clicking “Refresh Data”.

---

## Part D — Data Sources / Calculations (No backend changes)
Assume your dashboard reads daily RTDB analytics in this shape (example):
- `project_views` object: `{ dungeon: 2, rocketship: 3 }`
- `upvotes` object: `{ dungeon: 2, rocketship: 2 }`

### Required per-project values
For each project, compute:
- `views = project_views[project] || 0`
- `upvotes = upvotes[project] || 0`
- `upvoteRatio = totalUpvotesAllProjects > 0 ? upvotes / totalUpvotesAllProjects : 0`

Projects set = union of keys from `project_views` and `upvotes`.

---

## Part E — Rendering Requirements
### Leaderboard row content
Each row must show:
- Rank (#1, #2, #3…)
- Project name (humanized if you already do this)
- Views (number)
- Upvotes (number)
- Upvote Ratio (percentage)

### Progress bar (if currently present)
If you currently render a bar next to the %:
- Keep it, but the bar now represents Upvote Ratio (share-of-upvotes), not conversion.

---

## Part F — Testing (Must do before finishing)
### Manual tests (local + deployed behavior)
1) Run local server:
   - `python -m http.server 8080`
2) Open `analytics.html` and confirm:
   - No “AVG CONVERSION RATE” card exists
   - Upvote Ratio column exists
3) Create controlled test data by interacting with site:
   - View Project A 2 times and upvote 2 times
   - View Project B 5 times and upvote 2 times
   Expected:
   - Both have upvotes=2, so tie-breaker chooses B first (views 5 > 2)
4) Create a tie on views + upvotes:
   - Make A and B have same upvotes and same views
   Expected:
   - The order can be random; verify it doesn’t crash and still renders.

### Regression checks
- Refresh Data still works
- Reset Today still works
- Chart rendering still works

---

## Deliverables
When complete, output:
1) List of files changed + what changed
2) Any updated functions (brief summary)
3) Confirmation tests passed

END