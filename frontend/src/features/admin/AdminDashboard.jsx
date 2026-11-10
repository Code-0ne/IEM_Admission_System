import { useEffect, useState } from 'react';
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

const COURSE_NAMES = {
  btech: 'B.Tech', bhm: 'BHM', bba: 'BBA', bca: 'BCA', 'bba-llb': 'BBA LLB',
  mca: 'MCA', mba: 'MBA', 'mba-gm': 'MBA (Global Management)', mtech: 'M.Tech',
};

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

export function AdminDashboard({ onNavigate }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.getDashboardStats()
      .then(res => setStats(res.stats || res))
      .catch(err => setError(err?.message || 'Failed to load dashboard statistics.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>Loading dashboard…</div>;
  if (error) return <div style={{ padding: 20, color: '#b91c1c', background: '#fee2e2', borderRadius: 8 }}>{error}</div>;

  const cards = [
    { label: 'Total Applications', value: stats?.total ?? 0, color: '#2563eb' },
    { label: 'Pending Review', value: stats?.pendingReview ?? 0, color: '#f59e0b' },
    { label: 'Corrections Requested', value: stats?.correctionRequested ?? 0, color: '#f97316' },
    { label: 'Approved', value: stats?.approved ?? 0, color: '#10b981' },
    { label: 'Rejected', value: stats?.rejected ?? 0, color: '#ef4444' },
  ];

  return (
    <div>
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
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Applications by Course</div>
          {Object.entries(stats?.byCourse || {}).length === 0 ? (
            <div style={{ color: '#9ca3af', fontSize: 13 }}>No applications recorded yet.</div>
          ) : (
            Object.entries(stats.byCourse).map(([course, count]) => (
              <div key={course} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6', fontSize: 14 }}>
                <span>{COURSE_NAMES[course] || course}</span>
                <span style={{ fontWeight: 700 }}>{count}</span>
              </div>
            ))
          )}
        </div>
        <div style={{ flex: '1 1 300px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Applications by Status</div>
          {Object.entries(stats?.byStatus || {}).map(([status, count]) => (
            <div key={status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f3f4f6', fontSize: 14 }}>
              <StatusBadge status={status} />
              <span style={{ fontWeight: 700 }}>{count}</span>
            </div>
          ))}
        </div>
      </div>

      {onNavigate && (
        <div style={{ marginTop: 24, textAlign: 'right' }}>
          <button type="button" onClick={() => onNavigate('list')} style={{ padding: '10px 24px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
            View All Applications →
          </button>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
