---
name: migrate-linear-to-plane
description: |
  Migrate issues, milestones/modules, and comments from Linear to Plane.
  Use when the user says "/migrate-linear-to-plane", "sync linear to plane",
  "migration diff", "what's missing in plane", or any Linear-to-Plane migration task.
  Supports full migration, incremental sync, and diff reports.
allowed-tools: Read, Glob, Grep, Bash
---

# Linear → Plane Migration Skill

Migrate projects, issues, milestones (→ modules), labels, and comments from Linear to self-hosted Plane.

## Prerequisites

- Linear MCP connector connected (list_teams, list_issues, list_milestones, etc.)
- Plane API credentials in Infisical: `/plane` path in Example project, dev environment
  - `PLANE_API_KEY`
  - `PLANE_WORKSPACE_SLUG`
  - `PLANE_HOST_URL`
- Retrieve credentials: `mcp__infisical-example__list-secrets` with projectId `ab133b3e-b35b-474d-be58-8499dbe4fd53`, environmentSlug `dev`, secretPath `/plane`

## Concept Mapping

| Linear | Plane | Notes |
|--------|-------|-------|
| Team | Workspace | Plane workspace = `your-workspace` |
| Project | Project | 1:1 mapping |
| Milestone | Module | Plane calls them "modules", same concept |
| Issue | Issue | Title + description + state + priority + labels |
| Issue State | State | Backlog→backlog, Todo→unstarted, In Progress→started, In Review→started, Done→completed, Canceled→cancelled. **Linear "Duplicate" has no Plane equivalent — map to Cancelled** |
| Priority | Priority | Linear: 0=None,1=Urgent,2=High,3=Medium,4=Low → Plane: none,urgent,high,medium,low |
| Labels | Labels | Create at project level in Plane |
| Initiative | (none) | Plane has no initiative concept. Note in project description |
| Comments | Comments | Plane API: POST /projects/{id}/issues/{id}/comments/ |
| Cycles | Cycles | Optional — migrate if active |

## Workflow

### Step 1: Diff Report (always run first)

Produce a comparison showing what exists in each system:

1. **List Linear projects** via `list_projects`
2. **List Plane projects** via:
   ```
   curl -s -H "X-API-Key: $KEY" "$API/projects/"
   ```
3. **For each project**, compare:
   - Issue count (Linear vs Plane)
   - Milestone/module names
   - Missing projects
4. **For overlapping projects**, compare issue titles to find gaps:
   - Get all Linear issue titles (paginate with limit=250 + cursor)
   - Get all Plane issue titles (paginate with per_page=100)
   - Diff the title sets
5. **Output** the diff table showing gaps in both directions

### Step 2: Create Missing Projects

For each Linear project not in Plane:

```bash
curl -s -X POST -H "X-API-Key: $KEY" -H "Content-Type: application/json" \
  "$API/projects/" \
  -d '{
    "name": "<project_name>",
    "identifier": "<3-4 char identifier>",
    "description": "<project description from Linear>",
    "network": 2,
    "module_view": true,
    "cycle_view": false,
    "page_view": true
  }'
```

### Step 3: Create Missing Modules

For each Linear milestone not in Plane as a module:

```bash
curl -s -X POST -H "X-API-Key: $KEY" -H "Content-Type: application/json" \
  "$API/projects/$PROJECT_ID/modules/" \
  -d '{"name": "<milestone_name>", "status": "planned"}'
```

### Step 4: Get State IDs

Each Plane project has its own state IDs. Fetch them before creating issues:

```bash
curl -s -H "X-API-Key: $KEY" "$API/projects/$PROJECT_ID/states/"
```

Build a state map: `{state_name: state_id}` for Backlog, Todo, In Progress, Done, Cancelled.

### Step 5: Create Missing Issues

For each issue in Linear not in Plane:

1. Get full issue details from Linear (description, priority, status, labels, milestone)
2. Map status → Plane state ID
3. Map priority → Plane priority string
4. Create issue:

```bash
curl -s -X POST -H "X-API-Key: $KEY" -H "Content-Type: application/json" \
  "$API/projects/$PROJECT_ID/issues/" \
  -d '{
    "name": "<title>",
    "description_html": "<p><description></p><p><em>Migrated from Linear: KEE-XXX</em></p>",
    "state": "<state_id>",
    "priority": "<priority_string>"
  }'
```

5. Assign to module (if issue has a milestone):

```bash
curl -s -X POST -H "X-API-Key: $KEY" -H "Content-Type: application/json" \
  "$API/projects/$PROJECT_ID/modules/$MODULE_ID/module-issues/" \
  -d '{"issues": ["<issue_id>"]}'
```

### Step 6: Migrate Comments (if any)

For each issue with comments in Linear:

1. `list_comments` for the Linear issue
2. Create each comment in Plane:

```bash
curl -s -X POST -H "X-API-Key: $KEY" -H "Content-Type: application/json" \
  "$API/projects/$PROJECT_ID/issues/$ISSUE_ID/comments/" \
  -d '{"comment_html": "<p><comment_body></p><p><em>— <author> via Linear, <date></em></p>"}'
```

### Step 7: Verify

1. Re-run the diff report
2. Confirm issue counts match
3. Confirm all modules have correct issue assignments
4. Report any remaining gaps

## Batch Processing Pattern

For large migrations (50+ issues), use Python to batch API calls:

```python
import json, subprocess

API = "https://plane.example.com/api/v1/workspaces/your-workspace"
KEY = "plane_api_..."  # Always fetch fresh from Infisical

for issue in issues_to_create:
    payload = {
        "name": issue["title"],
        "description_html": f"<p>{issue['desc']}</p><p><em>Migrated from Linear: {issue['id']}</em></p>",
        "state": state_map[issue["status"]],
        "priority": priority_map[issue["priority"]],
    }
    result = subprocess.run(
        ["curl", "-s", "-X", "POST",
         "-H", f"X-API-Key: {KEY}",
         "-H", "Content-Type: application/json",
         f"{API}/projects/{PROJECT_ID}/issues/",
         "-d", json.dumps(payload)],
        capture_output=True, text=True, timeout=15
    )
    resp = json.loads(result.stdout)
    issue_id = resp.get("id")

    # Assign to module if milestone exists
    if issue.get("module_id") and issue_id:
        subprocess.run(
            ["curl", "-s", "-X", "POST",
             "-H", f"X-API-Key: {KEY}",
             "-H", "Content-Type: application/json",
             f"{API}/projects/{PROJECT_ID}/modules/{issue['module_id']}/module-issues/",
             "-d", json.dumps({"issues": [issue_id]})],
            capture_output=True, text=True, timeout=15
        )
```

## Important Notes

- Always fetch Plane API key from Infisical at runtime — never hardcode
- Plane module-issue assignment endpoint is `/module-issues/` (NOT `/issues/`)
- Plane uses `description_html` (HTML), not markdown — wrap in `<p>` tags
- Linear "Duplicate" state maps to Plane "Cancelled"
- Issues without a project in Linear are orphans — investigate before migrating
- Plane-only issues (not in Linear) are valid — they may have been created directly in Plane
- Always run diff report BEFORE and AFTER migration to verify
- Tag migrated issues with `Migrated from Linear: KEE-XXX` in description for traceability
