import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../api/axios';
import Layout from '../components/Layout';

const ROLE_LABELS = {
  FARMER: 'Farmers',
  EQUIPMENT_OWNER: 'Owners',
  BUYER: 'Buyers',
  GENERAL: 'General',
  ADMIN: 'Admins',
};

function StatCard({ label, value, icon, accent }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
          <p className="mt-2 text-2xl font-extrabold text-gray-900">{value}</p>
        </div>
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: accent + '1A', color: accent }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function formatGHS(amount) {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function StatusPill({ status }) {
  const styles = {
    COMPLETED: 'bg-green-50 text-green-700',
    SUCCESS: 'bg-green-50 text-green-700',
    PENDING: 'bg-amber-50 text-amber-700',
    FAILED: 'bg-red-50 text-red-700',
    CANCELLED: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {status || 'UNKNOWN'}
    </span>
  );
}

export default function Dashboard() {
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const [usersRes, txRes] = await Promise.allSettled([
          api.get('/admin/users'),
          api.get('/admin/transactions'),
        ]);

        if (usersRes.status === 'fulfilled') {
          setUsers(extractArray(usersRes.value.data));
        }
        if (txRes.status === 'fulfilled') {
          setTransactions(extractArray(txRes.value.data));
        }
        if (usersRes.status === 'rejected' && txRes.status === 'rejected') {
          setError('Could not load dashboard data. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const roleCounts = useMemo(() => {
    const counts = {};
    for (const u of users) {
      const role = u.role || 'GENERAL';
      counts[role] = (counts[role] || 0) + 1;
    }
    return counts;
  }, [users]);

  const chartData = useMemo(
    () =>
      Object.entries(ROLE_LABELS)
        .filter(([role]) => role !== 'ADMIN')
        .map(([role, label]) => ({ role: label, count: roleCounts[role] || 0 })),
    [roleCounts]
  );

  const revenue = useMemo(
    () => transactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0),
    [transactions]
  );

  const recentTransactions = useMemo(
    () =>
      [...transactions]
        .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))
        .slice(0, 8),
    [transactions]
  );

  return (
    <Layout title="Dashboard">
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Total Users"
          value={loading ? '—' : users.length.toLocaleString()}
          accent="#1A6B2E"
          icon={<UsersGlyph />}
        />
        <StatCard
          label="Farmers"
          value={loading ? '—' : (roleCounts.FARMER || 0).toLocaleString()}
          accent="#2E8B45"
          icon={<LeafGlyph />}
        />
        <StatCard
          label="Owners"
          value={loading ? '—' : (roleCounts.EQUIPMENT_OWNER || 0).toLocaleString()}
          accent="#1565C0"
          icon={<TractorGlyph />}
        />
        <StatCard
          label="Buyers"
          value={loading ? '—' : (roleCounts.BUYER || 0).toLocaleString()}
          accent="#FF8F00"
          icon={<CartGlyph />}
        />
        <StatCard
          label="Revenue (GHS)"
          value={loading ? '—' : formatGHS(revenue)}
          accent="#124D21"
          icon={<CoinGlyph />}
        />
        <StatCard
          label="Transactions"
          value={loading ? '—' : transactions.length.toLocaleString()}
          accent="#7B1FA2"
          icon={<ReceiptGlyph />}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm xl:col-span-2">
          <h2 className="mb-4 text-sm font-bold text-gray-900">Users by Role</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="role" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: '#F0FDF4' }}
                  contentStyle={{ borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 13 }}
                />
                <Bar dataKey="count" fill="#1A6B2E" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm xl:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">Recent Transactions</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
                  <th className="pb-2 pr-4 font-semibold">Type</th>
                  <th className="pb-2 pr-4 font-semibold">Amount</th>
                  <th className="pb-2 pr-4 font-semibold">Status</th>
                  <th className="pb-2 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-gray-400">
                      Loading…
                    </td>
                  </tr>
                ) : recentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-gray-400">
                      No transactions yet.
                    </td>
                  </tr>
                ) : (
                  recentTransactions.map((t) => (
                    <tr key={t.id}>
                      <td className="py-3 pr-4 font-medium text-gray-800">{t.type || '—'}</td>
                      <td className="py-3 pr-4 font-semibold text-gray-900">{formatGHS(t.amount)}</td>
                      <td className="py-3 pr-4">
                        <StatusPill status={t.status} />
                      </td>
                      <td className="py-3 text-gray-500">
                        {t.date || t.createdAt ? new Date(t.date || t.createdAt).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function extractArray(raw) {
  if (Array.isArray(raw)) return raw;
  if (raw?.content && Array.isArray(raw.content)) return raw.content;
  if (raw?.data && Array.isArray(raw.data)) return raw.data;
  if (raw?.items && Array.isArray(raw.items)) return raw.items;
  return [];
}

function UsersGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <circle cx="17" cy="8" r="2.6" />
      <path d="M15.5 14.2c2.6.4 4.5 2.7 4.5 5.8" />
    </svg>
  );
}
function LeafGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M20 4C10 4 4 10 4 18c8 0 14-6 16-14z" />
      <path d="M9 18c2-4 5-7 9-9" />
    </svg>
  );
}
function TractorGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <circle cx="7" cy="17" r="3" />
      <circle cx="18" cy="17" r="2.2" />
      <path d="M4 17V9h6l3 4h3.5a1.5 1.5 0 0 1 1.5 1.5V17M10 9V5H7" />
    </svg>
  );
}
function CartGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="17" cy="20" r="1.4" />
      <path d="M2.5 3h2l2.4 12.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L20.5 7H6" />
    </svg>
  );
}
function CoinGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v10M9.5 9.3c0-1.3 1.1-2 2.5-2s2.5.8 2.5 2c0 2.6-5 1.6-5 4.2 0 1.2 1.1 2 2.5 2s2.5-.7 2.5-2" />
    </svg>
  );
}
function ReceiptGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M6 3h12v18l-2.5-1.5L13 21l-2.5-1.5L8 21l-2-1.5V3z" />
      <path d="M8.5 8h7M8.5 12h7M8.5 16h4" />
    </svg>
  );
}
