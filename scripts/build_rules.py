#!/usr/bin/env python3
import argparse, json
import pandas as pd
from pathlib import Path

# ---------- helpers ----------
def read_csv_maybe(path: Path, required: bool = True, encoding: str | None = None, **kwargs) -> pd.DataFrame:
    encodings_to_try = [encoding] if encoding else ["utf-8", "utf-8-sig", "cp1252", "latin1"]
    last_err = None
    for enc in encodings_to_try:
        try:
            return pd.read_csv(
                path,
                dtype=str,
                keep_default_na=False,
                na_values=[],
                encoding=enc,
                engine="python",      # more forgiving parser
                on_bad_lines="skip",  # skip any corrupt lines
                **kwargs
            )
        except UnicodeDecodeError as e:
            last_err = e
            continue
        except FileNotFoundError:
            if required:
                raise
            return pd.DataFrame()
    if required:
        raise UnicodeDecodeError(f"Could not decode {path} with encodings {encodings_to_try}") from last_err
    return pd.DataFrame()

def normalize_cols(df: pd.DataFrame) -> pd.DataFrame:
    if df is None or (len(df) == 0 and df.columns.size == 0):
        return df
    df.columns = (
        df.columns.astype(str)
        .str.strip()
        .str.lower()
        .str.replace(r"\s+", "_", regex=True)
        .str.replace(r"[^a-z0-9_]", "", regex=True)
    )
    return df

def pick(df: pd.DataFrame, candidates: list[str], where: str, required: bool = True) -> str | None:
    if df is None or df.columns.size == 0:
        if required:
            raise ValueError(f"{where}: no columns found; file likely missing or unreadable")
        return None
    for c in candidates:
        if c in df.columns:
            return c
    if required:
        raise ValueError(f"{where} missing columns. Tried {candidates}; found: {list(df.columns)[:12]} ...")
    return None

