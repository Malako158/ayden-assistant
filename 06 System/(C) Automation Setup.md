# Automation Setup

Documents all persistent background jobs running for the Assistant project.

---

## Omi Organizer — Daily Schedule

Runs automatically via macOS **launchd** (survives restarts, always on).

| Job | Time | launchd Label |
|-----|------|---------------|
| Morning run | 6:00 AM daily | `com.ayden.omi-organizer-morning` |
| Evening run | 8:00 PM daily | `com.ayden.omi-organizer-evening` |

**Trigger script:** `06 System/omi-organizer-trigger.sh`
**Plist files:** `~/Library/LaunchAgents/com.ayden.omi-organizer-morning.plist` and `...-evening.plist`
**Logs:** `06 System/logs/launchd-morning.log` and `launchd-evening.log`

---

## Task Manager — Daily Schedule

Runs automatically via macOS **launchd** at 8:59 AM every day.

| Job | Time | launchd Label |
|-----|------|---------------|
| Daily task briefing | 6:00 AM daily | `com.ayden.task-manager` |

**Trigger script:** `06 System/task-manager-trigger.sh`
**Plist file:** `~/Library/LaunchAgents/com.ayden.task-manager.plist`
**Output:** `03 Task Manager/(C) Task Briefing — YYYY-MM-DD.md`
**Logs:** `06 System/logs/launchd-task-manager.log`

---

## Managing the Jobs

### Check status
```bash
launchctl list | grep omi
```

### Unload (pause) a job
```bash
launchctl unload ~/Library/LaunchAgents/com.ayden.omi-organizer-morning.plist
launchctl unload ~/Library/LaunchAgents/com.ayden.omi-organizer-evening.plist
```

### Reload after changes
```bash
launchctl unload ~/Library/LaunchAgents/com.ayden.omi-organizer-morning.plist
launchctl load ~/Library/LaunchAgents/com.ayden.omi-organizer-morning.plist
```

### Run manually right now
```bash
bash "/Users/aydenatkinson/Documents/Obsidian + Claude Files/Ayden AI Brain/03 Projects/Assistant/06 System/omi-organizer-trigger.sh"
```

---

## Notes

- launchd jobs only fire while the Mac is awake and logged in. If the Mac is asleep at 8:59 AM, the job fires when it wakes up next.
- Logs rotate daily — one file per day in `06 System/logs/`.
- The trigger script runs Claude CLI in `--print` mode (non-interactive, headless).
