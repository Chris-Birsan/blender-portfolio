Task: Update the Analytics Dashboard "Project Leaderboard" styling ONLY.

Goal:
- Highlight the entire table row for ranks 1–3:
  - Rank #1 row: GOLD background (first place)
  - Rank #2 row: SILVER background (second place)
  - Rank #3 row: BRONZE background (third place)
- Add a black border around the Rank text (“#1”, “#2”, “#3”) so it pops out on those highlighted rows.
- Do not change any ranking logic, data calculations, labels, or other UI elements.

Implementation requirements:
1) Locate where the Project Leaderboard rows are rendered (likely in analytics.html inline script or a JS file).
2) When rendering each row, add a class to the <tr> based on rank:
   - rank-1, rank-2, rank-3
3) Wrap the rank display in a span like:
   <span class="rank-badge">#1</span>
   Only necessary for the rank cell.
4) Add CSS rules (in styles.css if dashboard uses it, otherwise in analytics.html <style> or existing CSS section) that:
   - Apply full-row background colors for tr.rank-1 / tr.rank-2 / tr.rank-3
   - Add a black border around .rank-badge for ranks 1–3
   - Ensure text remains readable (adjust font-weight if needed but keep layout identical)
5) Keep everything else the same.

Acceptance:
- Rows #1–#3 are clearly highlighted across the full width of the row.
- Rank badge has a visible black border and stands out.
- No other rows are affected.
- No other styling or functionality changes.

After changes:
- List the files you modified and what you changed.