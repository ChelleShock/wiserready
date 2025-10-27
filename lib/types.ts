
export type StateCode = 'TX'|'AZ'|'OH'|'OK'|'NJ'|'WA';

export interface ChecklistItem {
  id: string;
  label: string;
  helpText?: string;
  required: boolean;
}

export interface RuleRef {
  title: string;
  url: string;
}

export interface Rule {
  id: string;
  cpt: string;
  description: string;
  requiresPA: 'YES'|'NO'|'CONDITIONAL';
  program: 'WISeR';
  states: StateCode[];
  macCarrier?: string;
  effectiveDate: string;
  documentation: ChecklistItem[];
  references: RuleRef[];
  lastUpdated: string;
  deprecated?: boolean;
}

export interface CheckResponse {
  query: { cpt?: string; keyword?: string; state: StateCode };
  matchQuality: 'EXACT'|'FUZZY'|'NONE';
  rule?: Rule;
  suggestions?: Array<{ cpt:string; description:string }>;
  disclaimers: string[];
}
