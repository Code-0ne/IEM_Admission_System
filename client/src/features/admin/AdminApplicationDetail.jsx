import { useCallback, useEffect, useState } from 'react';
import adminApi from './adminApi.js';

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

function DocStatusBadge({ status }) {
  const colors = { uploaded: '#6b7280', verified: '#10b981', flagged: '#ef4444' };
  const c = colors[status] || '#6b7280';
  return (
    <span style={{ fontSize: 11, fontWeight: 600, background: `${c}1a`, color: c, padding: '2px 8px', borderRadius: 10, border: `1px solid ${c}44` }}>
      {status}
    </span>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b7280', marginBottom: 10 }}>
        {title}
      </div>
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

function btnStyle(color) {
  return {
    background: `${color}1a`, border: `1px solid ${color}44`, color,
    padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
  };
}

export function DocumentViewerModal({ appId, slot, slotLabel, onClose }) {
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

export function CorrectionFlagModal({ appId, onClose, onDone, onToast }) {
  const [selected, setSelected] = useState([]);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const toggle = (key) => setSelected(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);

  const submit = async () => {
    if (selected.length === 0) {
      if (onToast) onToast('Select at least one section to flag.', 'error');
      return;
    }
    setLoading(true);
    try {
      await adminApi.requestCorrection(appId, { flaggedSections: selected, comment });
      if (onToast) onToast('Correction request sent to applicant.');
      onDone();
    } catch (e) {
      if (onToast) onToast(e?.message || 'Failed to request correction.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 12, width: 480, padding: 28 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 17 }}>Request Correction</h3>
        <p style={{ color: '#6b7280', fontSize: 13, margin: '0 0 16px' }}>
          Select sections the applicant must correct. Only selected sections will be unlocked for editing.
        </p>
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
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Reviewer Comment (shown to applicant)</label>
        <textarea
          value={comment} onChange={e => setComment(e.target.value)}
          rows={3} placeholder="e.g. Please check your 10th marksheet and correct percentage."
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

export function AdminApplicationDetail({ appId, onClose, onStatusChanged, onToast }) {
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewDoc, setViewDoc] = useState(null);
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState({});
  const [decisionReason, setDecisionReason] = useState('');

  const toast = onToast || ((msg) => console.log(msg));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getApplication(appId);
      setApp(res.application || res);
    } catch (e) {
      toast(e?.message || 'Failed to load application.', 'error');
    } finally {
      setLoading(false);
    }
  }, [appId]);

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
      if (onStatusChanged) onStatusChanged();
      load();
    } catch (e) {
      toast(e?.message || 'Decision failed.', 'error');
    } finally {
      setDecisionLoading(false);
    }
  };

  const handleVerifyDoc = async (slot, status) => {
    setVerifyLoading(prev => ({ ...prev, [slot]: true }));
    try {
      await adminApi.verifyDocument(appId, slot, { status });
      toast(`Document marked as ${status}.`);
      load();
    } catch (e) {
      toast(e?.message || 'Verification failed.', 'error');
    } finally {
      setVerifyLoading(prev => ({ ...prev, [slot]: false }));
    }
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
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
              {app.applicationNo || app.application_no || 'Draft'} · {app.programName || COURSE_NAMES[app.programId || app.course_id] || app.programId || app.course_id}
            </div>
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
                    {doc?.adminComment && (
                      <div style={{ marginTop: 6, fontSize: 12, color: '#b45309', background: '#fef3c7', padding: '4px 8px', borderRadius: 4 }}>
                        Note: {doc.adminComment}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Section>

          {/* Academic Summary */}
          <Section title="Academic Summary">
            <Field label="10th %" value={fmt(app.tenthPercent ?? app.academic?.tenth?.percent)} />
            <Field label="12th Status" value={fmt(app.class12Status ?? app.academic?.twelfth?.class12Status)} />
            <Field label="12th %" value={fmt(app.twelfthPercent ?? app.academic?.twelfth?.percent)} />
            {(app.degreeName || app.academic?.degree?.name) && (
              <Field label="Degree" value={fmt(app.degreeName ?? app.academic?.degree?.name)} />
            )}
          </Section>

          {/* Timeline */}
          <Section title="Timeline & Decisions">
            <Field label="Submitted At" value={fmtDate(app.submittedAt || app.submitted_at)} />
            <Field label="Status Changed" value={fmtDate(app.statusChangedAt || app.status_changed_at)} />
            {(app.decision?.reason || app.decisionReason) && (
              <Field label="Decision Reason" value={app.decision?.reason || app.decisionReason} />
            )}
            {app.flaggedSections?.length > 0 && (
              <Field label="Flagged Sections" value={app.flaggedSections.join(', ')} />
            )}
          </Section>

          {/* Actions */}
          <div style={{ marginTop: 24, borderTop: '1px solid #e5e7eb', paddingTop: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Admin Actions</div>

            {canFlag && (
              <button
                type="button"
                onClick={() => setShowCorrectionModal(true)}
                style={{ display: 'block', width: '100%', padding: 10, marginBottom: 10, background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, color: '#c2410c', fontWeight: 600, cursor: 'pointer', textAlign: 'center' }}
              >
                🚩 Request Correction from Applicant
              </button>
            )}

            {canDecide && (
              <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                  Rejection reason <span style={{ color: '#ef4444' }}>(mandatory if rejecting)</span>
                </label>
                <textarea
                  value={decisionReason} onChange={e => setDecisionReason(e.target.value)}
                  rows={2} placeholder="State reason for rejection…"
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, boxSizing: 'border-box', resize: 'vertical' }}
                />
                <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                  <button type="button" disabled={decisionLoading} onClick={() => handleDecision('Approved')} style={{ flex: 1, padding: 10, background: '#10b981', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
                    ✅ Approve
                  </button>
                  <button type="button" disabled={decisionLoading} onClick={() => handleDecision('Rejected')} style={{ flex: 1, padding: 10, background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
                    ❌ Reject
                  </button>
                </div>
              </div>
            )}

            {!canDecide && !canFlag && (
              <div style={{ color: '#6b7280', fontSize: 13, background: '#f9fafb', padding: '10px 14px', borderRadius: 8 }}>
                No further actions available for status: <StatusBadge status={app.status} />
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
          onToast={toast}
          onClose={() => setShowCorrectionModal(false)}
          onDone={() => { setShowCorrectionModal(false); if (onStatusChanged) onStatusChanged(); load(); }}
        />
      )}
    </>
  );
}

export default AdminApplicationDetail;
