# CODEX MASTER SPEC — Blender Portfolio: Firebase Custom Analytics Dashboard + CRITICAL Upvote Toggle Fix
Version: v2 (detailed implementation spec)
Last updated: 2026-01-02
Owner: Christopher
Repo: blender-portfolio (static site served locally + deployed)
Firebase: Realtime Database (RTDB) + Firebase Analytics (GA4)

---

## 0) TL;DR (What Codex must deliver)
Codex must implement **two deliverables**:

### Deliverable A — CRITICAL Bug Fix: Upvote Toggle (must be correct)
- Replace the current IP “ever voted” approach (`/votedIPs/...`) with a true toggle design (voted true/false).
- Update RTDB schema + rules + frontend logic so a user can:
  - Upvote
  - Unvote
  - Upvote again
  - Refresh and still see correct state
- Remove all “Already voted!” dead-end behavior.

### Deliverable B — Custom Analytics Dashboard (real-time + working)
- Your GA4 realtime is already working, but custom dashboard is all zeros because custom analytics writes to RTDB are blocked by current rules.
- Update RTDB rules to allow writes to `/analytics/...`.
- Ensure your custom tracking writes to RTDB succeed (HTTP 200 OK).
- Ensure `analytics.html` reads the correct paths and renders non-zero totals, trend chart, and leaderboard.

---

## 1) Current Evidence / Observations (What we know)
1) Firebase Analytics (GA4) SDK is installed and receiving events (screenshot shows `page_view`, etc.).  
2) RTDB rules currently allow:
   - `.read: true`
   - writes to `/votes/$project` (numeric only, constrained)
   - writes to `/votedIPs/$project/$ip` **only if it doesn’t exist** (write-once)
3) Your custom analytics code writes to:
   - `/analytics/events/{YYYY-MM-DD}/total_visits`
   - `/analytics/events/{YYYY-MM-DD}/project_views/{project}`
   - `/analytics/events/{YYYY-MM-DD}/upvotes/{project}`
   These writes are likely failing due to missing rules, and your code catches and continues → dashboard shows zeros.

---

## 2) Non-negotiable Requirements
Codex must:
- Preserve existing UI/UX (hamburger menu, lightbox, etc.)—do not break unrelated features.
- Implement the toggle vote bugfix exactly (no delete-based hacks blocked by rules).
- Make analytics writes succeed with proper RTDB rules.
- Ensure analytics dashboard shows real data after you browse pages + vote.

---

## 3) Files & Where to make changes (expected)
> Adjust filenames if your repo differs, but follow this structure.

- `script.js` (main site JS: menu + voting + analytics + lightbox)
- `analytics.html` (custom dashboard page)
- (Optional but recommended) `analytics-dashboard.js` (move dashboard logic out of HTML)
- Firebase RTDB Rules (in Firebase Console → Realtime Database → Rules)

---

## 4) CRITICAL BUGFIX — Upvote Toggle Design

### 4.1 Problem with current approach
Current logic uses:
- `/votes/{project} = number`
- `/votedIPs/{project}/{ip} = true` with rules preventing any modification after first write

This creates a UX dead-end:
- You can’t genuinely “toggle off” because the server-side record is permanent and/or delete is blocked by rules.
- “Already voted!” appears and the UI can desync from server.

### 4.2 Required new RTDB schema for votes
Replace old votes schema with this nested structure:

```json
votes: {
  dungeon: {
    count: 5,
    voters: {
      "192_168_1_1": true,
      "203_0_113_10": false
    }
  }
}