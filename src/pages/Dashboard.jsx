import { useCallback, useEffect, useMemo, useState } from 'react';
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
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import AnimatedRow from '../components/AnimatedRow';
import Gauge from '../components/Gauge';
import RingProgress from '../components/RingProgress';
import KpiCard from '../components/KpiCard';
import { SkeletonTableRows, SkeletonChart, SkeletonStatCard } from '../components/Skeleton';
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

const ROLE_DOT_COLORS = {
  FARMER: '#1A6B2E',
  EQUIPMENT_OWNER: '#2E8B45',
  BUYER: '#7DBF8E',
  GENERAL: '#B7DCC0',
};

const BOOKING_STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
const BOOKING_STATUS_COLORS = {
  PENDING: '#F59E0B',
  CONFIRMED: '#2563EB',
  COMPLETED: '#16A34A',
  CANCELLED: '#9CA3AF',
};

const REGION_BAR_COLORS = ['#124D21', '#1A6B2E', '#2E8B45', '#4FAE64', '#7DC98E', '#AEE0B9'];

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

// Buckets items into the last 6 calendar months by `dateGetter`, summing
// `valueGetter` per bucket (defaults to a plain count).
function bucketByMonth(items, dateGetter, valueGetter = () => 1) {
  const months = last6Months();
  const sums = Object.fromEntries(months.map((m) => [m.key, 0]));
  for (const item of items) {
    const raw = dateGetter(item);
    if (!raw) continue;
    const key = monthKey(new Date(raw));
    if (key in sums) sums[key] += valueGetter(item) || 0;
  }
  return months.map((m) => sums[m.key]);
}

// % change of "this calendar month so far" vs "same point last calendar month".
function monthOverMonthDelta(items, dateGetter, valueGetter = () => 1) {
  const now = new Date();
  const thisStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  let thisSum = 0;
  let lastSum = 0;
  for (const item of items) {
    const raw = dateGetter(item);
    if (!raw) continue;
    const d = new Date(raw);
    const v = valueGetter(item) || 0;
    if (d >= thisStart) thisSum += v;
    else if (d >= lastStart && d < thisStart) lastSum += v;
  }
  if (lastSum === 0) return thisSum > 0 ? 100 : 0;
  return ((thisSum - lastSum) / lastSum) * 100;
}

const NOT_ACTIVE_STATUSES = new Set(['SOLD', 'REMOVED', 'INACTIVE', 'DELETED', 'EXPIRED']);

