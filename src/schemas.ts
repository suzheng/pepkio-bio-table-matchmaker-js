// SPDX-License-Identifier: MIT
import { z } from "zod";

export const delimiterSchema = z.enum([",", "\t", ";"]);

export const parsedTableSchema = z.object({
  columns: z.array(z.string()),
  rows: z.array(z.array(z.string())),
  delimiter: delimiterSchema,
});

export const normalizeSchema = z.object({
  strip_ensembl_version: z.boolean().default(true),
  harmonize_chr_prefix: z.boolean().default(true),
  case_insensitive: z.boolean().default(false),
});

export const joinTypeSchema = z.enum(["left", "inner", "outer", "anti", "semi"]);

export const tabSchema = z.enum(["matchmaker", "code"]);

export const bioTableMatchmakerInputSchema = z.object({
  tab: tabSchema.optional().default("matchmaker"),
  load_example: z.boolean().optional(),
  swap_tables: z.boolean().optional(),
  table_a_text: z.string().max(5_242_880).optional(),
  table_b_text: z.string().max(5_242_880).optional(),
  table_a_has_header: z.boolean().optional(),
  table_b_has_header: z.boolean().optional(),
  table_a: parsedTableSchema.optional(),
  table_b: parsedTableSchema.optional(),
  key_column_a: z.string().optional(),
  key_column_b: z.string().optional(),
  b_output_columns: z.array(z.string()).optional(),
  normalize: normalizeSchema.partial().optional(),
  join_type: joinTypeSchema.optional().default("left"),
  run_join: z.boolean().optional(),
  generate_scripts: z.boolean().optional(),
});

export type DelimiterInput = z.infer<typeof delimiterSchema>;
export type ParsedTableInput = z.infer<typeof parsedTableSchema>;
export type NormalizeInput = z.infer<typeof normalizeSchema>;
export type JoinTypeInput = z.infer<typeof joinTypeSchema>;
export type TabInput = z.infer<typeof tabSchema>;

export type BioTableMatchmakerInput = z.input<typeof bioTableMatchmakerInputSchema>;
export type BioTableMatchmakerResolvedInput = z.infer<typeof bioTableMatchmakerInputSchema>;

export function parseRunInput(input: unknown): BioTableMatchmakerResolvedInput {
  return bioTableMatchmakerInputSchema.parse(input);
}
