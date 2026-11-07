# Pepkio Bio Table Matchmaker

Node.js and TypeScript client library with CLI for performing structure-preserving relational table joins, biological identifier normalization, and collision-free dataset integration via the Pepkio Tools REST API.

# What It Does

Biological datasets—such as differential RNA-seq expression matrices, LC-MS/MS proteomics tables, and qPCR plate maps—frequently rely on inconsistent accession numbers, Ensembl gene IDs with decimal versions, variable casing, or trailing whitespace. Merging these datasets in general-purpose spreadsheet software often leads to silent data corruption, such as automatic conversion of gene symbols (e.g. *SEPT9*) into calendar dates or unhandled one-to-many matches.

This package provides a typed Node.js client and command-line interface for the hosted Pepkio Bio Table Matchmaker REST API. Execute left, inner, right, or full outer joins between CSV and TSV tables with automatic version-suffix stripping, case normalization, composite key matching, duplicate key handling, and column collision resolution.

Programmatic runs require a network connection and a Pepkio API key. Join operations and normalization logic are processed remotely via the API engine.

# Features

- **Relational Join Modes**: Execute left, inner, right, and full outer joins between delimited biological datasets (CSV/TSV).
- **Identifier Normalization**: Automatically strip Ensembl/NCBI decimal version tags (e.g. `.15` from `ENSG00000139618.15`), fold case, and trim whitespace.
- **Key Matching**: Match tables on single key columns or multi-column composite identifiers.
- **Duplicate Key Handling**: Choose deterministic policies for duplicate keys: retain first match, retain last match, or generate Cartesian expansions.
- **Column Conflict Resolution**: Prevent data overwrites with configurable prefixes or suffixes for duplicate non-key headers.
- **Typed ESM Client**: Full TypeScript definitions with Zod validation and promise-based client methods (`getManifest`, `listExamples`, `getExampleInput`, `run`, `diagnose`, `join`).
- **CLI Utilities**: Inspect manifests and execute table join calculations directly from the terminal.
- **Reproducibility Snippets & Permalinks**: Retrieve generated Python/R reproducibility code and permanent calculation URLs.

# Installation

```bash
npm install pepkio-bio-table-matchmaker
```

Requires Node.js 18 or newer.

# Configuration

Set an API key with **tools:run** scope before invoking `run()`:

```bash
export PEPKIO_API_KEY="your-api-key"
```

Create and manage keys in your [Pepkio Account](https://www.pepkio.com/account/api-keys).

Optional configuration variables:

| Variable | Purpose |
|----------|---------|
| `PEPKIO_API_KEY` | Production API key (required for `run`) |
| `LOCAL_PEPKIO_API_KEY` | Local development key when `PEPKIO_API_BASE_URL` points to `tools.localtest.me` |
| `PEPKIO_API_BASE_URL` | API base URL (default: `https://tools.pepkio.com`) |

# Quick Example

```typescript
import { PepkioClient } from "pepkio-bio-table-matchmaker";

const client = new PepkioClient({ apiKey: process.env.PEPKIO_API_KEY });

const tableA = `gene_id\tsample1_cpm\tsample2_cpm
ENSG00000141510.15\t124.5\t150.2
ENSG00000012048.8\t45.0\t38.2
ENSG00000146648.14\t89.1\t92.0
`;

const tableB = `ensembl_id\tsymbol\tdescription
ENSG00000141510\tTP53\ttumor protein p53
ENSG00000012048\tBRCA1\tBRCA1 DNA repair associated
ENSG00000146648\tEGFR\tepidermal growth factor receptor
`;

const result = await client.join({
  table_a_text: tableA,
  table_b_text: tableB,
  key_column_a: "gene_id",
  key_column_b: "ensembl_id",
  join_type: "inner",
  normalize: {
    strip_ensembl_version: true,
    case_insensitive: false,
  },
  run_join: true,
  generate_scripts: true,
});

console.log("Status:", result.status);
console.log("Matched rows:", result.result?.join_result?.row_count);
console.log("Columns:", result.result?.join_result?.columns);
console.log("Permalink:", result.permalink);
```

# CLI

```bash
# List available manifest examples
npx pepkio-bio-table-matchmaker manifest --examples

# Run a join example
npx pepkio-bio-table-matchmaker run --example load_example
```

# Typical Use Cases

- **Differential Expression Annotation**: Merge DESeq2 or edgeR differential gene expression tables with BioMart Ensembl annotations.
- **Proteomics Metadata Integration**: Align LC-MS/MS peptide or protein intensity matrices with UniProt accession annotations.
- **Plate Map Merging**: Align microplate reader absorbance/fluorescence outputs with experimental layout maps.
- **Single-Cell Marker Mapping**: Cross-reference Seurat or Scanpy cluster marker lists against reference gene databases.
- **Genomic Variant Annotation**: Combine VCF-derived variant tables with clinical outcome matrices without date-conversion artifacts.

# Scientific Background

Relational set operations combine tables $A$ and $B$ over primary keys $K_A$ and $K_B$. Left outer joins ($A \bowtie_L B$) retain all records from $A$, filling missing attributes of $B$ with nulls ($\varnothing$), while inner joins ($A \bowtie B$) keep only exact key intersections.

Biological identifiers introduce key mismatches due to Ensembl versioning (e.g. `ENSG00000141510.16` vs `ENSG00000141510`), case variations (`TP53` vs `tp53`), or 1:N transcript-to-gene relationships. Automatic date parsing in standard spreadsheet software frequently corrupts gene symbols like *SEPT9* or *MARCH1*. Normalizing identifiers prior to set joins ensures exact row alignment while preserving source data integrity.

# Web Application

For researchers who prefer a graphical interface, an interactive web version is available.

Web Application: https://www.pepkio.com/tools/bio-table-matchmaker

The web interface provides interactive file upload, visual preview of join overlaps, diagnostics metrics, and downloadable joined datasets.

# Documentation and Resources

GitHub Repository: https://github.com/pepkio/pepkio-bio-table-matchmaker-js

Web Application: https://www.pepkio.com/tools/bio-table-matchmaker

Python client (PyPI): https://pypi.org/project/pepkio-bio-table-matchmaker/

# About Pepkio

Pepkio (https://www.pepkio.com/) develops software tools and bioinformatics solutions for life science researchers, including laboratory calculators and analysis services (https://www.pepkio.com/cro).

A semantic, AI-native version of this document in the K2F format is available at https://k2f.dev (https://k2f.dev/v/fe890ea02068c96acbdb25845d9711d72bc7468f6705e7c55b1c626fdce8b4b5)
