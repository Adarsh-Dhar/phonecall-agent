/**
 * Contact files: pure validation helpers (no DB, no Express) for files an owner attaches to a contact.
 * Files are stored in Postgres (ContactFile.data, BYTEA), so the limits are deliberately small.
 */

export const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB per file
export const MAX_FILES_PER_CONTACT = 20;
export const MAX_FILENAME_LENGTH = 200;

/** extension -> mime types accepted for it. The browser's reported type must match one of them. */
const ALLOWED: Record<string, string[]> = {
  pdf: ["application/pdf"],
  txt: ["text/plain"],
  csv: ["text/csv", "application/vnd.ms-excel", "text/plain"],
  doc: ["application/msword"],
  docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  xls: ["application/vnd.ms-excel"],
  xlsx: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
  png: ["image/png"],
};

/** Strips any path, control characters and RTL/bidi overrides; caps the length; never returns "". */
export function sanitizeFilename(raw: unknown): string {
  let name = String(raw ?? "");
  // multer gives latin1-decoded names; recover UTF-8 names (e.g. Hindi / Odia file names) when possible.
  // Only attempt it when every char fits in one byte; otherwise the name is already proper Unicode.
  if (/^[\u0000-\u00ff]*$/.test(name)) {
    const recovered = Buffer.from(name, "latin1").toString("utf8");
    if (!recovered.includes("\uFFFD")) name = recovered;
  }
  name = name
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[\u202a-\u202e\u2066-\u2069\u200e\u200f]/g, "")
    .replace(/^.*[\\/]/, "")
    .replace(/["<>:|?*]/g, "_")
    .trim();
  if (name.length > MAX_FILENAME_LENGTH) {
    const dot = name.lastIndexOf(".");
    const ext = dot > 0 && name.length - dot <= 10 ? name.slice(dot) : "";
    name = name.slice(0, MAX_FILENAME_LENGTH - ext.length) + ext;
  }
  return name && name !== "." && name !== ".." ? name : "file";
}

export type FileCheck = { ok: true; filename: string; mimeType: string } | { ok: false; error: string; status: number };

export function checkUpload(file: { originalname: string; mimetype: string; size: number } | undefined): FileCheck {
  if (!file) return { ok: false, status: 400, error: "No file received (send it as the \"file\" field)" };
  if (file.size === 0) return { ok: false, status: 400, error: "File is empty" };
  if (file.size > MAX_FILE_BYTES) return { ok: false, status: 413, error: `File too large (max ${MAX_FILE_BYTES / 1024 / 1024} MB)` };
  const filename = sanitizeFilename(file.originalname);
  const ext = filename.includes(".") ? filename.split(".").pop()!.toLowerCase() : "";
  const allowedMimes = ALLOWED[ext];
  if (!allowedMimes) return { ok: false, status: 415, error: "File type not allowed (PDF, TXT, CSV, Word, Excel, JPG, PNG)" };
  const mime = String(file.mimetype || "").toLowerCase();
  // Some browsers send application/octet-stream for office files; accept that only for office formats.
  const officeExt = ["doc", "docx", "xls", "xlsx"].includes(ext);
  if (!allowedMimes.includes(mime) && !(officeExt && mime === "application/octet-stream")) {
    return { ok: false, status: 415, error: "File content type does not match its extension" };
  }
  return { ok: true, filename, mimeType: allowedMimes.includes(mime) ? mime : allowedMimes[0] };
}
