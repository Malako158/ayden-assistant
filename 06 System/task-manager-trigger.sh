#!/bin/bash
# Task Manager — Daily Trigger Script
# Runs Module 4 via Claude CLI
# Scheduled via launchd at 8:59 AM daily

VAULT="/Users/aydenatkinson/Documents/Obsidian + Claude Files/Ayden AI Brain"
LOG_DIR="$VAULT/03 Projects/Assistant/07 System/logs"
LOG_FILE="$LOG_DIR/task-manager-$(date +%Y-%m-%d).log"

mkdir -p "$LOG_DIR"

echo "=== Task Manager triggered at $(date) ===" >> "$LOG_FILE"

cd "$VAULT" && /Users/aydenatkinson/.local/bin/claude \
  --print \
  --dangerously-skip-permissions \
  "Run Module 4 — Task Manager. Follow the instructions in 03 Projects/Assistant/08 Skills/task-manager.md exactly — pull all open tasks from Notion, cross-reference with today's calendar, recent emails, and past Claude conversations (recent prior briefings and iteration logs), apply priority scoring, and save the output to 03 Projects/Assistant/04 Task Manager/(C) Task Briefing — $(date +%Y-%m-%d).md" \
  >> "$LOG_FILE" 2>&1

echo "=== Completed at $(date) ===" >> "$LOG_FILE"
