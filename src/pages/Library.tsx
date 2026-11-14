import { useState, useRef } from "react";
import { Icon } from "../components/Icon";
import { useAppStore } from "../stores/appStore";

export function LibraryPage() {
  const documents = useAppStore((s) => s.documents);
  const addDocument = useAppStore((s) => s.addDocument);
  const updateDocument = useAppStore((s) => s.updateDocument);
  const deleteDocument = useAppStore((s) => s.deleteDocument);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filter, setFilter] = useState("all");
  const [processing, setProcessing] = useState<string | null>(null);

  const handleUpload = async (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      const type = ({"pdf":"pdf","docx":"docx","doc":"docx","txt":"txt","pptx":"pptx","ppt":"pptx","png":"image","jpg":"image","jpeg":"image","gif":"image","mp3":"audio","wav":"audio","mp4":"video"} as Record<string,string>)[ext] ?? "text";

      const doc = addDocument({
        name: file.name,
        type: type as any,
        content: "",
        size: file.size,
      });
      setProcessing(doc.id);

      if (type === "txt" || type === "text") {
        const text = await file.text();
        updateDocument(doc.id, { content: text, extractedText: text, processed: true });
      } else {
        await new Promise((r) => setTimeout(r, 1500));
        updateDocument(doc.id, {
          extractedText: `[Content extracted from ${file.name}] This is a preview of the document content. Full text extraction requires a configured document processing service.`,
          processed: true,
        });
      }
      setProcessing(null);
    }
  };

  const filtered = filter === "all" ? documents : documents.filter((d) => d.type === filter);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">My Library</h1>
          <p className="text-sm text-text-secondary mt-0.5">Upload and manage your learning materials</p>
        </div>
        <button onClick={() => fileInputRef.current?.click()} className="btn-primary">
          <Icon name="upload" className="h-4 w-4" /> Upload
        </button>
        <input ref={fileInputRef} type="file" multiple accept=".pdf,.docx,.doc,.txt,.pptx,.ppt,.png,.jpg,.jpeg,.gif,.mp3,.wav,.mp4" onChange={(e) => handleUpload(e.target.files)} className="hidden" />
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {["all", "pdf", "docx", "txt", "image", "audio", "video"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`chip capitalize shrink-0 ${filter === f ? "chip-active" : ""}`}>
            {f === "all" ? "All" : f}
          </button>
        ))}
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("border-accent"); }}
        onDragLeave={(e) => e.currentTarget.classList.remove("border-accent")}
        onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove("border-accent"); handleUpload(e.dataTransfer.files); }}
        className="border-2 border-dashed border-border rounded-xl p-8 text-center transition-colors"
      >
        <Icon name="upload" className="h-8 w-8 text-text-tertiary mx-auto mb-2" />
        <p className="text-sm font-medium text-text-primary">Drop files here</p>
        <p className="text-xs text-text-tertiary mt-1">PDF, DOCX, TXT, PPTX, Images, Audio, Video</p>
      </div>

      {processing && (
        <div className="card flex items-center gap-3 px-4 py-3 border-accent/30 bg-accent-subtle">
          <Icon name="loader" className="h-4 w-4 animate-spin text-accent" />
          <span className="text-sm text-accent-text">Processing document...</span>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 py-10 text-center">
          <Icon name="folder" className="h-8 w-8 text-accent" />
          <p className="text-sm font-medium text-text-primary">No documents yet</p>
          <p className="text-xs text-text-tertiary">Upload PDFs, documents, images, or audio files.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.sort((a, b) => b.createdAt - a.createdAt).map((doc) => (
            <div key={doc.id} className="card card-interactive flex items-center gap-4 px-4 py-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                doc.type === "pdf" ? "bg-red-500/10 text-red-500" :
                doc.type === "image" ? "bg-blue-500/10 text-blue-500" :
                doc.type === "audio" ? "bg-purple-500/10 text-purple-500" :
                "bg-surface-2 text-text-secondary"
              }`}>
                <Icon name={doc.type === "pdf" ? "file-text" : doc.type === "image" ? "image" : doc.type === "audio" ? "headphones" : "file-text"} className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-text-primary">{doc.name}</div>
                <div className="text-xs text-text-tertiary">
                  {doc.type.toUpperCase()} &middot; {doc.size ? `${(doc.size / 1024).toFixed(0)} KB` : ""} &middot; {doc.processed ? "Processed" : "Processing..."}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <button className="btn-ghost p-2 text-text-tertiary" title="Ask AI about this">
                  <Icon name="brain" className="h-4 w-4" />
                </button>
                <button onClick={() => deleteDocument(doc.id)} className="btn-ghost p-2 text-text-tertiary" title="Delete">
                  <Icon name="trash" className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
