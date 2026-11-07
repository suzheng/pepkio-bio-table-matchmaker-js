// SPDX-License-Identifier: MIT
import { PepkioClient } from "../dist/index.js";

async function main() {
  const apiKey = process.env.PEPKIO_API_KEY || process.env.LOCAL_PEPKIO_API_KEY || "your-api-key";
  const client = new PepkioClient({ apiKey });

  const manifest = await client.getManifest();
  console.log(`Tool ID: ${manifest.tool_id}`);
  console.log(`Tool Title: ${manifest.title}`);

  const examples = client.listExamples();
  if (examples.length > 0) {
    const exampleName = examples[0].name;
    console.log(`Running example: ${exampleName}`);
    const input = await client.getExampleInput(exampleName);
    const result = await client.run(input);
    console.log(`Status: ${result.status}`);
    console.log(`Table A rows: ${result.result?.table_a?.rows.length}`);
    console.log(`Table B rows: ${result.result?.table_b?.rows.length}`);
  }
}

main().catch(console.error);
