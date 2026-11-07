// SPDX-License-Identifier: MIT
import { PepkioClient } from "../dist/index.js";

async function main() {
  const apiKey = process.env.PEPKIO_API_KEY || process.env.LOCAL_PEPKIO_API_KEY || "your-api-key";
  const client = new PepkioClient({ apiKey });

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

  console.log("Running inner join with gene ID version stripping...");
  const result = await client.join({
    tab: "matchmaker",
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

  console.log(`Status: ${result.status}`);
  console.log(`Matched rows: ${result.result?.join_result?.row_count}`);
  console.log(`Output columns:`, result.result?.join_result?.columns);
  if (result.result?.scripts?.python) {
    console.log("\nGenerated Python reproducibility snippet:\n");
    console.log(result.result.scripts.python);
  }
}

main().catch(console.error);
