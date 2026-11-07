// SPDX-License-Identifier: MIT

export type RunStatus = "queued" | "running" | "completed" | "failed" | (string & {});

export interface RunOptions {
  idempotency_key?: string;
  label?: string;
  share?: string;
  [key: string]: unknown;
}

export interface RunResult<T = BioTableMatchmakerResult> {
  run_id: string;
  status: RunStatus;
  result?: T;
  error?: string | null;
  result_url?: string;
  permalink?: string;
  duration_ms?: number;
}

export interface ManifestExample {
  name: string;
  description?: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
}

export interface ToolManifest {
  schema_version: string;
  tool_id: string;
  title: string;
  description?: string;
  tags?: string[];
  category?: string;
  execution_mode?: string;
  estimated_runtime_sec?: number;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  agent_notes?: string;
  example_prompts?: string[];
  examples?: ManifestExample[];
  limits?: Record<string, unknown>;
  input_schema?: Record<string, unknown>;
}

export interface ExampleMeta {
  name: string;
  description?: string;
}

export type Delimiter = "," | "\t" | ";";

export type JoinType = "left" | "inner" | "outer" | "anti" | "semi";

export interface NormalizeOptions {
  strip_ensembl_version?: boolean;
  harmonize_chr_prefix?: boolean;
  case_insensitive?: boolean;
}

export interface ParsedTable {
  columns: string[];
  rows: string[][];
  delimiter: Delimiter;
}

export interface JoinDiagnostics {
  total_a: number;
  total_b: number;
  matched_a: number;
  unmatched_a: number;
  orphans_b: number;
  match_pct: number;
  duplicate_keys_b: number;
  estimated_output_rows: number;
  expansion_warning: boolean;
  unmatched_keys_a: string[];
  orphan_keys_b: string[];
  id_type_a: string;
  id_type_b: string;
  mixed_id_a: boolean;
  mixed_id_b: boolean;
  chr_harmonized: boolean;
  version_stripped: boolean;
}

export interface JoinResultTable {
  columns: string[];
  rows: string[][];
  delimiter: Delimiter;
  row_count: number;
  preview_rows: string[][];
}

export type ScriptLanguage = "python" | "r_base" | "r_dplyr";

/** Output shape returned by bio-table-matchmaker */
export interface BioTableMatchmakerResult {
  tab: "matchmaker" | "code";
  table_a?: ParsedTable;
  table_b?: ParsedTable;
  key_column_a?: string;
  key_column_b?: string;
  b_output_columns?: string[];
  normalize?: NormalizeOptions;
  join_type?: JoinType;
  diagnostics?: JoinDiagnostics;
  join_result?: JoinResultTable;
  scripts?: Record<string, string>;
  warnings?: string[];
  error?: string | null;
  [key: string]: unknown;
}

export class PepkioAPIError extends Error {
  readonly status: number;
  readonly body?: unknown;
  readonly runId?: string;

  constructor(message: string, opts: { status: number; body?: unknown; runId?: string }) {
    super(message);
    this.name = "PepkioAPIError";
    this.status = opts.status;
    this.body = opts.body;
    this.runId = opts.runId;
  }
}
