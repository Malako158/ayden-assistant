# (C) Module 4 — Weekly Optimizer Run Logic

This file defines exactly what Claude does when "Run Module 4" or "Run the Weekly Optimizer" is called.

---

## Step 1 — Pull Live Data

Run all three in parallel:

1. **Google Calendar** — Pull all events for the current week (Mon–Sun). Note: day, time, duration, title.
2. **Gmail** — Check for any emails that imply calendar blocks needed (approvals, verbal commitments, scheduled calls mentioned in threads).
3. **Notion** — Pull all open tasks with due dates this week. Note: task name, due date, priority, status.

---

## Step 2 — Load Ideal Schedule

Reference: `[[00 Inputs/Weekly Schedule Template]]`

The ideal schedule is:

| Day | Gym | Block 1 | Lunch | Block 2 | Personal | Cutoff |
|-----|-----|---------|-------|---------|----------|--------|
| Mon | 6:15–7:45 AM | 8:30–12:30 | 12:30–1:15 | 1:15–5:15 | 5:15 PM+ | 10 PM |
| Tue | — | 7:00–12:00 | 12:00–1:00 | 1:00–4:00 | 4:00 PM+ | 10 PM |
| Wed | 6:15–7:45 AM | 8:30–12:30 | 12:30–1:15 | 1:15–5:15 | 5:15 PM+ | 10 PM |
| Thu | — | 7:00–12:00 | 12:00–1:00 | 1:00–4:00 | 4:00 PM+ | 10 PM |
| Fri | 6:15–7:45 AM | 8:30–12:30 | 12:30–1:15 | 1:15–5:15 | 5:15 PM+ | — |
| Sat | — | OFF | — | — | All day | — |
| Sun | — | Optional prep 4–6 PM only | — | — | All day | 10 PM |

**Block assignments by day:**
- **Mon Block 1:** Editing, production, creative output
- **Mon Block 2:** Ops, outreach, client comms, Notion
- **Tue Block 1:** Biggest task of the week
- **Tue Block 2:** Meetings, client comms, admin · GTA calls + interviews 1–3 PM
- **Wed Block 1:** Video editing, production pipeline
- **Wed Block 2:** ALVION prep, hiring, business dev
- **Thu Block 1:** Proposals, outreach, strategy
- **Thu Block 2:** Content review, editor management · GTA calls + interviews 1–3 PM
- **Fri Block 1:** Weekly client deliveries, wrap-up
- **Fri Block 2:** Week review + Monday planning

---

## Step 3 — Cross-Reference & Flag Issues

For each day, compare actual calendar against the ideal schedule. Flag:

- **🚨 Rule violation** — Meeting scheduled in Block 1 (before noon). Must be moved.
- **⚠️ Missing gym** — Mon/Wed/Fri: no gym block visible. Flag it.
- **📌 Unblocked task** — High-priority Notion task due this week with no calendar time blocked.
- **📧 Email action needed** — Email contains a commitment, approval, or deadline that implies a calendar block.
- **📦 Low-priority conflict** — Something is eating Block 1 or Block 2 time that should move to later in the week.

---

## Step 4 — Build Optimized Week

Produce the full week day-by-day, showing:
- What the ideal schedule says
- What's actually on the calendar
- Any deltas or recommended moves
- Which Notion tasks slot into which blocks on which days

Slot tasks into blocks based on their nature:
- **Creation work (new content, builds, writing)** → Block 1 on any day
- **Ops, admin, comms, reviews** → Block 2
- **Calls and meetings** → Block 2, Tue/Thu 1–3 PM preferred
- **Strategy, outreach, proposals** → Thu Block 1
- **Editor briefs/reviews** → End of Block 2 (4–5 PM). Send at end of day, review next morning Block 1.

---

## Step 5 — Surface Top 3 Priorities

Cross-reference:
1. Tasks due soonest with highest Notion priority
2. Emails flagged as urgent or awaiting reply
3. Business goals (current focus: client delivery quality + lead engine)

Output exactly 3 priorities with the specific day and block they should happen in.

---

## Step 6 — Compile Output

Write the output to: `05 Dashboard Output/` as part of the daily dashboard, or as a standalone `(C) Week of [DATE] — Optimizer.md` file in `04 Weekly Optimizer/`.

Output format:

```
## 📅 Weekly Optimizer — Week of [Mon Date] – [Fri Date]

### This Week at a Glance
[2–3 sentence summary: calendar density, key conflicts, main focus]

---

### ⚠️ Conflicts & Flags
- [Flag 1]
- [Flag 2]

---

### 🗓️ Optimized Schedule

**Monday — Gym Day**
- 6:15 AM: Gym ✅
- 8:30–12:30: [Recommended Block 1 work based on tasks]
- 1:15–5:15: [Recommended Block 2 work + any calls]
- [Any calendar conflicts noted]

[Repeat for each day]

---

### 🎯 Top 3 Priorities This Week
1. **[Task/goal]** → [Day], [Block] — because [brief reason]
2. **[Task/goal]** → [Day], [Block] — because [brief reason]
3. **[Task/goal]** → [Day], [Block] — because [brief reason]

---

### 📦 Move These
- [Item] — currently [where/when], move to [better slot] because [reason]

---

### 💡 This Week's Recommendation
[One specific, actionable recommendation for this particular week]
```

---

## Rules Claude Must Enforce

1. Never recommend a meeting or call in Block 1 (before noon on any weekday)
2. Always flag missing gym on Mon/Wed/Fri
3. Tue/Thu are the high-capacity days (5h Block 1) — heaviest cognitive tasks go here
4. Friday Block 2 always includes week review + Monday planning — don't override this
5. Never suggest work on Saturday
6. Sunday prep is optional and capped at 2h — never schedule more
7. Editor comms always go to end of Block 2 (4–5 PM) not Block 1
8. ALVION and networking are lowest priority — only appear in late Block 2 if slots exist