# ---------- main ----------
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--cms-dir", required=True, help="Directory with CMS MCD Articles CSVs")
    ap.add_argument("--gitcodes", required=False, help="CSV of curated WISeR codes (optional)")
    ap.add_argument("--out", required=True, help="Output directory")
    ap.add_argument("--encoding", required=False, default=None,
                    help="CSV encoding (utf-8, cp1252, latin1). If not set, tries several.")
    args = ap.parse_args()

    cms_dir = Path(args.cms_dir)
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    # Required
    article        = read_csv_maybe(cms_dir / "article.csv", encoding=args.encoding)
    ax_hcpc        = read_csv_maybe(cms_dir / "article_x_hcpc_code.csv", encoding=args.encoding)
    ax_contractor  = read_csv_maybe(cms_dir / "article_x_contractor.csv", encoding=args.encoding)
    contractor     = read_csv_maybe(cms_dir / "contractor.csv", encoding=args.encoding)
    contractor_jur = read_csv_maybe(cms_dir / "contractor_jurisdiction.csv", encoding=args.encoding)
    state_lookup   = read_csv_maybe(cms_dir / "state_lookup.csv", encoding=args.encoding)
    # Optional
    ax_urls        = read_csv_maybe(cms_dir / "article_x_urls.csv", required=False, encoding=args.encoding)
    ax_rev         = read_csv_maybe(cms_dir / "article_x_revision_history.csv", required=False, encoding=args.encoding)

    # Normalize headers
    article        = normalize_cols(article)
    ax_hcpc        = normalize_cols(ax_hcpc)
    ax_contractor  = normalize_cols(ax_contractor)
    contractor     = normalize_cols(contractor)
    contractor_jur = normalize_cols(contractor_jur)
    state_lookup   = normalize_cols(state_lookup)
    ax_urls        = normalize_cols(ax_urls) if len(ax_urls) else ax_urls
    ax_rev         = normalize_cols(ax_rev)  if len(ax_rev)  else ax_rev

    # Column aliases (robust to schema variation)
    # ARTICLE
    article_id_col    = pick(article, ["article_id","document_id","id"], where="article")
    article_title_col = pick(article, ["article_title","title","display_title","name"], where="article")
    # ARTICLE_X_HCPC_CODE
    ax_article_id_col = pick(ax_hcpc, ["article_id","document_id","id"], where="article_x_hcpc_code")
    hcpc_code_col     = pick(ax_hcpc, ["hcpc_code","hcpc_code_id","hcpcs_code","hcpcs","hcpc","cpt_hcpcs","cpt_code","cpt","code"], where="article_x_hcpc_code")
    # ARTICLE_X_CONTRACTOR
    axc_article_id_col = pick(ax_contractor, ["article_id","document_id","id"], where="article_x_contractor")
    contractor_id_col  = pick(ax_contractor, ["contractor_id","carrier_id"], where="article_x_contractor")
    # CONTRACTOR
    contractor_id_col2  = pick(contractor, ["contractor_id","carrier_id","id"], where="contractor")
    contractor_name_col = pick(contractor, ["contractor_name","carrier_name","contractor_bus_name","bus_name","name"], where="contractor")

    # CONTRACTOR → STATE
    cj_contractor_id_col = pick(contractor_jur, ["contractor_id","carrier_id"], where="contractor_jurisdiction")
    state_id_col         = pick(contractor_jur, ["state_id","state_key","statecode_id"], where="contractor_jurisdiction")
    # STATE LOOKUP
    state_id2_col  = pick(state_lookup, ["state_id","state_key","statecode_id","id"], where="state_lookup")
    state_abbr_col = pick(state_lookup, ["state_abbr","state_code","state_abbrev","abbr"], where="state_lookup")
    # Optional URLs / Revisions
    url_article_id_col = pick(ax_urls, ["article_id","document_id","id"], required=False, where="article_x_urls")
    url_col            = pick(ax_urls, ["url","link","document_url"], required=False, where="article_x_urls")
    rev_article_id_col = pick(ax_rev,  ["article_id","document_id","id"], required=False, where="article_x_revision_history")
    rev_date_col       = pick(ax_rev,  ["revision_date","updated","last_updated","rev_date"], required=False, where="article_x_revision_history")

    # ---- Joins ----
    # article + HCPCS
    a_h = ax_hcpc.merge(
        article[[article_id_col, article_title_col]],
        left_on=ax_article_id_col, right_on=article_id_col, how="left"
    )

    # + contractor
    a_h_c = (
        a_h.merge(ax_contractor[[axc_article_id_col, contractor_id_col]],
                  left_on=ax_article_id_col, right_on=axc_article_id_col, how="left")
          .merge(contractor[[contractor_id_col2, contractor_name_col]],
                 left_on=contractor_id_col, right_on=contractor_id_col2, how="left")
    )

    # contractor → states
    a_h_c_s = (
        a_h_c.merge(contractor_jur[[cj_contractor_id_col, state_id_col]],
                    left_on=contractor_id_col, right_on=cj_contractor_id_col, how="left")
             .merge(state_lookup[[state_id2_col, state_abbr_col]],
                    left_on=state_id_col, right_on=state_id2_col, how="left")
    )

    # URLs (optional)
    if len(ax_urls) and url_article_id_col and url_col:
        a_h_c_s = a_h_c_s.merge(
            ax_urls[[url_article_id_col, url_col]],
            left_on=ax_article_id_col, right_on=url_article_id_col, how="left"
        )
        a_h_c_s.rename(columns={url_col: "cms_article_url"}, inplace=True)
    else:
        a_h_c_s["cms_article_url"] = ""

    # Revisions (optional)
    if len(ax_rev) and rev_article_id_col and rev_date_col:
        rev_dates = (
            ax_rev.groupby(rev_article_id_col, as_index=False)[rev_date_col]
                  .max()
                  .rename(columns={rev_article_id_col:"_rev_aid", rev_date_col:"last_updated"})
        )
        a_h_c_s = a_h_c_s.merge(rev_dates, left_on=ax_article_id_col, right_on="_rev_aid", how="left").drop(columns=["_rev_aid"])
    else:
        # You already have "last_updated" in article.csv; we can fallback to that:
        if "last_updated" in article.columns:
            a_h_c_s = a_h_c_s.merge(article[[article_id_col, "last_updated"]],
                                    left_on=ax_article_id_col, right_on=article_id_col, how="left")
        else:
            a_h_c_s["last_updated"] = ""

    # Standardize names
    a_h_c_s.rename(columns={
        hcpc_code_col:       "cpt_hcpcs",
        contractor_name_col: "mac_carrier",
        state_abbr_col:      "state",
        article_title_col:   "article_title",
    }, inplace=True)

    # Coalesce last_updated (prefer the one from revisions if present)
    if "last_updated_y" in a_h_c_s.columns or "last_updated_x" in a_h_c_s.columns:
        a_h_c_s["last_updated"] = a_h_c_s.get("last_updated_y")
        a_h_c_s["last_updated"] = (
            a_h_c_s["last_updated"]
            .replace("", pd.NA)
            .fillna(a_h_c_s.get("last_updated_x"))
            .fillna("")
        )
        a_h_c_s.drop(columns=[c for c in ["last_updated_x","last_updated_y"] if c in a_h_c_s], inplace=True)
    elif "last_updated" not in a_h_c_s.columns:
        a_h_c_s["last_updated"] = ""


    print("Cols before dedupe:", list(a_h_c_s.columns))

    # Deduplicate
    a_h_c_s = a_h_c_s.drop_duplicates(
        subset=["cpt_hcpcs", "article_id", "contractor_id", "state"]
    )

    # Final slice
    rules = a_h_c_s[["cpt_hcpcs", ax_article_id_col, "article_title", "mac_carrier", "state", "cms_article_url", "last_updated"]].copy()
    rules.rename(columns={ax_article_id_col: "article_id"}, inplace=True)

    # default flags
    for col in ["requires_pa","program","effective_date","notes"]:
        if col not in rules.columns:
            rules[col] = ""

    # Attach WISeR flags if provided
    if args.wiser_codes:
        wiser = read_csv_maybe(Path(args.wiser_codes), required=True, encoding=args.encoding)
        wiser = normalize_cols(wiser)
        if "cpt" not in wiser.columns:
            raise ValueError("wiser_codes must include 'cpt' column")
        wiser = wiser.rename(columns={"cpt":"cpt_hcpcs"})
        rules = rules.merge(wiser, on="cpt_hcpcs", how="left", suffixes=("","_wiser"))
        for col in ["requires_pa","program","effective_date","notes"]:
            colw = col + "_wiser"
            if colw in rules.columns:
                rules[col] = rules[colw].where(rules[colw].notna() & (rules[colw] != ""), rules[col])
                rules.drop(columns=[colw], inplace=True)

    # Sort & write
    rules = rules.sort_values(by=["cpt_hcpcs","state","mac_carrier"]).reset_index(drop=True)

    out_csv = out_dir / "rules_joined.csv"
    out_json = out_dir / "rules_joined.json"
    rules = rules.fillna("")  # <— replaces NaN/None with empty string
    rules.to_csv(out_csv, index=False)
    rules.to_json(out_json, orient="records", indent=2)


    # Grouped JSON by CPT (compact app helper)
    grouped = []
    for cpt, df in rules.groupby("cpt_hcpcs"):
        rec = {
            "cpt": cpt,
            "articles": df[["article_id","article_title","mac_carrier","state","cms_article_url","last_updated"]].to_dict(orient="records"),
            "requires_pa": bool((df["requires_pa"].astype(str).str.upper() == "TRUE").any()),
            "programs": sorted(set([p for p in df["program"].tolist() if isinstance(p, str) and p])),
        }
        grouped.append(rec)
    (out_dir / "rules_grouped_by_cpt.json").write_text(json.dumps(grouped, indent=2, default=str))

    print(f"Wrote:\n - {out_csv}\n - {out_json}\n - {out_dir / 'rules_grouped_by_cpt.json'}")

if __name__ == "__main__":
    main()
