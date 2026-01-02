You are Codex running inside this repository.

## Objective
Create a **single file** named **`quiz.txt`** in the repo root that contains **~100 quiz questions** (90–110 acceptable) that progressively increase in difficulty, based **directly on this repo’s code** (not generic web dev trivia). Each question may or may not include a **small hint**. The quiz must cover the full end-to-end system: static site + Firebase RTDB + IP-based voting + custom analytics + dashboard. It should be chronological order (we did the html first, then css, than some js, then we did firebase, then we did the upvote feature, then we did analytics, etc...) Remember that at the end of the day I am non-technical and this is my first time learning these topics, so ensure that the questions are designed in a more simple manner appropriate for someone new to coding.

Do NOT modify any existing production code unless absolutely required to generate the quiz (it shouldn’t be). This task is documentation-only.

---

## Inputs / Repo Context (what to inspect)
Read these files (and any others referenced by them):
- `index.html`
- `analytics.html`
- `script.js`
- `/projects/*.html`
- `styles.css`

Also inspect how the code:
- Writes to RTDB via REST (`fetch(...firebaseio.com/...json)`)
- Tracks user IP (ipify)
- Stores state (localStorage)
- Tracks analytics events (daily nodes in RTDB)
- Computes dashboard metrics (hero metrics, 7-day trends, leaderboard)
- Handles edge cases (errors, caching, race conditions, toggling)

---

## Output Requirements: `quiz.txt`
`quiz.txt` must be plain text (or markdown, whatever looks better ultimately) and include:

### A) Header
At top, include:
- Title
- Date
- Short instructions on how to use it (e.g. “Answer without looking; use hints only if stuck”)
- Suggested pacing (e.g. 30–60 mins)

### B) 100 Questions, grouped by difficulty
Create 6 sections, each with 15–20 questions:
1) Fundamentals (static site, DOM, events)
2) Repo + routing + GitHub Pages URLs
3) Firebase RTDB REST usage (GET/PUT/DELETE, paths, JSON)
4) Voting system (schema, voters, toggle behavior, IP logic)
5) Analytics system (event semantics, net vs event counts, daily keys)
6) Dashboard logic (aggregations, conversion math, trends, leaderboards, pitfalls)

Each question must follow this exact template:

Q01) <question text>
(Optional) Hint: <short hint>

Notes:
- Number questions as Q01…Q100 (zero-padded).
- Each hint must be 1 line, short, and not give away the full answer.
- Questions must reference repo realities (function names, paths, behaviors) whenever possible.

### C) “Challenge” items inside later sections
Include at least:
- 10 “why” questions (design reasoning)
- 10 debugging questions (what would you check first, expected network responses)
- 5 security questions (what’s protected by rules vs client-side)
- 5 data integrity questions (race conditions, double-clicks, caching, idempotency)

### D) Answer Key file (optional but recommended)
Also create **`answer_key.txt`** (plain text) with brief answers (1–3 sentences each).
If you create it, do not include it inside `quiz.txt`. Keep separate.

---

## Content Guidance (must cover these concepts)
Your quiz must include questions on:
- Static hosting vs “backend services” (serverless)
- DOMContentLoaded purpose
- Event listeners used in this repo (click, beforeunload, resize, keydown)
- LocalStorage role + limitations
- RTDB REST patterns: GET current → compute → PUT updated
- Paths used for votes and analytics (exact strings found in code)
- IP sanitization constraints (Firebase key rules)
- Toggle vote correctness (net state vs event counts)
- Why net upvotes can diverge from upvote events and how code fixes it
- Dashboard aggregation math: sum children, avoid division by zero
- Data freshness / caching controls (`cache: "no-store"` if present)
- Race conditions with read-modify-write and what transactions would solve
- What Firebase Security Rules do vs what client code does
- Common failure modes: 401/403 rules blocked, null reads, network errors, ipify blocked
- GitHub Pages routing: index.html default, analytics path naming, folders vs .html

---

## Quality Bar
- Questions must be simple early and genuinely challenging by the end.
- Avoid generic fluff. Tie questions to the repo’s actual implementation.
- Ensure the quiz is readable, well spaced, and consistent formatting.

---

## Completion Checklist
Before finishing:
1) Ensure `quiz.txt` exists and contains ~100 numbered questions with hints.
2) Ensure questions reference actual code concepts from this repo.
3) (If created) Ensure `answer_key.txt` exists and aligns with question numbers.
4) Do NOT break the site—no production code changes.