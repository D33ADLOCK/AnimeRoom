import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) =>
  readFileSync(resolve(process.cwd(), path), "utf8");

describe("launch-readiness source contracts", () => {
  const router = read("src/server/api/routers/job.ts");

  it("makes existing and new jobs private by default", () => {
    expect(read("drizzle/0017_supreme_morlocks.sql")).toContain(
      `DEFAULT 'private' NOT NULL`,
    );
  });

  it("requires publication on both public read paths", () => {
    expect(router.match(/eq\(t\.visibility, "published"\)/g)).toHaveLength(2);
  });

  it("keeps publication ownership and completion in the update predicate", () => {
    const mutation = router.slice(
      router.indexOf("setVisibility:"),
      router.indexOf("startExport:"),
    );
    expect(mutation).toContain("eq(jobsTable.userId, ctx.userId)");
    expect(mutation).toContain('eq(jobsTable.jobStatus, "complete")');
    expect(mutation).toContain('code: "NOT_FOUND"');
  });

  it("keeps generation idempotent and audio regeneration disabled", () => {
    expect(router).toContain("onConflictDoNothing");
    expect(router).not.toContain("regenerateAudio");
  });

  it("claims exports before invoking Remotion", () => {
    expect(router.indexOf('renderStatus: "starting"')).toBeLessThan(
      router.indexOf("await startVideoRender"),
    );
  });

  it("does not serialize internal diagnostics from getStatus", () => {
    const statusQuery = router.slice(
      router.indexOf("getStatus:"),
      router.indexOf("getManifest:"),
    );
    expect(statusQuery).toContain("safeError: true");
    expect(statusQuery).not.toContain("internalError");
  });

  it("isolates root checks from the protected field guide", () => {
    expect(read("tsconfig.json")).toContain("launch-readiness-field-guide");
    expect(read("vitest.config.ts")).toContain('include: ["src/**/*.test.ts"]');
  });

  it("runs every required CI command", () => {
    const ci = read(".github/workflows/ci.yml");
    for (const command of [
      "pnpm install --frozen-lockfile",
      "pnpm typecheck",
      "pnpm lint",
      "pnpm format:check",
      "pnpm test",
      "pnpm build",
      "pnpm audit --audit-level high",
    ]) {
      expect(ci).toContain(command);
    }
  });
});
