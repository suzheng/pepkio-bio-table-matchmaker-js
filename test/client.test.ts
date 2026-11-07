import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PepkioClient } from "../src/client.js";
import {
  DEFAULT_API_BASE_URL,
  TOOL_ID,
  apiPath,
  resolveApiKey,
  resolveBaseUrl,
} from "../src/config.js";
import { parseRunInput } from "../src/schemas.js";
import { PepkioAPIError } from "../src/types.js";

const MOCK_MANIFEST = {
  schema_version: "1.0",
  tool_id: "bio-table-matchmaker",
  title: "Bio Table Matchmaker",
  description: "Merge two biological CSV/TSV tables",
  execution_mode: "sync",
  examples: [
    {
      name: "load_example",
      description: "Load built-in DEG + annotation example tables",
      input: {
        tab: "matchmaker",
        load_example: true,
      },
      output: {
        table_a: { rows: 16 },
      },
    },
    {
      name: "diagnose_example",
      description: "Pre-join diagnostics",
      input: {
        tab: "matchmaker",
        load_example: true,
        key_column_a: "ensembl_gene_id",
        key_column_b: "ensembl_id",
      },
      output: {
        diagnostics: { match_pct: 93.75 },
      },
    },
    {
      name: "join_example",
      description: "Execute join",
      input: {
        tab: "matchmaker",
        load_example: true,
        key_column_a: "ensembl_gene_id",
        key_column_b: "ensembl_id",
        join_type: "left",
        run_join: true,
      },
      output: {
        join_result: { row_count: 16 },
      },
    },
  ],
};

const MOCK_RUN_RESULT = {
  run_id: "run-matchmaker-123",
  status: "completed",
  result: {
    tab: "matchmaker",
    table_a: {
      columns: ["ensembl_gene_id", "gene_symbol"],
      rows: [["ENSG00000141510.15", "TP53"]],
      delimiter: "\t",
    },
    table_b: {
      columns: ["ensembl_id", "description"],
      rows: [["ENSG00000141510", "tumor protein p53"]],
      delimiter: "\t",
    },
    key_column_a: "ensembl_gene_id",
    key_column_b: "ensembl_id",
    diagnostics: {
      total_a: 1,
      total_b: 1,
      matched_a: 1,
      unmatched_a: 0,
      orphans_b: 0,
      match_pct: 100,
      duplicate_keys_b: 0,
      estimated_output_rows: 1,
      expansion_warning: false,
      unmatched_keys_a: [],
      orphan_keys_b: [],
      id_type_a: "ensembl",
      id_type_b: "ensembl",
      mixed_id_a: false,
      mixed_id_b: false,
      chr_harmonized: false,
      version_stripped: true,
    },
    warnings: [],
  },
  error: null,
  result_url: "https://tools.pepkio.com/api/tools/v1/runs/run-matchmaker-123",
  permalink: "https://tools.pepkio.com/r/run-matchmaker-123",
};

