import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { User, Announcement } from "../lib/types";
import { Modal } from "../components/Modal";

interface Props { user: User; }

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function AnnouncementsPage({ user }: Props) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editAnn, setEditAnn] = useState<Announcement | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pinned, setPinned] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isOwner = user.role === "owner";

  useEffect(() => { load(); }, []);

  async function load() {
    try { setAnnouncements(await api.getAnnouncements()); } catch {/* ignore */}
    finally { setLoading(false); }
  }

  function openAdd() { setTitle(""); setBody(""); setPinned(false); setError(""); setShowAdd(true); }
  function openEdit(a: Announcement) { setTitle(a.title); setBody(a.body); setPinned(a.pinned); setEditAnn(a); setError(""); }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true); setError("");
    try {
      if (editAnn) {
        await api.updateAnnouncement(editAnn.id, { title: title.trim(), body: body.trim(), pinned });
        setEditAnn(null);
      } else {
        await api.createAnnouncement({ title: title.trim(), body: body.trim(), authorId: user.id, pinned });
        setShowAdd(false);
      }
      setAnnouncements(await api.refreshAnnouncements());
    } catch (err) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this announcement?")) return;
    await api.deleteAnnouncement(id);
    setAnnouncements(await api.refreshAnnouncements());
  }

  async function togglePin(a: Announcement) {
    await api.updateAnnouncement(a.id, { pinned: !a.pinned });
    setAnnouncements(await api.refreshAnnouncements());
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Announcements</div>
          <div className="page-subtitle">{isOwner ? "Post updates and notices to your team" : "Company news and updates"}</div>
        </div>
        {isOwner && <button className="btn btn-primary" onClick={openAdd}>+ Post Announcement</button>}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40 }}><div className="spinner" style={{ margin: "0 auto" }} /></div>
      ) : announcements.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📢</div>
          <h3>No announcements yet</h3>
          <p>{isOwner ? "Post your first announcement to let the team know what's going on" : "Your manager hasn't posted anything yet"}</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {announcements.map(a => (
            <div key={a.id} className="ann-card" style={{ background: "var(--surface)", border: `1px solid ${a.pinned ? "rgba(255,122,61,0.35)" : "var(--border)"}`, borderRadius: "var(--radius-lg)", padding: "20px 24px", boxShadow: a.pinned ? "0 0 0 2px rgba(255,122,61,0.1)" : "var(--shadow-xs)" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {a.pinned && <span className="badge badge-blue" style={{ fontSize: 11 }}>📌 Pinned</span>}
                  <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.2px" }}>{a.title}</div>
                </div>
                {isOwner && (
                  <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                    <button className="btn btn-ghost btn-sm" title={a.pinned ? "Unpin" : "Pin"} onClick={() => togglePin(a)} style={{ fontSize: 14 }}>
                      {a.pinned ? "📌" : "📍"}
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(a)}>Edit</button>
                    <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => handleDelete(a.id)}>×</button>
                  </div>
                )}
              </div>
              {a.body && (
                <div style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 12, whiteSpace: "pre-wrap" }}>{a.body}</div>
              )}
              <div style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", gap: 12 }}>
                <span>By <strong style={{ color: "var(--text-secondary)" }}>{a.authorName}</strong></span>
                <span>{fmtDateTime(a.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {(showAdd || editAnn) && (
        <Modal title={editAnn ? "Edit Announcement" : "New Announcement"}
          onClose={() => { setShowAdd(false); setEditAnn(null); }}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => { setShowAdd(false); setEditAnn(null); }}>Cancel</button>
              <button className="btn btn-primary" form="ann-form" type="submit" disabled={saving}>
                {saving ? "Saving…" : editAnn ? "Save" : "Post"}
              </button>
            </>
          }
        >
          <form id="ann-form" onSubmit={handleSave}>
            <div className="form-group">
              <label>Title *</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Office closed Friday" autoFocus required />
            </div>
            <div className="form-group">
              <label>Message</label>
              <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Share details with your team…" rows={4}
                style={{ width: "100%", padding: "9px 12px", border: "1.5px solid var(--border)", borderRadius: "var(--radius)", fontSize: 14, fontFamily: "inherit", resize: "vertical" }} />
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer", userSelect: "none" }}>
              <input type="checkbox" checked={pinned} onChange={e => setPinned(e.target.checked)} style={{ width: 15, height: 15 }} />
              Pin to top
            </label>
            {error && <p className="error-msg">{error}</p>}
          </form>
        </Modal>
      )}
    </div>
  );
}
