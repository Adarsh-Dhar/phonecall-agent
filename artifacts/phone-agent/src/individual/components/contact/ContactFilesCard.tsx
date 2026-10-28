import { useCallback, useEffect, useState } from 'react';
import { Download, LoaderCircle, Paperclip, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  contactFileDownloadUrl,
  deleteContactFile,
  fetchContactFiles,
  uploadContactFile,
  type ContactFile,
} from '@/lib/api/contactFiles';

const MAX_BYTES = 5 * 1024 * 1024; // keep in sync with MAX_FILE_BYTES on the server

const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${(bytes / 1024).toFixed(1)} KB`;

/** "File Dump" card on the Contact Detail page. Files are stored on the server (Postgres) per contact. */
export function ContactFilesCard({ contactId }: { contactId: string }) {
  const [files, setFiles] = useState<ContactFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const load = useCallback(async () => {
    try {
      setFiles(await fetchContactFiles(contactId));
    } catch (err) {
      toast({ variant: 'destructive', description: err instanceof Error ? err.message : 'Failed to load files' });
    } finally {
      setLoading(false);
    }
  }, [contactId, toast]);

  useEffect(() => { void load(); }, [load]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    e.target.value = ''; // allow re-selecting the same file later
    if (selected.length === 0) return;

    setUploading(true);
    try {
      for (const file of selected) {
        if (file.size > MAX_BYTES) {
          toast({ variant: 'destructive', description: `${file.name} is larger than 5 MB` });
          continue;
        }
        try {
          const saved = await uploadContactFile(contactId, file);
          setFiles((prev) => [saved, ...prev]);
        } catch (err) {
          toast({ variant: 'destructive', description: `${file.name}: ${err instanceof Error ? err.message : 'upload failed'}` });
        }
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      await deleteContactFile(contactId, fileId);
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
    } catch (err) {
      toast({ variant: 'destructive', description: err instanceof Error ? err.message : 'Failed to delete file' });
    }
  };

  return (
    <div className="mt-5 rounded-[22px] border border-card-border bg-card p-5">
      <div className="flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-xl bg-[#e8f4fd] text-[#3b82f6]">
          <Paperclip size={15} />
        </div>
        <div>
          <h3 className="text-sm font-bold tracking-tight">File Dump</h3>
          <p className="text-[10px] text-[#3b82f6]">{files.length} files</p>
        </div>
      </div>

      <div className="mt-4">
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-[#fbfaf6] px-4 py-6 text-center transition-colors hover:border-[#3b82f6] hover:bg-[#f0f7ff]">
          <input
            type="file"
            multiple
            accept=".pdf,.txt,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
          {uploading ? (
            <LoaderCircle size={16} className="animate-spin text-[#3b82f6]" />
          ) : (
            <>
              <Paperclip size={16} className="text-[#3b82f6]" />
              <span className="text-xs text-muted-foreground">
                Click to upload (PDF, TXT, Excel, Word, images, up to 5 MB each)
              </span>
            </>
          )}
        </label>
      </div>

      {loading && (
        <div className="mt-4 flex justify-center">
          <LoaderCircle size={14} className="animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-[#fbfaf6] px-3 py-2.5"
            >
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#e8f4fd] text-[#3b82f6]">
                <Paperclip size={14} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">{file.filename}</p>
                <p className="text-[10px] text-muted-foreground">{formatSize(file.size)}</p>
              </div>
              <a
                href={contactFileDownloadUrl(contactId, file.id)}
                aria-label={`Download ${file.filename}`}
                className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-[#e8f4fd] hover:text-[#3b82f6]"
              >
                <Download size={12} />
              </a>
              <button
                type="button"
                aria-label={`Delete ${file.filename}`}
                onClick={() => handleDeleteFile(file.id)}
                className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-[#fde8e8] hover:text-[#b44343]"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