describe("PepkioClient unit tests", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("getManifest() fetches and returns tool_id", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      text: async () => JSON.stringify(MOCK_MANIFEST),
    });

    const client = new PepkioClient({ apiKey: "test-key" });
    const manifest = await client.getManifest();

    expect(manifest.tool_id).toBe(TOOL_ID);
    expect(manifest.title).toBe("Bio Table Matchmaker");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://tools.pepkio.com/api/tools/v1/tools/bio-table-matchmaker/manifest",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("caches getManifest() calls", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      text: async () => JSON.stringify(MOCK_MANIFEST),
    });
    globalThis.fetch = fetchMock;

    const client = new PepkioClient({ apiKey: "test-key" });
    await client.getManifest();
    await client.getManifest();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("listExamples() extracts examples from manifest", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      text: async () => JSON.stringify(MOCK_MANIFEST),
    });

    const client = new PepkioClient({ apiKey: "test-key" });
    const examples = await client.getExamples();

    expect(examples).toHaveLength(3);
    expect(examples[0]?.name).toBe("load_example");
    expect(examples[1]?.name).toBe("diagnose_example");
    expect(examples[2]?.name).toBe("join_example");
  });

  it("getExampleInput() retrieves and parses example", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      text: async () => JSON.stringify(MOCK_MANIFEST),
    });

    const client = new PepkioClient({ apiKey: "test-key" });
    const input = await client.getExampleInput("load_example");

    expect(input.tab).toBe("matchmaker");
    expect(input.load_example).toBe(true);
  });

  it("getExampleInput() throws on unknown example name", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      text: async () => JSON.stringify(MOCK_MANIFEST),
    });

    const client = new PepkioClient({ apiKey: "test-key" });
    await expect(client.getExampleInput("non_existent")).rejects.toThrow(
      /Example "non_existent" not found/,
    );
  });

  it("run() sends validated input and options", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      text: async () => JSON.stringify(MOCK_RUN_RESULT),
    });

    const client = new PepkioClient({ apiKey: "test-key" });
    const result = await client.run(
      { tab: "matchmaker", load_example: true },
      { label: "my-run" },
    );

    expect(result.status).toBe("completed");
    expect(result.run_id).toBe("run-matchmaker-123");
    expect(result.result?.table_a?.columns).toEqual(["ensembl_gene_id", "gene_symbol"]);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://tools.pepkio.com/api/tools/v1/tools/bio-table-matchmaker/run",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-key",
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          input: {
            tab: "matchmaker",
            load_example: true,
            join_type: "left",
          },
          options: { label: "my-run" },
        }),
      }),
    );
  });

  it("run() throws 401 when apiKey is missing", async () => {
    const client = new PepkioClient({ apiKey: "" });
    await expect(
      client.run({ tab: "matchmaker", load_example: true }),
    ).rejects.toThrow(/API key required/);
  });

  it("helper methods call run() with appropriate parameters", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      text: async () => JSON.stringify(MOCK_RUN_RESULT),
    });

    const client = new PepkioClient({ apiKey: "test-key" });

    await client.loadExample({ label: "test-load" });
    await client.diagnose({
      tab: "matchmaker",
      load_example: true,
      key_column_a: "ensembl_gene_id",
      key_column_b: "ensembl_id",
    });
    await client.join({
      tab: "matchmaker",
      load_example: true,
      key_column_a: "ensembl_gene_id",
      key_column_b: "ensembl_id",
      join_type: "inner",
    });

    expect(globalThis.fetch).toHaveBeenCalledTimes(3);
  });

  it("getRun() fetches previous run by ID", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      text: async () => JSON.stringify(MOCK_RUN_RESULT),
    });

    const client = new PepkioClient({ apiKey: "test-key" });
    const result = await client.getRun("run-matchmaker-123");

    expect(result.run_id).toBe("run-matchmaker-123");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://tools.pepkio.com/api/tools/v1/runs/run-matchmaker-123",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("waitForRun() polls until run is completed", async () => {
    const queuedResponse = {
      run_id: "async-run-1",
      status: "running",
    };
    const completedResponse = {
      run_id: "async-run-1",
      status: "completed",
      result: {
        tab: "matchmaker",
        warnings: [],
      },
    };

    let calls = 0;
    globalThis.fetch = vi.fn().mockImplementation(async () => {
      calls++;
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        text: async () => JSON.stringify(calls > 1 ? completedResponse : queuedResponse),
      };
    });

    const client = new PepkioClient({ apiKey: "test-key" });
    const result = await client.waitForRun("async-run-1", {
      intervalMs: 10,
      timeoutMs: 500,
    });

    expect(result.status).toBe("completed");
    expect(calls).toBe(2);
  });

  it("waitForRun() throws on timeout", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      text: async () => JSON.stringify({ run_id: "run-slow", status: "running" }),
    });

    const client = new PepkioClient({ apiKey: "test-key" });
    await expect(
      client.waitForRun("run-slow", { intervalMs: 10, timeoutMs: 50 }),
    ).rejects.toThrow(/Timed out/);
  });

  it("throws PepkioAPIError on HTTP 500 error", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      text: async () => JSON.stringify({ error: "Database crashed" }),
    });

    const client = new PepkioClient({ apiKey: "test-key" });
    await expect(
      client.run({ tab: "matchmaker", load_example: true }),
    ).rejects.toThrow("Database crashed");
  });

  it("throws PepkioAPIError when error field is present in 200 response", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      text: async () =>
        JSON.stringify({
          run_id: "failed-run-1",
          status: "failed",
          error: "Key column not found",
        }),
    });

    const client = new PepkioClient({ apiKey: "test-key" });
    await expect(
      client.run({ tab: "matchmaker", load_example: true }),
    ).rejects.toThrow("Key column not found");
  });

  describe("config helpers", () => {
    it("resolveBaseUrl handles custom and default values", () => {
      expect(resolveBaseUrl("https://custom.pepkio.com/")).toBe(
        "https://custom.pepkio.com",
      );
      expect(resolveBaseUrl()).toBe(DEFAULT_API_BASE_URL);
    });

    it("resolveApiKey prefers explicit key, then LOCAL vs production", () => {
      expect(resolveApiKey("https://tools.localtest.me", "my-key")).toBe("my-key");
      const savedProd = process.env.PEPKIO_API_KEY;
      const savedLocal = process.env.LOCAL_PEPKIO_API_KEY;
      try {
        process.env.PEPKIO_API_KEY = "prod-env-key";
        process.env.LOCAL_PEPKIO_API_KEY = "local-env-key";

        expect(resolveApiKey("https://tools.localtest.me")).toBe("local-env-key");
        expect(resolveApiKey("https://tools.pepkio.com")).toBe("prod-env-key");
      } finally {
        process.env.PEPKIO_API_KEY = savedProd;
        process.env.LOCAL_PEPKIO_API_KEY = savedLocal;
      }
    });

    it("apiPath builds correct URLs", () => {
      expect(apiPath("https://tools.pepkio.com", "/tools/bio-table-matchmaker/run")).toBe(
        "https://tools.pepkio.com/api/tools/v1/tools/bio-table-matchmaker/run",
      );
      expect(apiPath("https://tools.pepkio.com", "runs/123")).toBe(
        "https://tools.pepkio.com/api/tools/v1/runs/123",
      );
    });
  });

  describe("schema parsing", () => {
    it("validates valid table inputs and sets defaults", () => {
      const parsed = parseRunInput({ load_example: true });
      expect(parsed.tab).toBe("matchmaker");
      expect(parsed.join_type).toBe("left");
      expect(parsed.load_example).toBe(true);
    });

    it("throws on invalid tab value", () => {
      expect(() => parseRunInput({ tab: "invalid_tab" })).toThrow();
    });

    it("throws on invalid join_type value", () => {
      expect(() => parseRunInput({ join_type: "cross" })).toThrow();
    });
  });
});
