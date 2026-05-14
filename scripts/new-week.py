#!/usr/bin/env python3
"""
new-week.py — Generate a new week JSON from the previous week

Usage:
  python3 scripts/new-week.py W21
  python3 scripts/new-week.py W21 --from W20      # explicit source

What it does:
  1. Reads the previous week's JSON
  2. Carries forward all projects with status != "completed"
  3. Resets action item statuses (pending) — preserves context
  4. Copies risks that are still open
  5. Clears milestones (fresh each week)
  6. Sets _savedAt and weekLabel/weekStart for the new week
  7. Writes backend/data/weeks/WNN.json

Output must still be reviewed and edited before use:
  - Update project progress and descriptions
  - Add new projects
  - Remove resolved risks
  - Add new action items
"""

import json
import sys
import os
import argparse
import re
from datetime import datetime, timedelta, timezone

BASE = os.path.join(os.path.dirname(__file__), "..", "backend", "data", "weeks")


def iso_now():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")


def week_num(label):
    m = re.match(r"W(\d+)", label)
    return int(m.group(1)) if m else None


def week_start_for(label):
    """
    Approximate weekStart (Monday) for a given label.
    Uses W01 = 2026-01-05 as anchor (first Monday of 2026).
    """
    num = week_num(label)
    if num is None:
        return None
    anchor = datetime(2026, 1, 5)
    delta = timedelta(weeks=(num - 1))
    return (anchor + delta).strftime("%Y-%m-%d")


def load(path):
    with open(path) as f:
        return json.load(f)


def find_prev_label(new_label):
    num = week_num(new_label)
    if num is None:
        return None
    return f"W{num - 1}"


def main():
    parser = argparse.ArgumentParser(description="Generate new week JSON from previous week")
    parser.add_argument("week", help="New week label (e.g. W21)")
    parser.add_argument("--from", dest="source", default=None, help="Source week (default: Wprev)")
    parser.add_argument("--force", action="store_true", help="Overwrite if file exists")
    args = parser.parse_args()

    new_label = args.week.upper()
    src_label = args.source.upper() if args.source else find_prev_label(new_label)

    if not src_label:
        print(f"❌ Cannot determine source week for {new_label}")
        sys.exit(1)

    src_path = os.path.join(BASE, f"{src_label}.json")
    dst_path = os.path.join(BASE, f"{new_label}.json")

    if not os.path.isfile(src_path):
        print(f"❌ Source file not found: {src_path}")
        sys.exit(1)

    if os.path.isfile(dst_path) and not args.force:
        print(f"❌ {dst_path} already exists. Use --force to overwrite.")
        sys.exit(1)

    src = load(src_path)
    now = iso_now()
    new_week_start = week_start_for(new_label) or ""

    # ── Projects: carry forward non-completed ─────────────────────

    carried_projects = []
    skipped = []
    for p in src.get("projects", []):
        if p.get("status") == "completed":
            skipped.append(p.get("name", p.get("id", "?")))
            continue
        proj = dict(p)
        proj["weekStart"] = new_week_start
        proj["_updatedAt"] = now
        carried_projects.append(proj)

    # ── Actions: carry forward open items, reset to pending ───────

    carried_actions = []
    for a in src.get("actions", []):
        if a.get("status") == "done":
            continue
        action = dict(a)
        action["weekStart"] = new_week_start
        action["status"] = "pending"
        action["_updatedAt"] = now
        carried_actions.append(action)

    # ── Risks: carry forward open risks ───────────────────────────

    carried_risks = []
    for r in src.get("risks", []):
        if r.get("status") in ("resolved", "closed"):
            continue
        risk = dict(r)
        risk["_updatedAt"] = now
        carried_risks.append(risk)

    # ── Snapshots: copy historical array ──────────────────────────

    snapshots = list(src.get("snapshots", []))

    # ── Build new week object ──────────────────────────────────────

    new_week = {
        "weekLabel": new_label,
        "weekStart": new_week_start,
        "_savedAt": now,
        "_version": new_label,
        "_dataVersion": (src.get("_dataVersion") or week_num(src_label) or 0) + 1,
        "_exportedAt": now,
        "projects": carried_projects,
        "actions": carried_actions,
        "risks": carried_risks,
        "milestones": [],
        "snapshots": snapshots,
        "drafts": src.get("drafts", []),
        "members": src.get("members", []),
        "_resources": src.get("_resources", []),
        "_resourceCharges": src.get("_resourceCharges", []),
    }

    with open(dst_path, "w") as f:
        json.dump(new_week, f, ensure_ascii=False, indent=2)

    print(f"✅ Created {dst_path}")
    print(f"   Source: {src_label} → {new_label}")
    print(f"   Carried projects: {len(carried_projects)}  (skipped completed: {len(skipped)})")
    if skipped:
        for s in skipped:
            print(f"     ↳ completed: {s[:40]}")
    print(f"   Carried actions: {len(carried_actions)}  (open/in-progress only)")
    print(f"   Carried risks: {len(carried_risks)}")
    print()
    print("Next steps:")
    print("  1. Review projects — update progress, descriptions, add new ones")
    print("  2. Add new action items")
    print("  3. Review/remove resolved risks, add new ones")
    print("  4. Add new snapshot entry for this week")
    print(f"  5. Run: python3 scripts/validate-week.py {new_label}")


if __name__ == "__main__":
    main()
