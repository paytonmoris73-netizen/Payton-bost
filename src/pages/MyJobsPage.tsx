import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { Job, User } from "../lib/types";

interface Props { user: User; }

function money(n: number): string { return "$" + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
function fmtDate(iso: string): string { return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" }); }

function statusBadge(status: Job["status"]) {
  const map = { open: "badge-blue", in_progress: "badge-orange", completed: "badge-green" };
  const labels = { open: "Open", in_progress: "In Progress", completed: "Completed" };
  return <span className={`badge ${map[status]}`}>{labels[status]}</span>;
}

export function MyJobsPage({ user }: Props) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "open" | "in_progress" | "completed">("all");

  useEffect(() => {
    api.getJobs(user.id)
      .then(setJobs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user.id]);

  async function handleStatus(job: Job, status: Job["status"]) {
    await api.updateJob(job.id, { status });
    const j = await api.refreshJobs(user.id);
    setJobs(j);
  }

  const shown = jobs.filter(j => filter === "all" || j.status === filter);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">My Jobs</div>
          <div className="page-subtitle">Work assigned to you</div>
        </div>
      </div>

      <div className="tab-bar">
        {([["all","All"], ["open","Open"], ["in_progress","In Progress"], ["completed","Done"]] as [string, string][]).map(([v, l]) => (
          <button key={v} className={`tab-btn${filter === v ? " active" : ""}`} onClick={() => setFilter(v as typeof filter)}>
            {l}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40 }}><div className="spinner" style={{ margin: "0 auto" }} /></div>
      ) : shown.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h3>No jobs {filter !== "all" ? "with this status" : "assigned to you"}</h3>
          <p>Your manager will assign work here</p>
        </div>
      ) : (
        <div className="jobs-grid">
          {shown.map(job => (
            <div key={job.id} className={`job-card${job.status === "completed" ? " completed" : ""}`}>
              <div className="job-card-header">
                <div className="job-card-badges">{statusBadge(job.status)}</div>
                <span className="job-category">{job.category}</span>
              </div>
              <div className="job-title">{job.title}</div>
              {job.description && <div className="job-desc">{job.description}</div>}
              <div className="job-meta">
                <div className="job-pay">
                  {job.payAmount > 0 ? (
                    <>
                      <span className="job-pay-amount" style={{ color: "var(--success)" }}>{money(job.payAmount)}</span>
                      <span className="job-pay-type">{job.payType === "hourly" ? "/hr" : " fixed"}</span>
                    </>
                  ) : (
                    <span style={{ color: "var(--text-muted)", fontSize: 12 }}>No pay specified</span>
                  )}
                </div>
                {job.dueDate && <span className="job-due">Due {fmtDate(job.dueDate)}</span>}
              </div>
              <div className="job-actions">
                {job.status === "open" && (
                  <button className="btn btn-sm btn-primary" onClick={() => handleStatus(job, "in_progress")}>Start Working</button>
                )}
                {job.status === "in_progress" && (
                  <button className="btn btn-sm" style={{ background: "var(--success-light)", color: "var(--success-text)", border: "none", cursor: "pointer" }} onClick={() => handleStatus(job, "completed")}>
                    ✓ Mark Complete
                  </button>
                )}
                {job.status === "completed" && (
                  <span className="badge badge-green">✓ Completed {job.completedAt ? fmtDate(job.completedAt) : ""}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
