// SPDX-License-Identifier: MIT
import { PepkioAPIError, PepkioClient } from "../dist/index.js";

async function main() {
  // Test with invalid API key
  const client = new PepkioClient({
    apiKey: "invalid-key-testing",
  });

  try {
    await client.run({ tab: "matchmaker", load_example: true });
  } catch (err) {
    if (err instanceof PepkioAPIError) {
      console.log("Caught expected PepkioAPIError:");
      console.log(`HTTP Status: ${err.status}`);
      console.log(`Message: ${err.message}`);
    } else {
      console.error("Unexpected error:", err);
    }
  }
}

main().catch(console.error);
