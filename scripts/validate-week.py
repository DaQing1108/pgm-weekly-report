#!/usr/bin/env python3
"""
validate-week.py — PGM Weekly Report JSON Validator

Usage:
  python3 scripts/validate-week.py [WEEK...]         # validate specific weeks
  python3 scripts/validate-week.py --all             # validate all weeks
  python3 scripts/validate-week.py --all --fix       # auto-fix safe issues
  python3 scripts/validate-week.py W20 --fix         # fix specific week

Exit codes:
  0 = all pass (or only warnings)
  1 = errors found (blocking issues)
"""

import json
import re
import sys
import os
import glob
import argparse
from datetime import datetime, timezone

BASE = os.path.join(os.path.dirname(__file__), "..", "backend", "data", "weeks")
VALID_STATUSES = {"on-track", "at-risk", "behind", "completed"}
VALID_CATEGORIES = {"technical", "business", "resource"}


def load(path):
    with open(path) as f:
        return json.load(f)


def save(path, data):
    with open(path, "w") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"  [FIXED] Saved {os.path.basename(path)}")


def validate_week(path, fix=False):
    fname = os.path.basename(path)
    label = fname.replace(".json", "")
    errors = []
    warnings = []
    fixed = []

    try:
        data = load(path)
    except Exception as e:
        return [f"{label}: ❌ JSON parse error: {e}"], [], []

    # ── Root fields ───────────────────────────────────────────────

    if not data.get("_savedAt"):
        if fix:
            now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")
            data["_savedAt"] = now
            fixed.append(f"_savedAt set to {now}")
        else:
            errors.append("missing _savedAt at root")

    if "_dataVersion" not in data:
        if fix:
            wnum = int(re.sub(r"\D", "", label) or "0")
            data["_dataVersion"] = wnum
            fixed.append(f"_dataVersion set to {wnum}")
        else:
            warnings.append("missing _dataVersion at root")

    if not data.get("weekStart"):
        warnings.append("missing weekStart at root")

    if not data.get("weekLabel"):
        if fix:
            data["weekLabel"] = label
            fixed.append(f"weekLabel set to {label}")
        else:
            warnings.append("missing weekLabel at root")

    # ── Projects ──────────────────────────────────────────────────

    projects = data.get("projects", [])
    if not projects:
        warnings.append("no projects found")

    for p in projects:
        pid = p.get("id", "?")
        name = p.get("name", "")[:25]

        if p.get("status") not in VALID_STATUSES:
            errors.append(f"project {pid} ({name}): invalid status '{p.get('status')}'")

        if "progress" not in p:
            if fix:
                p["progress"] = 0
                fixed.append(f"project {pid}: progress set to 0")
            else:
                errors.append(f"project {pid} ({name}): missing progress field")

        if p.get("progress", 0) >= 100 and p.get("status") != "completed":
            if fix:
                p["status"] = "completed"
                fixed.append(f"project {pid} ({name[:20]}): status → completed (progress=100%)")
            else:
                errors.append(
                    f"project {pid} ({name}): progress=100% but status='{p.get('status')}' (should be 'completed')"
                )

    # ── Actions ───────────────────────────────────────────────────

    actions = data.get("actions", [])
    for a in actions:
        aid = a.get("id", "?")
        if not a.get("category"):
            if fix:
                a["category"] = "business"
                fixed.append(f"action {aid}: category set to 'business' (default)")
            else:
                errors.append(f"action {aid} ({a.get('title','')[:20]}): missing category field")
        elif a.get("category") not in VALID_CATEGORIES:
            errors.append(
                f"action {aid}: invalid category '{a.get('category')}' (must be technical/business/resource)"
            )

    # ── Snapshot (uses `snapshots` array, finds matching weekLabel) ──

    # Formula: (on-track + completed) / total * 100
    on_track_count = sum(1 for p in projects if p.get("status") == "on-track")
    completed_count = sum(1 for p in projects if p.get("status") == "completed")
    at_risk_count = sum(1 for p in projects if p.get("status") == "at-risk")
    behind_count = sum(1 for p in projects if p.get("status") == "behind")

    if projects and data.get("weekLabel"):
        wl = data["weekLabel"]
        snapshots = data.get("snapshots", [])
        snap = next((s for s in snapshots if s.get("weekLabel") == wl), None)

        if snap is None:
            warnings.append(f"no snapshot entry for {wl} in snapshots array")
        else:
            expected_pct = round((on_track_count + completed_count) / len(projects) * 100)
            actual_pct = snap.get("onTrackPct", -1)
            if actual_pct != expected_pct:
                if fix:
                    snap["onTrackPct"] = expected_pct
                    fixed.append(
                        f"snapshots[{wl}].onTrackPct: {actual_pct} → {expected_pct} "
                        f"(on-track={on_track_count}+completed={completed_count}/{len(projects)})"
                    )
                else:
                    warnings.append(
                        f"snapshots[{wl}].onTrackPct={actual_pct} but expected {expected_pct} "
                        f"(on-track={on_track_count}+completed={completed_count}/{len(projects)})"
                    )

            if snap.get("atRiskCount") != at_risk_count:
                if fix:
                    snap["atRiskCount"] = at_risk_count
                    fixed.append(f"snapshots[{wl}].atRiskCount → {at_risk_count}")
                else:
                    warnings.append(
                        f"snapshots[{wl}].atRiskCount={snap.get('atRiskCount')} but expected {at_risk_count}"
                    )

            if snap.get("behindCount") != behind_count:
                if fix:
                    snap["behindCount"] = behind_count
                    fixed.append(f"snapshots[{wl}].behindCount → {behind_count}")
                else:
                    warnings.append(
                        f"snapshots[{wl}].behindCount={snap.get('behindCount')} but expected {behind_count}"
                    )

    # ── Risks ────────────────────────────────────────────────────

    risks = data.get("risks", [])
    valid_severities = {"high", "medium", "low", "High", "Medium", "Low", None, "None"}
    for r in risks:
        if r.get("severity") not in valid_severities:
            warnings.append(f"risk {r.get('id','?')}: invalid severity '{r.get('severity')}'")

    # ── Save if fixed ─────────────────────────────────────────────

    if fixed:
        save(path, data)

    return errors, warnings, fixed


