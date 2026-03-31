---
name: remote-control
description: Start, stop, restart, or check status of the Claude remote-control LaunchAgent. Use when asked about remote control status, to fix offline remote control, or to manage the remote-control background service.
user-invocable: true
allowed-tools: Bash
---

Manage the Claude remote-control LaunchAgent service.

## Service Info
- **Label**: `com.anthropic.claude-remote-control`
- **Plist**: `~/Library/LaunchAgents/com.anthropic.claude-remote-control.plist`
- **Logs**: `/tmp/claude-remote-control.log`, `/tmp/claude-remote-control.err`

## Actions

Based on `$ARGUMENTS`, perform one of:

### `status` (default if no args)
1. Run: `launchctl print gui/$(id -u)/com.anthropic.claude-remote-control 2>&1 | grep -E "state|pid|active|last exit"`
2. Run: `ps aux | grep "claude remote-control" | grep -v grep | awk '{printf "PID: %s | Memory: %.0f MB\n", $2, $6/1024}'`
3. Run: `tail -5 /tmp/claude-remote-control.err 2>/dev/null`
4. Report status concisely

### `stop`
1. Run: `launchctl bootout gui/$(id -u)/com.anthropic.claude-remote-control`
2. Verify process is gone with `pgrep -f "claude remote-control"`
3. Confirm stopped

### `start`
1. Run: `launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.anthropic.claude-remote-control.plist`
2. Sleep 2 seconds, then verify running with `pgrep -f "claude remote-control"`
3. Confirm started

### `restart`
1. Stop then start using the steps above
2. Verify running and report new PID
