import { useCallback, useEffect, useRef, useState } from 'react';
import adminApi from './adminApi.js';

/* ─── Constants ─────────────────────────────────────────────────────────── */
const STATUS_LABELS = {
  Draft: { label: 'Draft', color: '#6b7280' },
  Submitted: { label: 'Submitted', color: '#3b82f6' },
  UnderReview: { label: 'Under Review', color: '#f59e0b' },
  CorrectionRequested: { label: 'Correction Requested', color: '#f97316' },
  Approved: { label: 'Approved', color: '#10b981' },
  Rejected: { label: 'Rejected', color: '#ef4444' },
  AdmissionConfirmed: { label: 'Admission Confirmed', color: '#7c3aed' },
};

const DOCUMENT_SLOTS = [
  { key: 'marksheet10', label: 'Class 10 Marksheet' },
  { key: 'marksheet12', label: 'Class 12 Marksheet' },
  { key: 'graduationMarksheet', label: 'Graduation Marksheet' },
  { key: 'idProof', label: 'ID Proof (Aadhaar / Passport)' },
  { key: 'photograph', label: 'Photograph' },
  { key: 'categoryCertificate', label: 'Category Certificate' },
];

const FORM_SECTIONS = [
  { key: 'personal', label: 'Personal & Course' },
  { key: 'address', label: 'Address' },
  { key: 'family', label: 'Family & Guardian' },
  { key: 'citizenship', label: 'Citizenship' },
  { key: 'academic', label: 'Academics' },
  { key: 'other', label: 'Other Details' },
  { key: 'documents', label: 'Documents' },
];

const COURSE_NAMES = {
  btech: 'B.Tech', bhm: 'BHM', bba: 'BBA', bca: 'BCA', 'bba-llb': 'BBA LLB',
  mca: 'MCA', mba: 'MBA', 'mba-gm': 'MBA (Global Management)', mtech: 'M.Tech',
};

function fmt(val) { return val || '—'; }
function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/* ─── Status Badge ───────────────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const info = STATUS_LABELS[status] || { label: status, color: '#6b7280' };
  return (
    <span style={{
      display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: 12,
      fontWeight: 600, background: `${info.color}1a`, color: info.color, border: `1px solid ${info.color}44`,
    }}>
      {info.label}
    </span>
  );
}

/* ─── Toast ──────────────────────────────────────────────────────────────── */
function Toast({ toasts }) {
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: t.type === 'error' ? '#fee2e2' : '#d1fae5',
          color: t.type === 'error' ? '#b91c1c' : '#065f46',
          border: `1px solid ${t.type === 'error' ? '#fca5a5' : '#6ee7b7'}`,
          padding: '10px 16px', borderRadius: 8, minWidth: 240, fontWeight: 500, fontSize: 14,
        }}>
          {t.message}
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);
  return { toasts, push };
}

/* ─── Document Viewer Modal ──────────────────────────────────────────────── */
function DocumentViewerModal({ appId, slot, slotLabel, onClose }) {
  const url = adminApi.getDocumentStreamUrl(appId, slot);
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 10, width: '90vw', maxWidth: 900, height: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #e5e7eb' }}>
          <strong style={{ fontSize: 15 }}>{slotLabel}</strong>
          <div style={{ display: 'flex', gap: 10 }}>
            <a href={url} download style={{ background: '#2563eb', color: '#fff', padding: '6px 14px', borderRadius: 6, fontSize: 13, textDecoration: 'none', fontWeight: 500 }}>Download</a>
            <button type="button" onClick={onClose} style={{ background: '#f3f4f6', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontWeight: 600 }}>✕ Close</button>
          </div>
        </div>
        <iframe src={url} title={slotLabel} style={{ flex: 1, border: 'none', width: '100%' }} />
      </div>
    </div>
  );
}

