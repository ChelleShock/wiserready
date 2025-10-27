#!/usr/bin/env python3
"""
make_rules_json.py

Converts the joined table (rules_joined.csv) into the app-friendly JSON that WISeReady's
Next.js API expects (an array under key "items", each with fields like in data/rules.json).

Usage:
  python make_rules_json.py --rules rules_joined.csv --out rules.json \
        --states TX AZ OH OK NJ WA --program WISeR --effective 2026-01-01
"""
import argparse, json
import pandas as pd
from pathlib import Path
from datetime import datetime

def main():
  ap = argparse.ArgumentParser()
  ap.add_argument("--rules", required=True, help="rules_joined.csv from build_rules.py")
  ap.add_argument("--out", required=True, help="Output JSON path")
  ap.add_argument("--states", nargs="+", required=True, help="List of 2-letter states to include")
  ap.add_argument("--program", default="WISeR")
  ap.add_argument("--effective", default="2026-01-01")
  args = ap.parse_args()

  df = pd.read_csv(args.rules, dtype=str, keep_default_na=False, na_values=[])
  # keep only rows with requires_pa TRUE or CONDITIONAL to seed the app
  mask = df["requires_pa"].astype(str).str.upper().isin(["TRUE","CONDITIONAL"])
  df = df[mask].copy()

  items = []
  # We'll collapse per (cpt, program)
  for idx, row in df.groupby("cpt_hcpcs").head(1).iterrows():  # one per CPT (first row carries metadata)
    cpt = row["cpt_hcpcs"]
    description = row.get("article_title","").replace("Billing and Coding: ","").strip() or f"CPT/HCPCS {cpt}"
    requires = row.get("requires_pa","").upper() or "TRUE"
    item = {
      "id": f"{cpt}-{args.program}",
      "cpt": cpt,
      "description": description,
      "requiresPA": "CONDITIONAL" if requires=="CONDITIONAL" else "YES",
      "program": args.program,
      "states": args.states,
      "effectiveDate": args.effective,
      "documentation": [
        {"id":"dx-notes","label":"Physician notes supporting medical necessity","required": True},
        {"id":"conservative","label":"Conservative therapy documented (if applicable)","required": True},
        {"id":"imaging","label":"Relevant imaging / diagnostics attached","required": True}
      ],
      "references": [],
      "lastUpdated": datetime.utcnow().date().isoformat()
    }
    items.append(item)

  # Write JSON
  Path(args.out).write_text(json.dumps({"items": items}, indent=2))
  print(f"Wrote {args.out} with {len(items)} items")

if __name__ == "__main__":
  main()
