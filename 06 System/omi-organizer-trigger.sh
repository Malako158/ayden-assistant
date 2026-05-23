#!/bin/bash
# Omi Organizer — Daily Trigger Script
# Runs the Omi Organizer skill via Claude CLI
# Scheduled via launchd at 8:59 AM and 8:00 PM daily

VAULT="/Users/aydenatkinson/Documents/Obsidian + Claude Files/Ayden AI Brain"
LOG_DIR="$VAULT/03 Projects/Assistant/07 System/logs"
LOG_FILE="$LOG_DIR/omi-organizer-$(date +%Y-%m-%d).log"

mkdir -p "$LOG_DIR"

echo "=== Omi Organizer triggered at $(date) ===" >> "$LOG_FILE"

cd "$VAULT" && /Users/aydenatkinson/.local/bin/claude \
  --print \
  --dangerously-skip-permissions \
  "Run the Omi Organizer skill. Follow the instructions in 05 Skills/omi-organizer.md exactly — scan Omi Collection for unprocessed dates, route content to Omi Memory topic files, update project files if needed, mark dates as processed, and print the summary output." \
  >> "$LOG_FILE" 2>&1

echo "=== Completed at $(date) ===" >> "$LOG_FILE"
