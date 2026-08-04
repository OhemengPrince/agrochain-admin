import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import AnimatedRow from '../components/AnimatedRow';
import { SkeletonTableRows, SkeletonChart } from '../components/Skeleton';
import { getUsers, getTransactions, getBookings, getMarketplaceListings } from '../api/admin';
import { extractArray, formatGHS, formatDate, itemDate } from '../utils/format';

const ChartCard = ({ title, span, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-40px' }}
    transition={{ duration: 0.35 }}
    className={`rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ${span || ''}`}
  >
    <h2 className="mb-4 text-sm font-bold text-gray-900">{title}</h2>
    {children}
  </motion.div>
);

const ROLE_LABELS = {
  FARMER: 'Farmers',
  EQUIPMENT_OWNER: 'Owners',
  BUYER: 'Buyers',
  GENERAL: 'General',
  ADMIN: 'Admins',
};

const BOOKING_STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
const BOOKING_STATUS_COLORS = {
  PENDING: '#F59E0B',
  CONFIRMED: '#2563EB',
  COMPLETED: '#16A34A',
  CANCELLED: '#9CA3AF',
};

const MONTHS_BACK = 6;

function monthKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}`;
}

function last6Months() {
  const out = [];
  const now = new Date();
  for (let i = MONTHS_BACK - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({ key: monthKey(d), label: d.toLocaleDateString('en-US', { month: 'short' }) });
  }
  return out;
}

const NOT_ACTIVE_STATUSES = new Set(['SOLD', 'REMOVED', 'INACTIVE', 'DELETED', 'EXPIRED']);

export default function Dashboard() {
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      const results = await Promise.allSettled([getUsers(), getTransactions(), getBookings(), getMarketplaceListings()]);
      const [usersRes, txRes, bookingsRes, listingsRes] = results;

      if (usersRes.status === 'fulfilled') setUsers(extractArray(usersRes.value.data));
      if (txRes.status === 'fulfilled') setTransactions(extractArray(txRes.value.data));
      if (bookingsRes.status === 'fulfilled') setBookings(extractArray(bookingsRes.value.data));
      if (listingsRes.status === 'fulfilled') setListings(extractArray(listingsRes.value.data));

      if (results.every((r) => r.status === 'rejected')) {
        setError('Could not load dashboard data. Please try again.');
      }
      setLoading(false);
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

  const roleChartData = useMemo(
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

  const revenueByMonth = useMemo(() => {
    const months = last6Months();
    const sums = Object.fromEntries(months.map((m) => [m.key, 0]));
    for (const t of transactions) {
      const raw = itemDate(t);
      if (!raw) continue;
      const d = new Date(raw);
      const key = monthKey(d);
      if (key in sums) sums[key] += Number(t.amount) || 0;
    }
    return months.map((m) => ({ month: m.label, revenue: Math.round(sums[m.key]) }));
  }, [transactions]);

  const bookingStatusData = useMemo(() => {
    const counts = Object.fromEntries(BOOKING_STATUSES.map((s) => [s, 0]));
    for (const b of bookings) {
      const status = (b.status || '').toUpperCase();
      if (status in counts) counts[status] += 1;
    }
    return BOOKING_STATUSES.map((status) => ({
      name: status.charAt(0) + status.slice(1).toLowerCase(),
      value: counts[status],
      status,
    })).filter((d) => d.value > 0);
  }, [bookings]);

  const activeListingsCount = useMemo(() => {
    if (listings.length === 0) return 0;
    const hasStatus = listings.some((l) => l.status);
    if (!hasStatus) return listings.length;
    return listings.filter((l) => !NOT_ACTIVE_STATUSES.has((l.status || '').toUpperCase())).length;
  }, [listings]);

  const recentUsers = useMemo(
    () =>
      [...users]
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 5),
    [users]
  );

  const recentTransactions = useMemo(
    () =>
      [...transactions]
        .sort((a, b) => new Date(itemDate(b) || 0) - new Date(itemDate(a) || 0))
        .slice(0, 5),
    [transactions]
  );

  return (
    <Layout title="Dashboard">
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
        <StatCard loading={loading} label="Total Users" value={users.length} gradient="blue" icon={<UsersGlyph />} />
        <StatCard loading={loading} label="Farmers" value={roleCounts.FARMER || 0} gradient="green" icon={<LeafGlyph />} />
        <StatCard loading={loading} label="Owners" value={roleCounts.EQUIPMENT_OWNER || 0} gradient="orange" icon={<TractorGlyph />} />
        <StatCard loading={loading} label="Buyers" value={roleCounts.BUYER || 0} gradient="purple" icon={<CartGlyph />} />
        <StatCard
          loading={loading}
          label="Total Revenue (GHS)"
          value={revenue}
          gradient="gold"
          icon={<CoinGlyph />}
          formatter={(v) => formatGHS(v, { decimals: 0 })}
        />
        <StatCard loading={loading} label="Total Transactions" value={transactions.length} gradient="teal" icon={<ReceiptGlyph />} />
        <StatCard loading={loading} label="Active Listings" value={activeListingsCount} gradient="cyan" icon={<TagGlyph />} />
        <StatCard loading={loading} label="Total Bookings" value={bookings.length} gradient="rose" icon={<CalendarGlyph />} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <ChartCard title="Revenue by Month" span="xl:col-span-2">
          {loading ? (
            <SkeletonChart />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueByMonth} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(value) => formatGHS(value, { decimals: 0 })}
                    contentStyle={{ borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 13 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#1A6B2E"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#1A6B2E' }}
                    isAnimationActive
                    animationDuration={900}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Bookings by Status">
          {loading ? (
            <SkeletonChart />
          ) : (
            <div className="h-64">
              {bookingStatusData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-gray-400">No bookings yet.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={bookingStatusData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      isAnimationActive
                      animationDuration={900}
                    >
                      {bookingStatusData.map((entry) => (
                        <Cell key={entry.status} fill={BOOKING_STATUS_COLORS[entry.status]} />
                      ))}
                    </Pie>
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 13 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          )}
        </ChartCard>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-5">
        <ChartCard title="Users by Role" span="xl:col-span-2">
          {loading ? (
            <SkeletonChart />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roleChartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="role" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: '#F0FDF4' }}
                    contentStyle={{ borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 13 }}
                  />
                  <Bar dataKey="count" fill="#1A6B2E" radius={[6, 6, 0, 0]} maxBarSize={48} isAnimationActive animationDuration={900} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Recent Registrations" span="xl:col-span-3">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
                  <th className="pb-2 pr-4 font-semibold">Name</th>
                  <th className="pb-2 pr-4 font-semibold">Role</th>
                  <th className="pb-2 font-semibold">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <SkeletonTableRows columns={3} rows={5} />
                ) : recentUsers.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-gray-400">No users yet.</td>
                  </tr>
                ) : (
                  recentUsers.map((u, i) => (
                    <AnimatedRow key={u.id} index={i}>
                      <td className="py-3 pr-4">
                        <p className="font-medium text-gray-900">{u.fullName || u.name || '—'}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 text-gray-500">{formatDate(u.createdAt)}</td>
                    </AnimatedRow>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </ChartCard>
      </div>

      <ChartCard title="Recent Transactions" span="mt-6">
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
                <SkeletonTableRows columns={4} rows={5} />
              ) : recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-gray-400">No transactions yet.</td>
                </tr>
              ) : (
                recentTransactions.map((t, i) => (
                  <AnimatedRow key={t.id} index={i}>
                    <td className="py-3 pr-4 font-medium text-gray-800">{t.type || '—'}</td>
                    <td className="py-3 pr-4 font-semibold text-gray-900">{formatGHS(t.amount)}</td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="py-3 text-gray-500">{formatDate(itemDate(t))}</td>
                  </AnimatedRow>
                ))
              )}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </Layout>
  );
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
function TagGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M11.5 3.5H5a1.5 1.5 0 0 0-1.5 1.5v6.5a1.5 1.5 0 0 0 .44 1.06l8 8a1.5 1.5 0 0 0 2.12 0l6.5-6.5a1.5 1.5 0 0 0 0-2.12l-8-8a1.5 1.5 0 0 0-1.06-.44Z" />
      <circle cx="8" cy="8" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}
function CalendarGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <rect x="3.5" y="5" width="17" height="16" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </svg>
  );
}
