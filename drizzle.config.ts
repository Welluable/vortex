import path from "node:path";
import type { Config } from "drizzle-kit";

const dataDir = process.env.VORTEX_DATA_DIR ?? path.join(process.cwd(), "data");

export default {
  schema: "./src/db/schema/index.ts",
  out: "./src/db/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: path.join(dataDir, "vortex.db"),
  },
} satisfies Config;
