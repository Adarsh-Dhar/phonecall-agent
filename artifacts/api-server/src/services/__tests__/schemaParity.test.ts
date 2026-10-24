import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

describe("schema parity", () => {
  let schema: string;
  let schemaProd: string;

  beforeAll(() => {
    // Schema is at workspace root
    const workspaceRoot = join(__dirname, "../../../../..");
    schema = readFileSync(join(workspaceRoot, "prisma/schema.prisma"), "utf-8");
    schemaProd = readFileSync(join(workspaceRoot, "prisma/schema.prod.prisma"), "utf-8");
  });

  it("schema.prod.prisma should match schema.prisma", () => {
    // Remove comment-only lines for comparison
    const normalize = (s: string) => s.replace(/^\/\/.*$/gm, "").replace(/\s+/g, " ").trim();
    expect(normalize(schemaProd)).toBe(normalize(schema));
  });
});
