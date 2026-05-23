# (C) Notion Task Database — Config

Connected and verified. Use these references any time a module needs to pull tasks.

---

## Database

- **Name:** Tasks
- **URL:** https://www.notion.so/2f55b015d19d81949010e776c2480c18
- **Data Source:** `collection://2f55b015-d19d-8196-b261-000b599b76a4`

---

## Schema

| Property | Type | Values |
|----------|------|--------|
| Name | Title | Task name |
| Status | Status | Inbox · To-Do · Doing · Waiting · Done |
| Priority | Status | High · Medium · Low |
| Due Date | Date | Single date or range |
| Tag | Select | Home · Personal · Business · Work · Project · Events · Research · Study · Health · Finance · Fitness · Shopping · Travel · Family · Learning |
| Notes | Text | Free text |
| Recurring | Formula | Computed — read only |
| Next Due Date | Formula | Computed — read only |
| Past Due Date | Formula | Computed — read only |

---

## How to Query

When pulling tasks for any module, use the Notion MCP with the data source URL above.

**Active tasks (not done):**
Filter: `Status != "Done"` · Sort by: Due Date ascending, then Priority

**Urgent / overdue:**
Filter: `Status != "Done"` AND `Due Date < today`

**This week:**
Filter: `Status != "Done"` AND `Due Date >= Monday` AND `Due Date <= Sunday`

**High priority:**
Filter: `Priority = "High"` AND `Status != "Done"`

---

## Status Groups

| Group | Statuses | Meaning |
|-------|----------|---------|
| To-do | Inbox, To-Do | Not started |
| In progress | Doing, Waiting | Active or blocked |
| Complete | Done | Finished — ignore in briefings |
