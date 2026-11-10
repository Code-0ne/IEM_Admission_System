import { useCallback, useEffect, useRef, useState } from 'react';
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

export function AdminApplicationsList({ onSelect }) {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [filters, setFilters] = useState({ status: '', course: '' });
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchTimer = useRef(null);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.listApplications({ ...filters, search: debouncedSearch, page });
      const data = res;
      setApps(data.applications || []);
      setPagination({ page: data.page || page, total: data.total || 0, totalPages: data.totalPages || 1 });
    } catch (err) {
      setError(err?.message || 'Failed to load applications.');
    } finally {
      setLoading(false);
    }
  }, [filters, debouncedSearch]);

  useEffect(() => { load(1); }, [load]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(val), 400);
  };

  const exportUrl = adminApi.getExportUrl({ status: filters.status, course: filters.course });

  return (
    <div>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="search" placeholder="Search by name or application no…"
          onChange={handleSearchChange}
          style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, minWidth: 240 }}
        />
        <select
          value={filters.status}
          onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
          style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13 }}
        >
          <option value="">All Statuses</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select
          value={filters.course}
          onChange={e => setFilters(f => ({ ...f, course: e.target.value }))}
          style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13 }}
        >
          <option value="">All Courses</option>
          {Object.entries(COURSE_NAMES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <a
          href={exportUrl} download="applications-export.csv"
          style={{ marginLeft: 'auto', padding: '8px 16px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#374151', textDecoration: 'none' }}
        >
          ⬇ Export CSV
        </a>
      </div>

      {error && (
        <div style={{ padding: 12, color: '#b91c1c', background: '#fee2e2', borderRadius: 8, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>Loading applications…</div>
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
              {apps.map((application, i) => (
                <tr key={application.id} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: 12 }}>{application.applicationNo || application.application_no || '—'}</td>
                  <td style={{ padding: '10px 14px', fontWeight: 500 }}>{application.fullName || application.full_name || '—'}</td>
                  <td style={{ padding: '10px 14px' }}>{COURSE_NAMES[application.programId || application.course_id] || application.programId || application.course_id || '—'}</td>
                  <td style={{ padding: '10px 14px' }}>{application.category || '—'}</td>
                  <td style={{ padding: '10px 14px' }}><StatusBadge status={application.status} /></td>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: '#6b7280' }}>{fmtDate(application.submittedAt || application.submitted_at)}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <button
                      type="button"
                      onClick={() => onSelect(application.id)}
                      style={{ padding: '5px 12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {pagination.totalPages > 1 && (
            <div style={{ padding: '12px 20px', borderTop: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: '#6b7280' }}>Page {pagination.page} of {pagination.totalPages} · {pagination.total} total</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() => load(pagination.page - 1)}
                  style={{ padding: '5px 12px', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', background: '#fff' }}
                >
                  ‹ Prev
                </button>
                <button
                  type="button"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => load(pagination.page + 1)}
                  style={{ padding: '5px 12px', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', background: '#fff' }}
                >
                  Next ›
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminApplicationsList;