export default function Dashboard() {
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async (isRefresh = false) => {
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
    } else if (isRefresh) {
      toast.success('Dashboard refreshed');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData(false);
  }, [loadData]);

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

  const roleBreakdown = useMemo(() => {
    const total = users.length || 1;
    return Object.entries(ROLE_LABELS)
      .filter(([role]) => role !== 'ADMIN')
      .map(([role, label]) => ({
        role,
        label,
        count: roleCounts[role] || 0,
        pct: ((roleCounts[role] || 0) / total) * 100,
        color: ROLE_DOT_COLORS[role] || '#1A6B2E',
      }))
      .sort((a, b) => b.pct - a.pct)
      .filter((r) => r.count > 0);
  }, [roleCounts, users.length]);

  const topRole = roleBreakdown[0];

  const revenue = useMemo(
    () => transactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0),
    [transactions]
  );

  const revenueByMonth = useMemo(() => {
    const months = last6Months();
    const sums = bucketByMonth(transactions, itemDate, (t) => Number(t.amount) || 0);
    return months.map((m, i) => ({ month: m.label, revenue: Math.round(sums[i]) }));
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

  const bookingFulfillmentRate = useMemo(() => {
    if (bookings.length === 0) return 0;
    const completed = bookings.filter((b) => (b.status || '').toUpperCase() === 'COMPLETED').length;
    return (completed / bookings.length) * 100;
  }, [bookings]);

  const activeListingsCount = useMemo(() => {
    if (listings.length === 0) return 0;
    const hasStatus = listings.some((l) => l.status);
    if (!hasStatus) return listings.length;
    return listings.filter((l) => !NOT_ACTIVE_STATUSES.has((l.status || '').toUpperCase())).length;
  }, [listings]);

  const activeListingsRate = listings.length ? (activeListingsCount / listings.length) * 100 : 0;

  const activeUsersRate = useMemo(() => {
    if (users.length === 0) return 0;
    const active = users.filter((u) => !u.suspended).length;
    return (active / users.length) * 100;
  }, [users]);

  const topRegions = useMemo(() => {
    const counts = {};
    let withRegion = 0;
    for (const u of users) {
      if (!u.region) continue;
      withRegion += 1;
      counts[u.region] = (counts[u.region] || 0) + 1;
    }
    const total = withRegion || 1;
    return Object.entries(counts)
      .map(([region, count]) => ({ region, count, pct: (count / total) * 100 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [users]);

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

  const usersTrend = useMemo(() => bucketByMonth(users, (u) => u.createdAt), [users]);
  const revenueTrend = useMemo(() => bucketByMonth(transactions, itemDate, (t) => Number(t.amount) || 0), [transactions]);
  const bookingsTrend = useMemo(() => bucketByMonth(bookings, itemDate), [bookings]);
  const listingsTrend = useMemo(() => bucketByMonth(listings, itemDate), [listings]);

  const usersDelta = useMemo(() => monthOverMonthDelta(users, (u) => u.createdAt), [users]);
  const revenueDelta = useMemo(() => monthOverMonthDelta(transactions, itemDate, (t) => Number(t.amount) || 0), [transactions]);
  const bookingsDelta = useMemo(() => monthOverMonthDelta(bookings, itemDate), [bookings]);
  const listingsDelta = useMemo(() => monthOverMonthDelta(listings, itemDate), [listings]);

  const avatarStack = recentUsers.slice(0, 4);

  return (
    <Layout
      title="Dashboard"
      headerAction={
        <button
          onClick={() => loadData(true)}
          disabled={loading}
          className="rounded-full bg-shell px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-shell-light disabled:opacity-60"
        >
          Refresh Data
        </button>
      }
    >
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Top KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard loading={loading} label="Total Users" value={users.length} delta={usersDelta} trend={usersTrend} barColor="#1A6B2E" />
        <KpiCard
          loading={loading}
          label="Total Revenue (GHS)"
          value={revenue}
          delta={revenueDelta}
          trend={revenueTrend}
          barColor="#2563EB"
          formatter={(v) => formatGHS(v, { decimals: 0 })}
        />
        <KpiCard loading={loading} label="Total Bookings" value={bookings.length} delta={bookingsDelta} trend={bookingsTrend} barColor="#F59E0B" />
        <KpiCard loading={loading} label="Active Listings" value={activeListingsCount} delta={listingsDelta} trend={listingsTrend} barColor="#DB2777" />
      </div>

      {/* Gauge / role split / regions row */}
      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.35 }}
          className="flex flex-col items-center rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
        >
          <h2 className="mb-2 self-start text-sm font-bold text-gray-900">Booking Fulfillment Rate</h2>
          {loading ? (
            <SkeletonChart height={148} />
          ) : (
            <>
              <Gauge value={bookingFulfillmentRate} color="#1A6B2E" trackColor="#EFF3EF" />
              <p className="mt-2 text-xs text-gray-400">
                Deviation Index {Math.max(0, Math.round(100 - bookingFulfillmentRate))}%
              </p>
            </>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
        >
          <h2 className="text-sm font-bold text-gray-900">User Base by Role</h2>
          {loading ? (
            <SkeletonChart height={148} />
          ) : (
            <>
              <p className="mt-1 text-3xl font-extrabold text-gray-900">
                {topRole ? Math.round(topRole.pct) : 0}
                <span className="text-lg text-gray-400">%</span>
              </p>
              <p className="mb-4 text-xs text-gray-400">are {topRole?.label || 'users'}</p>
              <div className="space-y-3">
                {roleBreakdown.map((r) => (
                  <div key={r.role}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2 font-semibold text-gray-600">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: r.color }} />
                        {r.label}
                      </span>
                      <span className="font-bold text-gray-800">{Math.round(r.pct)}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${r.pct}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: r.color }}
                      />
                    </div>
                  </div>
                ))}
                {roleBreakdown.length === 0 && <p className="text-sm text-gray-400">No users yet.</p>}
              </div>
            </>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
        >
          <h2 className="text-sm font-bold text-gray-900">Top Regions by Users</h2>
          <p className="mt-1 text-xs text-gray-400">Where AgroChain users are registered from.</p>

          {loading ? (
            <div className="mt-4"><SkeletonChart height={148} /></div>
          ) : topRegions.length === 0 ? (
            <p className="mt-6 text-sm text-gray-400">No region data yet.</p>
          ) : (
            <>
              {topRegions[0] && (
                <div className="mt-4 flex items-center justify-between rounded-xl bg-shell px-4 py-2.5 text-white">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold">{topRegions[0].region}</p>
                    <p className="text-[11px] text-white/50">Top region</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-white/15 px-2.5 py-1 text-xs font-bold">
                    {Math.round(topRegions[0].pct)}%
                  </span>
                </div>
              )}
              <div className="mt-4 space-y-2.5">
                {topRegions.map((r, i) => (
                  <div key={r.region} className="flex items-center gap-3 text-xs">
                    <span className="w-24 shrink-0 truncate font-semibold text-gray-600">{r.region}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${r.pct}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, delay: i * 0.05 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: REGION_BAR_COLORS[i] || REGION_BAR_COLORS[REGION_BAR_COLORS.length - 1] }}
                      />
                    </div>
                    <span className="w-8 shrink-0 text-right font-bold text-gray-800">{r.count}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* Insight rings + community CTA row */}
      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-4">
          {loading ? (
            <>
              <SkeletonStatCard />
              <SkeletonStatCard />
            </>
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.35 }}
                className="flex items-center gap-4 rounded-2xl bg-shell p-5 text-white shadow-sm"
              >
                <RingProgress value={activeListingsRate} color="#4FAE64" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">Active Listings Rate</p>
                  <p className="text-xs text-white/50">Share of listings currently live</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.35, delay: 0.05 }}
                className="flex items-center gap-4 rounded-2xl bg-shell p-5 text-white shadow-sm"
              >
                <RingProgress value={activeUsersRate} color="#60A5FA" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">Active Users Rate</p>
                  <p className="text-xs text-white/50">Accounts in good standing</p>
                </div>
              </motion.div>
            </>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-shell p-6 text-white shadow-sm xl:col-span-2"
        >
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-16 right-16 h-32 w-32 rounded-full bg-white/10" />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <path d="M20 4C10 4 4 10 4 18c8 0 14-6 16-14z" />
                </svg>
              </div>
              <span className="text-sm font-bold">AgroChain</span>
            </div>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 opacity-80">
              <path d="M7 17L17 7M7 7h10v10" />
            </svg>
          </div>

          <p className="relative mt-6 max-w-xs text-2xl font-extrabold leading-snug">
            Grow the AgroChain community
          </p>
          <p className="relative mt-1 max-w-xs text-sm text-white/70">
            Farmers, equipment owners and buyers trading produce across Ghana.
          </p>

          <div className="relative mt-6 flex items-center gap-3">
            <div className="flex -space-x-3">
              {avatarStack.map((u) => (
                <div
                  key={u.id}
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-shell bg-white/20 text-[11px] font-bold text-white"
                >
                  {(u.fullName || u.name || u.email || '?').charAt(0).toUpperCase()}
                </div>
              ))}
            </div>
            <span className="text-sm font-semibold text-white/80">{users.length.toLocaleString()}+ people</span>
          </div>
        </motion.div>
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