/* ─── Correction Flag Modal ──────────────────────────────────────────────── */
function CorrectionFlagModal({ appId, onClose, onDone, toast }) {
  const [selected, setSelected] = useState([]);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const toggle = (key) => setSelected(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);

  const submit = async () => {
    if (selected.length === 0) {
      toast('Select at least one section to flag.', 'error');
      return;
    }
    setLoading(true);
    try {
      await adminApi.requestCorrection(appId, { flaggedSections: selected, comment });
      toast('Correction request sent to applicant.');
      onDone();
    } catch (e) {
      toast(e?.message || 'Failed to request correction.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 12, width: 480, padding: 28 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 17 }}>Request Correction</h3>
        <p style={{ color: '#6b7280', fontSize: 13, margin: '0 0 16px' }}>Select sections the applicant must correct. Only selected sections will be unlocked.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {FORM_SECTIONS.map(sec => (
            <button
              key={sec.key} type="button"
              onClick={() => toggle(sec.key)}
              style={{
                padding: '6px 14px', borderRadius: 20, fontSize: 13, cursor: 'pointer', fontWeight: 500,
                background: selected.includes(sec.key) ? '#2563eb' : '#f3f4f6',
                color: selected.includes(sec.key) ? '#fff' : '#374151',
                border: selected.includes(sec.key) ? '1px solid #2563eb' : '1px solid #d1d5db',
              }}
            >
              {sec.label}
            </button>
          ))}
        </div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Comment (shown to applicant)</label>
        <textarea
          value={comment} onChange={e => setComment(e.target.value)}
          rows={3} placeholder="e.g. Please check your 10th percentage against your marksheet."
          style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, boxSizing: 'border-box', resize: 'vertical' }}
        />
        <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={{ padding: '8px 18px', background: '#f3f4f6', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
          <button type="button" onClick={submit} disabled={loading} style={{ padding: '8px 18px', background: '#f97316', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
            {loading ? 'Sending…' : 'Send Correction Request'}
          </button>
        </div>
      </div>
    </div>
  );
}

function btnStyle(color) {
  return {
    background: `${color}1a`, border: `1px solid ${color}44`, color,
    padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
  };
}
function DocStatusBadge({ status }) {
  const colors = { uploaded: '#6b7280', verified: '#10b981', flagged: '#ef4444' };
  const c = colors[status] || '#6b7280';
  return <span style={{ fontSize: 11, fontWeight: 600, background: `${c}1a`, color: c, padding: '2px 8px', borderRadius: 10, border: `1px solid ${c}44` }}>{status}</span>;
}
function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b7280', marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );
}
function Field({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 13 }}>
      <span style={{ color: '#6b7280', minWidth: 140, flexShrink: 0 }}>{label}</span>
      <span style={{ color: '#111827', fontWeight: 500 }}>{value}</span>
    </div>
  );
}

/* ─── Application Detail Panel ───────────────────────────────────────────── */
function AdminApplicationDetail({ appId, onClose, onStatusChanged, toast }) {
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewDoc, setViewDoc] = useState(null);
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState({});
  const [decisionReason, setDecisionReason] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getApplication(appId);
      setApp(res.application || res);
    } catch (e) {
      toast(e?.message || 'Failed to load application.', 'error');
    } finally { setLoading(false); }
  }, [appId, toast]);

  useEffect(() => { load(); }, [load]);

  const handleDecision = async (decision) => {
    if (decision === 'Rejected' && !decisionReason.trim()) {
      toast('A reason is mandatory when rejecting.', 'error');
      return;
    }
    setDecisionLoading(true);
    try {
      await adminApi.recordDecision(appId, { decision, reason: decisionReason });
      toast(`Application ${decision}.`);
      onStatusChanged();
      load();
    } catch (e) {
      toast(e?.message || 'Decision failed.', 'error');
    } finally { setDecisionLoading(false); }
  };

  const handleVerifyDoc = async (slot, status) => {
    setVerifyLoading(prev => ({ ...prev, [slot]: true }));
    try {
      await adminApi.verifyDocument(appId, slot, { status });
      toast(`Document marked as ${status}.`);
      load();
    } catch (e) {
      toast(e?.message || 'Verification failed.', 'error');
    } finally { setVerifyLoading(prev => ({ ...prev, [slot]: false })); }
  };

  if (loading) {
    return (
      <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 640, background: '#fff', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 900 }}>
        <span style={{ color: '#6b7280' }}>Loading details…</span>
      </div>
    );
  }
  if (!app) return null;

  const documents = app.documents || {};
  const canDecide = ['Submitted', 'UnderReview'].includes(app.status);
  const canFlag = ['Submitted', 'UnderReview'].includes(app.status);

  return (
    <>
      <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 640, background: '#fff', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)', overflowY: 'auto', zIndex: 900 }}>
        {/* Header */}
        <div style={{ position: 'sticky', top: 0, background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{app.fullName || app.full_name || '—'}</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{app.applicationNo || app.application_no || 'Draft'} · {app.programName || COURSE_NAMES[app.programId || app.course_id] || app.programId || app.course_id}</div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <StatusBadge status={app.status} />
            <button type="button" onClick={onClose} style={{ background: '#f3f4f6', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontWeight: 600 }}>✕</button>
          </div>
        </div>

        <div style={{ padding: 24 }}>
          {/* Personal Info */}
          <Section title="Personal Information">
            <Field label="Full Name" value={fmt(app.fullName || app.full_name)} />
            <Field label="Email" value={fmt(app.email)} />
            <Field label="Mobile" value={fmt(app.mobile)} />
            <Field label="Date of Birth" value={fmt(app.dob)} />
            <Field label="Gender" value={fmt(app.gender)} />
            <Field label="Category" value={fmt(app.category)} />
            <Field label="Programme" value={app.programName || COURSE_NAMES[app.programId || app.course_id] || fmt(app.programId || app.course_id)} />
            <Field label="Stream" value={fmt(app.streamName || app.streamId || app.stream)} />
          </Section>

          {/* Documents */}
          <Section title="Documents (GridFS Stream)">
            <div style={{ display: 'grid', gap: 10 }}>
              {DOCUMENT_SLOTS.map(({ key, label }) => {
                const doc = documents[key];
                const uploadStatus = doc?.upload_status || doc?.status;
                return (
                  <div key={key} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>
                        {doc ? (
                          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                            {doc.name || doc.original_filename} · {doc.size ? `${(doc.size / 1024).toFixed(0)} KB` : ''} · Uploaded {fmtDate(doc.uploadedAt || doc.uploaded_at)}
                          </div>
                        ) : (
                          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Not uploaded</div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        {uploadStatus && <DocStatusBadge status={uploadStatus} />}
                        {doc && (
                          <>
                            <button type="button" onClick={() => setViewDoc({ slot: key, label })} style={btnStyle('#2563eb')}>View</button>
                            <button type="button" disabled={verifyLoading[key]} onClick={() => handleVerifyDoc(key, 'verified')} style={btnStyle('#10b981')}>Verify</button>
                            <button type="button" disabled={verifyLoading[key]} onClick={() => handleVerifyDoc(key, 'flagged')} style={btnStyle('#ef4444')}>Flag</button>
                          </>
                        )}
                      </div>
                    </div>
                    {doc?.adminComment && <div style={{ marginTop: 6, fontSize: 12, color: '#b45309', background: '#fef3c7', padding: '4px 8px', borderRadius: 4 }}>Note: {doc.adminComment}</div>}
                  </div>
                );
              })}
            </div>
          </Section>

          {/* Academic Summary */}
          {(app.tenthPercent != null || app.academic?.tenth?.percent != null) && (
            <Section title="Academic Summary">
              <Field label="10th %" value={fmt(app.tenthPercent ?? app.academic?.tenth?.percent)} />
              <Field label="12th Status" value={fmt(app.class12Status ?? app.academic?.twelfth?.class12Status)} />
              <Field label="12th %" value={fmt(app.twelfthPercent ?? app.academic?.twelfth?.percent)} />
              {(app.degreeName || app.academic?.degree?.name) && <Field label="Degree" value={fmt(app.degreeName ?? app.academic?.degree?.name)} />}
            </Section>
          )}

          {/* Timeline */}
          <Section title="Timeline & Status">
            <Field label="Submitted At" value={fmtDate(app.submittedAt || app.submitted_at)} />
            <Field label="Status Changed" value={fmtDate(app.statusChangedAt || app.status_changed_at)} />
            {(app.decision?.reason || app.decisionReason) && <Field label="Decision Reason" value={app.decision?.reason || app.decisionReason} />}
            {app.flaggedSections?.length > 0 && <Field label="Flagged Sections" value={app.flaggedSections.join(', ')} />}
          </Section>

          {/* Actions */}
          <div style={{ marginTop: 24, borderTop: '1px solid #e5e7eb', paddingTop: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Admin Actions</div>

            {canFlag && (
              <button type="button" onClick={() => setShowCorrectionModal(true)} style={{ display: 'block', width: '100%', padding: '10px', marginBottom: 10, background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, color: '#c2410c', fontWeight: 600, cursor: 'pointer', textAlign: 'center' }}>
                🚩 Request Correction from Applicant
              </button>
            )}

            {canDecide && (
              <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Rejection reason (required if rejecting)</label>
                <textarea
                  value={decisionReason} onChange={e => setDecisionReason(e.target.value)}
                  rows={2} placeholder="State the reason for rejection…"
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, boxSizing: 'border-box', resize: 'vertical' }}
                />
                <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                  <button type="button" disabled={decisionLoading} onClick={() => handleDecision('Approved')} style={{ flex: 1, padding: '10px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
                    ✅ Approve
                  </button>
                  <button type="button" disabled={decisionLoading} onClick={() => handleDecision('Rejected')} style={{ flex: 1, padding: '10px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
                    ❌ Reject
                  </button>
                </div>
              </div>
            )}

            {!canDecide && !canFlag && (
              <div style={{ color: '#6b7280', fontSize: 13, background: '#f9fafb', padding: '10px 14px', borderRadius: 8 }}>
                No actions available for status: <StatusBadge status={app.status} />
              </div>
            )}
          </div>
        </div>
      </div>

      {viewDoc && (
        <DocumentViewerModal appId={appId} slot={viewDoc.slot} slotLabel={viewDoc.label} onClose={() => setViewDoc(null)} />
      )}

      {showCorrectionModal && (
        <CorrectionFlagModal
          appId={appId}
          toast={toast}
          onClose={() => setShowCorrectionModal(false)}
          onDone={() => { setShowCorrectionModal(false); onStatusChanged(); load(); }}
        />
      )}
    </>
  );
}

/* ─── Admin Dashboard Stats ──────────────────────────────────────────────── */
function AdminDashboard({ onNavigate }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { push: toast, toasts } = useToast();

  useEffect(() => {
    adminApi.getDashboardStats()
      .then(res => setStats(res.stats || res))
      .catch(error => toast(error?.message || 'Failed to load dashboard stats.', 'error'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>Loading dashboard…</div>;

  const cards = [
    { label: 'Total Applications', value: stats?.total ?? 0, color: '#2563eb' },
    { label: 'Pending Review', value: stats?.pendingReview ?? 0, color: '#f59e0b' },
    { label: 'Corrections Requested', value: stats?.correctionRequested ?? 0, color: '#f97316' },
    { label: 'Approved', value: stats?.approved ?? 0, color: '#10b981' },
    { label: 'Rejected', value: stats?.rejected ?? 0, color: '#ef4444' },
  ];

  const courseBreakdown = Object.entries(stats?.byCourse || {});

  return (
    <div>
      <Toast toasts={toasts} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 32 }}>
        {cards.map(c => (
          <div key={c.label} style={{ flex: '1 1 160px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: c.color }}>{c.value}</div>
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{c.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 300px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>By Course</div>
          {courseBreakdown.length === 0 ? <div style={{ color: '#9ca3af', fontSize: 13 }}>No data yet.</div> : (
            courseBreakdown.map(([course, count]) => (
              <div key={course} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6', fontSize: 14 }}>
                <span>{COURSE_NAMES[course] || course}</span>
                <span style={{ fontWeight: 700 }}>{count}</span>
              </div>
            ))
          )}
        </div>
        <div style={{ flex: '1 1 300px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>By Status</div>
          {Object.entries(stats?.byStatus || {}).map(([status, count]) => (
            <div key={status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f3f4f6', fontSize: 14 }}>
              <StatusBadge status={status} />
              <span style={{ fontWeight: 700 }}>{count}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ marginTop: 24, textAlign: 'right' }}>
        <button type="button" onClick={() => onNavigate('list')} style={{ padding: '10px 24px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
          View All Applications →
        </button>
      </div>
    </div>
  );
}

/* ─── Admin Applications List ────────────────────────────────────────────── */
function AdminApplicationsList({ onSelect }) {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [filters, setFilters] = useState({ status: '', course: '', search: '' });
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchTimer = useRef(null);
  const { push: toast, toasts } = useToast();

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await adminApi.listApplications({ ...filters, search: debouncedSearch, page });
      const data = res;
      setApps(data.applications || []);
      setPagination({ page: data.page || page, total: data.total || 0, totalPages: data.totalPages || 1 });
    } catch (error) {
      toast(error?.message || 'Failed to load applications.', 'error');
    } finally { setLoading(false); }
  }, [filters, debouncedSearch, toast]);

  useEffect(() => { load(1); }, [load]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(val), 400);
  };

  const exportUrl = adminApi.getExportUrl({ status: filters.status, course: filters.course });

  return (
    <div>
      <Toast toasts={toasts} />
      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="search" placeholder="Search by name or application no…"
          onChange={handleSearchChange}
          style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, minWidth: 240 }}
        />
        <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13 }}>
          <option value="">All Statuses</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={filters.course} onChange={e => setFilters(f => ({ ...f, course: e.target.value }))} style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13 }}>
          <option value="">All Courses</option>
          {Object.entries(COURSE_NAMES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <a href={exportUrl} download="applications-export.csv" style={{ marginLeft: 'auto', padding: '8px 16px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#374151', textDecoration: 'none' }}>
          ⬇ Export CSV
        </a>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>Loading…</div>
      ) : apps.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>No applications found.</div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['App No', 'Name', 'Programme', 'Category', 'Status', 'Submitted At', 'Action'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {apps.map((app, i) => (
                <tr key={app.id} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: 12 }}>{app.applicationNo || app.application_no || '—'}</td>
                  <td style={{ padding: '10px 14px', fontWeight: 500 }}>{app.fullName || app.full_name || '—'}</td>
                  <td style={{ padding: '10px 14px' }}>{COURSE_NAMES[app.programId || app.course_id] || app.programId || app.course_id || '—'}</td>
                  <td style={{ padding: '10px 14px' }}>{app.category || '—'}</td>
                  <td style={{ padding: '10px 14px' }}><StatusBadge status={app.status} /></td>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: '#6b7280' }}>{fmtDate(app.submittedAt || app.submitted_at)}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <button type="button" onClick={() => onSelect(app.id)} style={{ padding: '5px 12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Review</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div style={{ padding: '12px 20px', borderTop: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: '#6b7280' }}>Page {pagination.page} of {pagination.totalPages} · {pagination.total} total</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" disabled={pagination.page <= 1} onClick={() => load(pagination.page - 1)} style={{ padding: '5px 12px', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer' }}>‹ Prev</button>
                <button type="button" disabled={pagination.page >= pagination.totalPages} onClick={() => load(pagination.page + 1)} style={{ padding: '5px 12px', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer' }}>Next ›</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Admin Portal Shell ─────────────────────────────────────────────────── */
export default function AdminPortal({ user, onLogout }) {
  const [view, setView] = useState('dashboard'); // 'dashboard' | 'list'
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [listKey, setListKey] = useState(0); // force re-mount to refresh list
  const { push: toast, toasts } = useToast();

  const handleSelect = (id) => setSelectedAppId(id);
  const handleStatusChanged = () => {
    setListKey(k => k + 1);
    if (view !== 'list') setView('list');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <Toast toasts={toasts} />
      {/* Top Nav */}
      <header style={{ background: '#1e3a5f', color: '#fff', padding: '0 32px', display: 'flex', alignItems: 'center', height: 60, gap: 24 }}>
        <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: '0.02em' }}>IEM Admin Portal</div>
        <nav style={{ display: 'flex', gap: 4, flex: 1 }}>
          {[{ key: 'dashboard', label: '📊 Dashboard' }, { key: 'list', label: '📋 Applications' }].map(tab => (
            <button key={tab.key} type="button" onClick={() => setView(tab.key)} style={{
              padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13,
              background: view === tab.key ? 'rgba(255,255,255,0.15)' : 'transparent',
              color: view === tab.key ? '#fff' : 'rgba(255,255,255,0.65)',
            }}>{tab.label}</button>
          ))}
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>Admin: {user?.email || user?.name}</span>
          <button type="button" onClick={onLogout} style={{ padding: '5px 14px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>Sign Out</button>
        </div>
      </header>

      {/* Main */}
      <main style={{ padding: '32px', maxWidth: 1300, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#111827' }}>
            {view === 'dashboard' ? 'Dashboard Overview' : 'All Applications'}
          </h1>
        </div>
        {view === 'dashboard' ? (
          <AdminDashboard onNavigate={setView} />
        ) : (
          <AdminApplicationsList key={listKey} onSelect={handleSelect} />
        )}
      </main>

      {/* Detail Slide-in */}
      {selectedAppId && (
        <>
          <div onClick={() => setSelectedAppId(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 800 }} />
          <AdminApplicationDetail
            appId={selectedAppId}
            onClose={() => setSelectedAppId(null)}
            onStatusChanged={handleStatusChanged}
            toast={toast}
          />
        </>
      )}
    </div>
  );
}
