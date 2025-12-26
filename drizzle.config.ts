import { defineConfig } from "drizzle-kit";

// Note: Drizzle Kit migrations with dynamic schemas are complex.
// Usually, you define a 'template' schema or manage raw SQL.
// This config maps to a default schema for development.

export default defineConfig({
    schema: "./db/schema.ts",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/zapia_ai",
    },
});
