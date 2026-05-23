# Module 4 — Weekly Schedule Optimizer Setup & Status

## Current Status: ✅ Ready to Run

Schedule loaded from `00 Inputs/Weekly Schedule Template.md`. Module cross-references your ideal weekly structure against live Calendar, Email, and Tasks every time it runs.

---

## How to Run

Tell Claude: **"Run Module 4"** or **"Run the Weekly Optimizer"**

Claude will pull live data from Google Calendar, Gmail, and Notion, cross-reference against your ideal schedule, and produce the full optimizer output below.

---

## Schedule on File

Source: `[[00 Inputs/Weekly Schedule Template]]`

| Day | Type | Work Hours | Structure |
|-----|------|------------|-----------|
| Monday | Gym Day | 8h | 4h creation + 4h ops |
| Tuesday | Work Day | 8h | 5h deep work + 3h meetings/admin |
| Wednesday | Gym Day | 8h | 4h production + 4h hiring/biz dev |
| Thursday | Work Day | 8h | 5h strategy/outreach + 3h content review |
| Friday | Gym Day | 8h | 4h client delivery + 4h review/planning |
| Saturday | Off | 0h | Protected — no work |
| Sunday | Reset | 0–2h | Optional prep only |

**Key rules baked into the optimizer:**
- Block 1 (AM) = creation only. No meetings, no email, no comms.
- All calls → Block 2, Tue/Thu 1–3 PM preferred
- Gym locked: Mon / Wed / Fri 6:15 AM
- No meetings before noon
- Hard cutoff: 10 PM

---

## What This Module Produces

Each run generates a full week optimization output:

```
## Weekly Optimizer — Week of [Date]

### 📍 This Week at a Glance
[Summary of what's on the calendar vs. what the ideal schedule calls for]

---

### ⚠️ Conflicts & Gaps
- [Any calendar events that violate schedule rules — e.g., morning meetings, missing gym blocks]
- [Tasks with deadlines this week that aren't yet blocked in calendar]

---

### 🗓️ Optimized Week — Day by Day

**Monday**
| Time | Planned | Calendar Reality | Status |
|------|---------|-----------------|--------|
| 6:15 AM | Gym | [actual] | ✅ / ⚠️ |
| 8:30–12:30 | Deep Work Block 1 | [actual] | ✅ / ⚠️ |
| ...

[Repeat for Tue–Sun]

---

### 🎯 Top 3 Priorities This Week
Based on open tasks, email urgency, deadlines, and schedule capacity:
1. [Priority 1 — which day/block to do it]
2. [Priority 2 — which day/block to do it]
3. [Priority 3 — which day/block to do it]

---

### 📦 What to Move / Reschedule
- [Item] — currently blocking Block 1, should move to [Block 2 / Thu / Fri]

---

### 💡 Optimization Recommendation
[One sharp recommendation for this specific week]
```

---

## TODO

- [x] Weekly schedule loaded into `00 Inputs/Weekly Schedule Template.md`
- [ ] Run first optimizer and review output
- [ ] Adjust schedule template as your routine evolves
