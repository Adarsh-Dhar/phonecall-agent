import { describe, it, expect } from "vitest";
import { checkUpload, sanitizeFilename, MAX_FILE_BYTES } from "../contactFiles";

const f = (name: string, mimetype: string, size = 1000) => ({ originalname: name, mimetype, size });

describe("sanitizeFilename", () => {
  it("strips paths, control chars and bidi overrides", () => {
    expect(sanitizeFilename("../../etc/passwd.pdf")).toBe("passwd.pdf");
    expect(sanitizeFilename("C:\\temp\\scan.pdf")).toBe("scan.pdf");
    expect(sanitizeFilename("a\u0000b\u202ec.pdf")).toBe("abc.pdf");
  });
  it("never returns an empty name and caps the length keeping the extension", () => {
    expect(sanitizeFilename("")).toBe("file");
    expect(sanitizeFilename("..")).toBe("file");
    const long = sanitizeFilename("x".repeat(400) + ".pdf");
    expect(long.length).toBeLessThanOrEqual(200);
    expect(long.endsWith(".pdf")).toBe(true);
  });
});

describe("checkUpload", () => {
  it("accepts a normal pdf and png", () => {
    expect(checkUpload(f("report.pdf", "application/pdf")).ok).toBe(true);
    expect(checkUpload(f("pic.PNG", "image/png")).ok).toBe(true);
  });
  it("rejects missing, empty and oversized files", () => {
    expect(checkUpload(undefined)).toMatchObject({ ok: false, status: 400 });
    expect(checkUpload(f("a.pdf", "application/pdf", 0))).toMatchObject({ ok: false, status: 400 });
    expect(checkUpload(f("a.pdf", "application/pdf", MAX_FILE_BYTES + 1))).toMatchObject({ ok: false, status: 413 });
  });
  it("rejects disallowed extensions and mismatched types", () => {
    expect(checkUpload(f("run.exe", "application/octet-stream"))).toMatchObject({ ok: false, status: 415 });
    expect(checkUpload(f("page.html", "text/html"))).toMatchObject({ ok: false, status: 415 });
    expect(checkUpload(f("evil.pdf", "text/html"))).toMatchObject({ ok: false, status: 415 });
  });
  it("accepts octet-stream only for office formats", () => {
    expect(checkUpload(f("sheet.xlsx", "application/octet-stream")).ok).toBe(true);
    expect(checkUpload(f("doc.pdf", "application/octet-stream")).ok).toBe(false);
  });
});
