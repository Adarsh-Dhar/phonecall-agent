import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import multer from "multer";
import { prisma } from "@workspace/db-prisma";
import { asyncHandler } from "../lib/asyncHandler";
import { checkUpload, MAX_FILE_BYTES, MAX_FILES_PER_CONTACT } from "../services/contactFiles";

// Mounted at /contacts/:contactId/files (individual accounts only, see routes/index.ts).
const router: IRouter = Router({ mergeParams: true });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_BYTES, files: 1 },
});

/** Runs multer and turns its errors into clean 4xx responses instead of a 500. */
function receiveFile(req: Request, res: Response, next: NextFunction): void {
  upload.single("file")(req, res, (err: unknown) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      const tooBig = err.code === "LIMIT_FILE_SIZE";
      res.status(tooBig ? 413 : 400).json({ error: tooBig ? `File too large (max ${MAX_FILE_BYTES / 1024 / 1024} MB)` : err.message });
      return;
    }
    next(err);
  });
}

/** The contact must be a business contact owned by the signed-in individual. */
async function ownedContact(req: Request): Promise<{ id: string } | null> {
  return prisma.account.findFirst({
    where: { id: String(req.params.contactId), ownerId: req.userId!, isService: true },
    select: { id: true },
  });
}

const LIST_SELECT = { id: true, filename: true, mimeType: true, size: true, createdAt: true } as const;

router.get("/", asyncHandler(async (req, res) => {
  if (!(await ownedContact(req))) { res.status(404).json({ error: "Contact not found" }); return; }
  const files = await prisma.contactFile.findMany({
    where: { ownerId: req.userId!, contactId: String(req.params.contactId) },
    select: LIST_SELECT, // never load the bytes for a list
    orderBy: { createdAt: "desc" },
  });
  res.json(files);
}, "Failed to list files"));

router.post("/", receiveFile, asyncHandler(async (req, res) => {
  const contact = await ownedContact(req);
  if (!contact) { res.status(404).json({ error: "Contact not found" }); return; }

  const check = checkUpload(req.file);
  if (!check.ok) { res.status(check.status).json({ error: check.error }); return; }

  const count = await prisma.contactFile.count({ where: { ownerId: req.userId!, contactId: contact.id } });
  if (count >= MAX_FILES_PER_CONTACT) {
    res.status(400).json({ error: `File limit reached (${MAX_FILES_PER_CONTACT} per contact)` });
    return;
  }

  const created = await prisma.contactFile.create({
    data: {
      ownerId: req.userId!,
      contactId: contact.id,
      filename: check.filename,
      mimeType: check.mimeType,
      size: req.file!.size,
      data: req.file!.buffer,
    },
    select: LIST_SELECT,
  });
  res.status(201).json(created);
}, "Failed to upload file"));

router.get("/:fileId/download", asyncHandler(async (req, res) => {
  const file = await prisma.contactFile.findFirst({
    where: { id: String(req.params.fileId), contactId: String(req.params.contactId), ownerId: req.userId! },
  });
  if (!file) { res.status(404).json({ error: "File not found" }); return; }
  res.setHeader("Content-Type", file.mimeType);
  res.setHeader("Content-Length", String(file.size));
  // attachment + nosniff: an uploaded file can never be rendered as a page on our origin.
  res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(file.filename)}`);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cache-Control", "private, no-store");
  res.end(Buffer.from(file.data));
}, "Failed to download file"));

router.delete("/:fileId", asyncHandler(async (req, res) => {
  const result = await prisma.contactFile.deleteMany({
    where: { id: String(req.params.fileId), contactId: String(req.params.contactId), ownerId: req.userId! },
  });
  if (result.count === 0) { res.status(404).json({ error: "File not found" }); return; }
  res.status(204).end();
}, "Failed to delete file"));

export default router;
