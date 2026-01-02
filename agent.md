# agent.md — FIX: Upvote/Unvote Analytics Mismatch (Dashboard Showing 800% Conversion)
Version: v1.0  
Date: 2026-01-02  
Owner: Christopher  
Project: blender-portfolio (static frontend + Firebase RTDB backend)

---

## 0) Problem Statement (Must Fix)
### Observed
Playwright test shows:
- Votes toggled correctly (count returns to 0 after unvote)
- **Analytics dashboard shows Upvotes = 8** after repeated toggle actions
- Conversion rate becomes **800%** (impossible)

### Root Cause
Your custom analytics currently:
- **increments `/analytics/.../upvotes/{project}` on every upvote**
- **does not decrement or counteract on unvote**

So if a user toggles vote ON/OFF 10 times:
- vote count ends at 0 ✅
- analytics `upvotes` ends at 10 ❌
- dashboard sums upvotes and reports inflated conversion ❌

---

## 1) Required Outcome (Definition of Done)
After this fix:
1) If user toggles ON then OFF repeatedly, the dashboard **Upvotes Today** must reflect the **net current upvotes** (NOT historical upvote events).
2) Conversion Rate must never exceed 100% in normal use (unless you intentionally define it differently).
3) The analytics system must remain robust to rapid toggling and not go negative.

---

## 2) Decide the Correct Metric Semantics (Important)
There are two legitimate ways to track “upvotes”:

### Option A (Recommended): Track both EVENT COUNTS + NET UPVOTES
- `upvote_events` = how many times users clicked upvote (historical)
- `unvote_events` = how many times users clicked unvote (historical)
- `upvotes` = **net** upvotes today (current state total deltas)

This is the best PM-style design:
- You can show engagement (events) AND the current “net” metric on the dashboard
- You can explain the difference in your portfolio

### Option B (Simpler): Decrement `upvotes` on unvote
- `upvotes` is treated as net
- unvote subtracts 1 from `upvotes`

This is acceptable, but you lose “how many times did people toggle” insights.

✅ **Implement Option A** (Recommended).  
If you want minimal changes, Option B is fallback — but still must fix dashboard.

---

## 3) Data Model (RTDB Schema)
We will keep the existing daily structure and add event counters.

For a given date `YYYY-MM-DD`, store:

analytics/events/{YYYY-MM-DD}/
total_visits: number
project_views/{project}: number
upvotes/{project}: number // NET upvotes (delta-based)
upvote_events/{project}: number // NEW (counts +1 for every upvote click)
unvote_events/{project}: number // NEW (counts +1 for every unvote click)

yaml
Copy code

### Interpretation
- `upvotes/{project}` = net delta (upvote +1, unvote -1) clamped at >= 0
- Dashboard “Upvotes Today” = sum of `upvotes/*` (net)
- Dashboard may optionally display event totals in a secondary section later

---

## 4) Required Code Changes (script.js)
### 4.1 Add a generic counter increment helper that supports negative deltas
Create a helper function:

**Function:** `incrementCounter(path, delta = 1, clampMinZero = true)`

Requirements:
- Reads current number from `${FIREBASE_URL}/${path}.json`
- Writes back `current + delta`
- If `clampMinZero === true`, clamp final value: `Math.max(0, current + delta)`
- Returns the final value
- Logs warning on failure:
  - `console.warn("Analytics counter update failed", { path, delta, status })`
- Never throws uncaught errors (analytics must not break app)

### 4.2 Update analytics logging calls in vote toggle flow
In your upvote button click handler:

#### When user toggles vote ON
Must do BOTH:
1) Increment NET upvotes:
   - `incrementCounter(analytics/events/{today}/upvotes/{project}, +1)`
2) Increment EVENT counter:
   - `incrementCounter(analytics/events/{today}/upvote_events/{project}, +1)`

#### When user toggles vote OFF
Must do BOTH:
1) Decrement NET upvotes:
   - `incrementCounter(analytics/events/{today}/upvotes/{project}, -1)` (clamped to 0)
2) Increment EVENT counter:
   - `incrementCounter(analytics/events/{today}/unvote_events/{project}, +1)`

### 4.3 Remove any old analytics function that only increments upvotes
If you currently have something like:
`logCustomAnalyticsEvent('upvotes', project)` that always adds +1,
either:
- modify it to accept `delta`, OR
- stop using it for upvotes and use `incrementCounter` directly

---

## 5) Required Code Changes (analytics.html dashboard)
### 5.1 Dashboard must display NET upvotes, not event count
Hero metrics:
- Total visits = `total_visits`
- Project views = sum(project_views/*)
- Upvotes = sum(upvotes/*)  ✅ NET
- Conversion rate = `upvotesTotal / max(1, projectViewsTotal)`

### 5.2 Do NOT include upvote_events or unvote_events in the hero metric
Those are separate and optional.

---

## 6) Firebase RTDB Rules Update
If your RTDB rules validate analytics numeric counters, ensure these new nodes are allowed:

Add validation rules under:
- `analytics/events/$day/upvote_events/$project`
- `analytics/events/$day/unvote_events/$project`

Example rule snippets (merge into your existing analytics rules):
```json
"upvote_events": {
  "$project": { ".validate": "newData.isNumber() && newData.val() >= 0" }
},
"unvote_events": {
  "$project": { ".validate": "newData.isNumber() && newData.val() >= 0" }
}
7) Testing Plan (Must Run)
7.1 Manual Smoke Test
Start server: python -m http.server 8080

Go to homepage

Toggle a project upvote ON then OFF 10 times

Open Firebase RTDB and verify for today:

votes/{project}/count returns 0 ✅

analytics/events/{today}/upvotes/{project} returns 0 ✅

analytics/events/{today}/upvote_events/{project} returns 10 ✅

analytics/events/{today}/unvote_events/{project} returns 10 ✅

Open analytics.html dashboard:

Upvotes Today must be 0 ✅

Conversion rate must be <= 100% ✅ (unless project views is 0, then conversion should display 0%)

7.2 Automated Playwright Regression
Update your Playwright smoke test to assert:

Upvotes Today equals the NET expected value

Conversion rate does not exceed 100% after repeated toggles

8) Acceptance Criteria (Must Pass)
✅ Repeated toggle ON/OFF does not inflate “Upvotes Today”

✅ Dashboard conversion rate stays realistic (<= 100%)

✅ Net upvotes never goes negative

✅ Existing vote count UI still works and persists

✅ No unrelated functionality broken (hamburger, lightbox, etc.)

9) Implementation Checklist (Codex Step Order)
Locate vote toggle handler in script.js

Add incrementCounter(path, delta) helper

Implement net upvote increment on vote ON

Implement net upvote decrement on vote OFF

Add event counters (upvote_events/unvote_events)

Update analytics.html to use NET upvotes only

Update RTDB rules to allow new counters

Run tests (manual + Playwright)

10) Notes / Guardrails
This is a static frontend with Firebase RTDB as backend.

Use RTDB REST (fetch(...firebaseio.com/...json)) consistent with current code.

Analytics must never block voting; failures should warn but not crash.