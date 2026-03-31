## My Infrastructure

### Network Overview

Server VLAN: `172.20.30.0/24` on UDM Pro. All `*.otherealm.com` → Caddy (172.20.30.53).

| IP | Host | Role |
|----|------|------|
| 172.20.30.141 | nexus.otherealm.com / node: pve1 | Proxmox hypervisor — 16 cores, 32 GB RAM, RTX 2070 |
| 172.20.30.51 | VM 210 | **Ollama** (:11434) + **Apprentice Agent** (:8080) |
| 172.20.30.50 | CT 200 | Infisical (secrets) |
| 172.20.30.52 | CT 201 | API (reserved) |
| 172.20.30.53 | CT 203 | Caddy (reverse proxy + TLS) |
| 172.20.30.54 | CT 204 | Plane (project management) |
| 172.20.30.55 | CT 205 | Grafana + Loki (monitoring) |
| 172.20.30.56 | CT 206 | Supabase (PostgreSQL + pgvector) |
| 10.10.10.163 | IRIS (Pi 5) | MCP gateway edge node |

---

### Apprentice Agent

The Apprentice is an autonomous execution engine on VM 210 (172.20.30.51:8080). When Claude submits a plan, Apprentice runs it step-by-step — SSH commands, Proxmox API calls, file writes, HTTP requests. On failure it searches a vector knowledge base (Supabase + pgvector, embeddings via Ollama/mxbai-embed-large) before escalating back to Claude.

**What it can do in a single plan:**
- `ssh_command` → run shell commands on any host in the network
- `proxmox_api` → create/start/stop/snapshot VMs and containers
- `file_write` → write files to remote hosts over SSH
- `http_request` → call any internal service endpoint
- `verify` → health checks and assertions

**SSH access:** Apprentice has passwordless ed25519 keys to all containers and the Proxmox host.

**LLM stack:**
- `llama3.1:8b` — local reasoning model used for self-recovery and KB interpretation. Capable but limited compared to Claude — write plan step instructions and failure prompts to be explicit and unambiguous, not conversational.
- `mxbai-embed-large` — local embedding model (1024-dim) used to index and search the knowledge base.
- **No API keys on the agent.** Escalation works via MCP loop-back: the agent sets status to ESCALATED and blocks for up to 300s, waiting for Claude to call `apprentice_resolve_escalation` with a fix.

---

### Using the Apprentice (MCP Tools)

When I ask you to do anything on my infrastructure, use Apprentice — don't ask me to run commands manually.

**Plan authoring rules:**
- Always set `"on_failure": "search_kb"` on steps (the default). This enables the full recovery pipeline: retry → KB search → escalate to Claude via MCP. **Never use `"abort"` unless you intentionally want no recovery.**
- Use `"success_criteria": "exit_code == 0"` for commands where any exit code 0 means success. Use `"output contains 'text'"` only when you need to verify specific output.
- Avoid compound shell commands with `&&` — if any part fails, the whole step fails. Use separate steps instead.

**Workflow:**
1. Check `apprentice_get_status` — if cold, call `apprentice_warm_up` first
2. Query `apprentice_query_knowledge` for similar past work before writing a plan
3. Submit with `apprentice_execute_plan`
4. Poll with `apprentice_check_status` until complete — **watch for `"escalated"` status**
5. **If ESCALATED:** The agent is blocked waiting for YOU. Read the step error, determine the fix, then call `apprentice_resolve_escalation` with `fix` (the shell command to run) and `kb_summary` (a one-liner describing error + fix for the KB). The agent will resume, apply your fix, and continue.
6. Retrieve final result with `apprentice_get_result`

**Important:** The escalation loop is the core feedback mechanism. When a plan enters ESCALATED state, Claude is the LLM — there is no separate API call. You ARE the escalation target. Respond promptly via `apprentice_resolve_escalation` or the plan will timeout after 300s and fail.

---

### Other MCP Connectors

- **account1/2/3** → Google Workspace (Gmail, Calendar, Drive, Sheets) — 3 accounts
- **proxmox** → Proxmox API (VMs/LXCs) — use for read ops; Apprentice for changes
- **plane** → Self-hosted Plane (project management)
- **infisical-otherealm / infisical-keepstar** → Secrets (two orgs)
- **icloud** → iCloud Mail + Calendar
- **microsoft** → Outlook, OneDrive, Teams

**Prefer direct tools over asking me to do things manually.**
