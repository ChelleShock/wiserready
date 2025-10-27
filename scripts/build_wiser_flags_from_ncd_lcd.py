#!/usr/bin/env python3
"""
build_wiser_flags_from_ncd_lcd.py

Given a list of target NCD/LCD identifiers (e.g., "NCD 160.7", "L38276"), find all Articles
linked to those documents and emit a WISeR flags CSV mapping CPT/HCPCS codes to
requires_pa/program/effective_date.

Inputs:
  --cms-dir  : directory containing CMS MCD CSVs including:
               article.csv, article_x_hcpc_code.csv,
               article_related_ncd_documents.csv (or article_related_documents.csv),
               article_related_documents.csv (LCD link table)

  --targets  : text file of NCD/LCD ids, one per line, e.g.:
               NCD 160.7
               NCD 230.18
               L38276
               L38307

Usage:
  python build_wiser_flags_from_ncd_lcd.py --cms-dir ~/mcd_articles \
        --targets ./wiser_targets.txt \
        --effective 2026-01-01 --out wiser_codes.csv
"""
import argparse
import pandas as pd
from pathlib import Path

def read_csv(path):
    return pd.read_csv(path, dtype=str, keep_default_na=False, na_values=[])

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--cms-dir", required=True)
    ap.add_argument("--targets", required=True, help="txt file of NCD/LCD ids, one per line")
    ap.add_argument("--effective", default="2026-01-01")
    ap.add_argument("--out", required=True, help="output wiser_codes.csv")
    args = ap.parse_args()

    cms = Path(args.cms_dir)
    article = read_csv(cms / "article.csv")
    ax_hcpc = read_csv(cms / "article_x_hcpc_code.csv")

    # Relation tables (names differ across dumps; try both)
    rel_ncd = None
    for fname in ["article_related_ncd_documents.csv","article_related_ncd_documents.csv","article_related_ncd_documents_v2.csv"]:
        p = cms / fname
        if p.exists():
            rel_ncd = read_csv(p); break
    rel = None
    for fname in ["article_related_documents.csv","article_related_documents_v2.csv"]:
        p = cms / fname
        if p.exists():
            rel = read_csv(p); break

    # Normalize
    for df in [article, ax_hcpc, rel_ncd, rel]:
        if df is not None:
            df.columns = [c.strip().lower() for c in df.columns]

    # Load targets
    targets = [ln.strip() for ln in Path(args.targets).read_text().splitlines() if ln.strip()]
    # Separate NCD vs LCD forms
    target_ncd_numbers = set()
    target_lcd_ids = set()
    for t in targets:
        up = t.upper().replace("NATIONAL COVERAGE DETERMINATION","").strip()
        if up.startswith("NCD"):
            # keep digits/decimal
            num = up.replace("NCD","").strip()
            target_ncd_numbers.add(num)
        elif up.startswith("L"):
            target_lcd_ids.add(up)

    # Find articles linked to target NCDs
    article_ids_from_ncd = set()
    if rel_ncd is not None and "ncd_id" in rel_ncd.columns:
        rel_ncd["ncd_id_norm"] = rel_ncd["ncd_id"].str.replace("NCD","", case=False).str.strip()
        mask = rel_ncd["ncd_id_norm"].isin(target_ncd_numbers)
        article_ids_from_ncd = set(rel_ncd.loc[mask, "article_id"].tolist())

    # Find articles linked to target LCDs
    article_ids_from_lcd = set()
    if rel is not None:
        # Many dumps store LCD id in "related_document_id" or similar
        # We'll heuristically match rows whose related_document_id starts with 'L' and is in targets
        lcd_col = None
        for cand in ["related_document_id","document_id","lcd_id"]:
            if cand in rel.columns:
                lcd_col = cand; break
        if lcd_col:
            rel["lcd_norm"] = rel[lcd_col].str.upper().str.strip()
            article_ids_from_lcd = set(rel.loc[rel["lcd_norm"].isin(target_lcd_ids), "article_id"].tolist())

    target_article_ids = article_ids_from_ncd.union(article_ids_from_lcd)

    # Link to HCPCS/CPT codes via article_x_hcpc_code
    if not target_article_ids:
        print("No matching article IDs found for targets. Check the relation files present.")
        pd.DataFrame(columns=["cpt","requires_pa","program","effective_date","notes"]).to_csv(args.out, index=False)
        return

    ax_hcpc_filtered = ax_hcpc[ax_hcpc["article_id"].isin(target_article_ids)].copy()

    # Emit wiser codes
    wiser = ax_hcpc_filtered[["hcpc_code"]].drop_duplicates().rename(columns={"hcpc_code":"cpt"})
    wiser["requires_pa"] = "TRUE"
    wiser["program"] = "WISeR"
    wiser["effective_date"] = args.effective
    wiser["notes"] = "Derived via NCD/LCD link"

    wiser.to_csv(args.out, index=False)
    print(f"Wrote {args.out} with {len(wiser)} CPT/HCPCS codes")

if __name__ == "__main__":
    main()
