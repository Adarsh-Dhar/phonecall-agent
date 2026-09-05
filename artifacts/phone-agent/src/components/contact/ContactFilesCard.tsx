import { useState } from 'react';
import { LoaderCircle, Paperclip, X } from 'lucide-react';

/**
 * "File Dump" card on the Contact Detail page. There's no file-upload API
 * yet, so this just holds selected files in local component state — moved
 * out of ContactDetailPage.tsx as-is, no behavior change.
 */
export function ContactFilesCard() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    setUploading(true);
    try {
      // Since there's no file upload API yet, we'll just store them locally for now
      setFiles((prev) => [...prev, ...selectedFiles]);
      console.log('[ContactFilesCard] Files selected:', selectedFiles);
    } catch (err) {
      console.error('[ContactFilesCard] Failed to upload files:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
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
                Drop files here or click to upload (PDF, TXT, Excel, images)
              </span>
            </>
          )}
        </label>
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-3 rounded-xl border border-border bg-[#fbfaf6] px-3 py-2.5"
            >
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#e8f4fd] text-[#3b82f6]">
                <Paperclip size={14} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">{file.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteFile(index)}
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