def main():
    parser = argparse.ArgumentParser(description="Validate PGM weekly JSON files")
    parser.add_argument("weeks", nargs="*", help="Week labels (e.g. W18 W19) or paths")
    parser.add_argument("--all", action="store_true", help="Validate all weeks")
    parser.add_argument("--fix", action="store_true", help="Auto-fix safe issues")
    args = parser.parse_args()

    if args.all:
        paths = sorted(glob.glob(os.path.join(BASE, "W*.json")))
    elif args.weeks:
        paths = []
        for w in args.weeks:
            if os.path.isfile(w):
                paths.append(w)
            else:
                p = os.path.join(BASE, f"{w}.json")
                if os.path.isfile(p):
                    paths.append(p)
                else:
                    print(f"⚠️  {w}: file not found, skipping")
    else:
        parser.print_help()
        sys.exit(0)

    total_errors = 0
    total_warnings = 0

    for path in paths:
        label = os.path.basename(path).replace(".json", "")
        errors, warnings, fixed = validate_week(path, fix=args.fix)

        total_errors += len(errors)
        total_warnings += len(warnings)

        if errors or warnings or fixed:
            print(f"\n{'🔴' if errors else '🟡'} {label}")
            for e in errors:
                print(f"  ❌ ERROR:   {e}")
            for w in warnings:
                print(f"  ⚠️  WARN:    {w}")
            for fx in fixed:
                print(f"  ✅ FIXED:   {fx}")
        else:
            print(f"✅ {label}: OK")

    print(f"\n{'═'*50}")
    print(f"Checked {len(paths)} file(s): {total_errors} error(s), {total_warnings} warning(s)")

    if total_errors:
        print("Run with --fix to auto-fix safe issues.")
        sys.exit(1)


if __name__ == "__main__":
    main()
