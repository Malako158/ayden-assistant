# Assistant

A recurring daily AI-powered briefing that pulls from Gmail and Google Calendar, then surfaces everything into a single interactive dashboard. You open it once and know exactly what your day looks like and what needs action. Four modules — Email Triage, Calendar, Task Manager, and Weekly Schedule Optimizer — compile into one clean, scrollable UI with priority indicators, suggested replies, and task tracking.

## Claude's Role

Build, maintain, and improve this system. That means writing the automation logic, connecting the integrations, generating the daily briefing content, and keeping the dashboard sharp. Claude is the engine behind every module — pulling data, classifying it, summarizing it, and presenting it in a way that requires zero follow-up.

**Prime directive:** If a session is drifting without moving toward a working, auto-running dashboard, nudge back: "Are we building the system or planning it? Let's ship the next working module."

## Process

1. **Trigger** — System runs automatically on a daily schedule (morning)
2. **Module 1 — Email Triage** — Pull all unread Gmail. Classify important vs. not. Surface highlights + one-line summaries for important ones. Flag urgent replies. Generate suggested replies in Ayden's voice.
3. **Module 2 — Calendar** — Surface today's full schedule. Flag anything that should be added (email approvals, verbal agreements). Generate daily to-do summary. Every Monday: generate a full weekly report with priorities.
4. **Module 3 — Task Manager** — Pull all tasks + completion status. Cross-reference with calendar, emails, and past Claude conversations. Highlight the single most important task today based on goals, business priorities, urgency, and dependencies. Surface today vs. can-wait. Flag overdue/at-risk.
5. **Module 4 — Weekly Schedule Optimizer** — Cross-reference Ayden's standard weekly schedule against the live calendar. Flag what should be happening right now, what to prioritize, what to move, and productivity recommendations.
6. **Compile → Dashboard** — All four modules render into a single scrollable UI with clear sections, visual priority indicators (Urgent / FYI / Action Needed), inline suggested replies, and one-tap task completion marking.

## Key People

Solo project — Ayden only.

## Folder Structure

- `00 Inputs/` — Raw data drops, schedule templates, anything fed into the system
- `01 Email Triage/` — Email module logic, prompts, output samples
- `02 Calendar/` — Calendar module logic, weekly report templates
- `03 Task Manager/` — Task module logic, cross-reference rules, priority framework
- `04 Weekly Optimizer/` — Schedule template + optimizer logic
- `05 Dashboard Output/` — Dashboard design, UI components, compiled briefing outputs
- `06 System/` — Automation scripts, config, integration setup, cron/trigger logic
- `07 Skills/` — Reusable skill markdown files for this project
- `08 Attachments/` — Screenshots, mockups, diagrams
- `09 Iteration Logs/` — Notes on what to improve after each run

## Rules & Conventions

- **`(C)` prefix** — Files created by Claude are prefixed with `(C)` so it's clear they're AI-generated.
- **Editing rule** — Before editing any file without the `(C)` prefix, ask for permission first.
- **Skills** — All reusable scripts/automations are saved as markdown files in `08 Skills/`, NOT as Claude Code skills.
- **Module-first thinking** — Build one module at a time, get it working, then move to the next. Don't design the whole system before anything runs.
- **Voice** — Any suggested replies generated for email must match Ayden's voice: direct, concise, no fluff.

## Current Status

> **Last updated:** 2026-05-21
> **Status:** Active — All 4 modules live.

| Module | Status | Blocker |
|--------|--------|---------|
| 1 — Email Triage | ✅ Live | — |
| 2 — Calendar | ✅ Live | — |
| 3 — Task Manager | ✅ Live | — |
| 4 — Weekly Optimizer | ✅ Live | — |
