import type { ExtractionResult } from '@/lib/api';

export function ExtractionResultPanel({ result }: { result: ExtractionResult }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-3 font-bold text-sm">Extraction Result</h3>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Tasks Created</p>
          <p className="font-bold">{result.created.length}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Tasks Updated</p>
          <p className="font-bold">{result.updated.length}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Tasks Completed</p>
          <p className="font-bold">{result.completed.length}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Tasks Cancelled</p>
          <p className="font-bold">{result.cancelled.length}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Facts Saved</p>
          <p className="font-bold">{result.knowledgeUpserted.length}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Facts Suggested</p>
          <p className="font-bold">{result.knowledgeSuggested.length}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Facts Invalidated</p>
          <p className="font-bold">{result.knowledgeInvalidated.length}</p>
        </div>
      </div>

      {result.skipped.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 font-bold text-sm">Skipped Actions</p>
          <div className="space-y-2">
            {result.skipped.map((skip, i) => (
              <div key={i} className="rounded-lg bg-muted px-3 py-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold">{skip.kind}</span>
                  <span className="text-muted-foreground">{skip.type}</span>
                  {skip.ref && <span className="text-muted-foreground">({skip.ref})</span>}
                </div>
                <p className="mt-1 text-muted-foreground">{skip.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
