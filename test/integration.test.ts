import { describe, expect, it } from "vitest";
import { PepkioClient } from "../src/client.js";
import { TOOL_ID } from "../src/config.js";

const LOCAL_BASE_URL = "https://tools.localtest.me";
const PRODUCTION_BASE_URL = "https://tools.pepkio.com";

function envConfig(env: "local" | "production") {
  const baseUrl = process.env.PEPKIO_API_BASE_URL
    ? process.env.PEPKIO_API_BASE_URL.replace(/\/$/, "")
    : env === "local"
      ? LOCAL_BASE_URL
      : PRODUCTION_BASE_URL;

  const isLocal = baseUrl.includes("localtest.me");
  const apiKey = isLocal
    ? process.env.LOCAL_PEPKIO_API_KEY ?? process.env.PEPKIO_API_KEY
    : process.env.PEPKIO_API_KEY;

  return { baseUrl, apiKey, isLocal };
}

describe("integration: local", () => {
  const { baseUrl, apiKey } = envConfig("local");

  it.skipIf(!apiKey)("fetches manifest", async () => {
    const client = new PepkioClient({ baseUrl, apiKey });
    const manifest = await client.getManifest();

    expect(manifest.tool_id).toBe(TOOL_ID);
    expect(manifest.title).toBe("Bio Table Matchmaker");
    const names = manifest.examples?.map((e) => e.name) ?? [];
    expect(names).toContain("load_example");
    expect(names).toContain("diagnose_example");
    expect(names).toContain("join_example");
  });

  it.skipIf(!apiKey)("runs load_example", async () => {
    const client = new PepkioClient({ baseUrl, apiKey });
    const input = await client.getExampleInput("load_example");
    const result = await client.run(input);

    expect(result.status).toBe("completed");
    expect(result.error).toBeFalsy();
    expect(result.result?.table_a?.rows.length).toBe(16);
    expect(result.result?.table_b?.rows.length).toBe(15);
  }, 60_000);

  it.skipIf(!apiKey)("runs diagnose_example", async () => {
    const client = new PepkioClient({ baseUrl, apiKey });
    const input = await client.getExampleInput("diagnose_example");
    const result = await client.run(input);

    expect(result.status).toBe("completed");
    expect(result.error).toBeFalsy();
    expect(result.result?.diagnostics?.match_pct).toBe(93.75);
    expect(result.result?.diagnostics?.total_a).toBe(16);
    expect(result.result?.diagnostics?.matched_a).toBe(15);
  }, 60_000);

  it.skipIf(!apiKey)("runs join_example", async () => {
    const client = new PepkioClient({ baseUrl, apiKey });
    const input = await client.getExampleInput("join_example");
    const result = await client.run(input);

    expect(result.status).toBe("completed");
    expect(result.error).toBeFalsy();
    expect(result.result?.join_result?.row_count).toBe(16);
    expect(result.result?.join_result?.columns.length).toBeGreaterThan(0);
  }, 60_000);

  it.skipIf(!apiKey)("runs custom table join with TSV text", async () => {
    const client = new PepkioClient({ baseUrl, apiKey });
    const tableAText = "gene_id\tval\nENSG00000141510.1\t10\nENSG00000012048.2\t20\n";
    const tableBText = "ensembl_id\tname\nENSG00000141510\tTP53\nENSG00000012048\tBRCA1\n";

    const result = await client.run({
      tab: "matchmaker",
      table_a_text: tableAText,
      table_b_text: tableBText,
      key_column_a: "gene_id",
      key_column_b: "ensembl_id",
      join_type: "inner",
      run_join: true,
      generate_scripts: true,
    });

    expect(result.status).toBe("completed");
    expect(result.error).toBeFalsy();
    expect(result.result?.join_result?.row_count).toBe(2);
    expect(result.result?.scripts?.python).toBeDefined();
  }, 60_000);
});

describe("integration: production", () => {
  const { baseUrl, apiKey } = envConfig("production");

  it.skipIf(!apiKey || baseUrl.includes("localtest.me"))(
    "fetches manifest",
    async () => {
      const client = new PepkioClient({
        baseUrl: PRODUCTION_BASE_URL,
        apiKey,
      });
      const manifest = await client.getManifest();

      expect(manifest.tool_id).toBe(TOOL_ID);
      expect(manifest.title).toBe("Bio Table Matchmaker");
      const names = manifest.examples?.map((e) => e.name) ?? [];
      expect(names).toContain("load_example");
      expect(names).toContain("diagnose_example");
      expect(names).toContain("join_example");
    },
  );

  it.skipIf(!apiKey || baseUrl.includes("localtest.me"))(
    "runs load_example",
    async () => {
      const client = new PepkioClient({
        baseUrl: PRODUCTION_BASE_URL,
        apiKey,
      });
      const input = await client.getExampleInput("load_example");
      const result = await client.run(input);

      expect(result.status).toBe("completed");
      expect(result.error).toBeFalsy();
      expect(result.result?.table_a?.rows.length).toBe(16);
      expect(result.result?.table_b?.rows.length).toBe(15);
    },
    60_000,
  );

  it.skipIf(!apiKey || baseUrl.includes("localtest.me"))(
    "runs diagnose_example",
    async () => {
      const client = new PepkioClient({
        baseUrl: PRODUCTION_BASE_URL,
        apiKey,
      });
      const input = await client.getExampleInput("diagnose_example");
      const result = await client.run(input);

      expect(result.status).toBe("completed");
      expect(result.error).toBeFalsy();
      expect(result.result?.diagnostics?.match_pct).toBe(93.75);
      expect(result.result?.diagnostics?.total_a).toBe(16);
    },
    60_000,
  );

  it.skipIf(!apiKey || baseUrl.includes("localtest.me"))(
    "runs join_example",
    async () => {
      const client = new PepkioClient({
        baseUrl: PRODUCTION_BASE_URL,
        apiKey,
      });
      const input = await client.getExampleInput("join_example");
      const result = await client.run(input);

      expect(result.status).toBe("completed");
      expect(result.error).toBeFalsy();
      expect(result.result?.join_result?.row_count).toBe(16);
    },
    60_000,
  );

  it.skipIf(!apiKey || baseUrl.includes("localtest.me"))(
    "runs custom table join with TSV text",
    async () => {
      const client = new PepkioClient({
        baseUrl: PRODUCTION_BASE_URL,
        apiKey,
      });
      const tableAText = "gene_id\tval\nENSG00000141510.1\t10\nENSG00000012048.2\t20\n";
      const tableBText = "ensembl_id\tname\nENSG00000141510\tTP53\nENSG00000012048\tBRCA1\n";

      const result = await client.run({
        tab: "matchmaker",
        table_a_text: tableAText,
        table_b_text: tableBText,
        key_column_a: "gene_id",
        key_column_b: "ensembl_id",
        join_type: "inner",
        run_join: true,
        generate_scripts: true,
      });

      expect(result.status).toBe("completed");
      expect(result.error).toBeFalsy();
      expect(result.result?.join_result?.row_count).toBe(2);
      expect(result.result?.scripts?.python).toBeDefined();
    },
    60_000,
  );
});
