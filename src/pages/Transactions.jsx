import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import AnimatedRow from '../components/AnimatedRow';
import { SkeletonTableRows } from '../components/Skeleton';
import { getTransactions } from '../api/admin';
import { extractArray, formatGHS, formatDateTime, itemDate } from '../utils/format';

const STATUS_OPTIONS = ['ALL', 'PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'];
const TYPE_OPTIONS = ['ALL', 'BOOKING', 'MARKETPLACE', 'PRODUCE'];

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await getTransactions();
        setTransactions(extractArray(data));
      } catch {
        const msg = 'Could not load transactions. Please try again.';
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredTransactions = useMemo(() => {
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate + 'T23:59:59') : null;

    return transactions.filter((t) => {
      const matchesStatus = statusFilter === 'ALL' || (t.status || '').toUpperCase() === statusFilter;
      const matchesType = typeFilter === 'ALL' || (t.type || '').toUpperCase().includes(typeFilter);
      const raw = itemDate(t);
      const d = raw ? new Date(raw) : null;
      const matchesFrom = !from || (d && d >= from);
      const matchesTo = !to || (d && d <= to);
      return matchesStatus && matchesType && matchesFrom && matchesTo;
    });
  }, [transactions, statusFilter, typeFilter, fromDate, toDate]);

  const totalRevenue = useMemo(
    () =>
      filteredTransactions
        .filter((t) => (t.status || '').toUpperCase() === 'COMPLETED' || (t.status || '').toUpperCase() === 'SUCCESS')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0),
    [filteredTransactions]
  );

  const totalFees = useMemo(
    () => filteredTransactions.reduce((sum, t) => sum + (Number(t.fee) || 0), 0),
    [filteredTransactions]
  );

  const resetFilters = () => {
    setStatusFilter('ALL');
    setTypeFilter('ALL');
    setFromDate('');
    setToDate('');
  };

  return (
    <Layout title="Transactions">
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          loading={loading}
          label="Total Revenue (Completed)"
          value={totalRevenue}
          gradient="green"
          formatter={(v) => formatGHS(v)}
        />
        <StatCard
          loading={loading}
          label="Total Fees Collected"
          value={totalFees}
          gradient="purple"
          formatter={(v) => formatGHS(v)}
        />
        <StatCard loading={loading} label="Transactions Shown" value={filteredTransactions.length} gradient="cyan" />
      </div>

      <div className="mb-5 flex flex-wrap items-end gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-500">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s === 'ALL' ? 'All Statuses' : s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-500">Type</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            {TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t === 'ALL' ? 'All Types' : t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-500">From</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-500">To</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <button
          onClick={resetFilters}
          className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-500 transition hover:bg-gray-100"
        >
          Reset
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50">
              <tr className="text-xs uppercase tracking-wide text-gray-400">
                <th className="px-5 py-3 font-semibold">ID</th>
                <th className="px-5 py-3 font-semibold">Type</th>
                <th className="px-5 py-3 font-semibold">Amount (GHS)</th>
                <th className="px-5 py-3 font-semibold">Fee (GHS)</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">User</th>
                <th className="px-5 py-3 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <SkeletonTableRows columns={7} />
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-gray-400">
                    No transactions match your filters.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t, i) => (
                  <AnimatedRow key={t.id} index={i} className="transition-colors duration-150 hover:bg-gray-50/80">
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-500">{t.id}</td>
                    <td className="px-5 py-3.5 font-medium text-gray-900">{t.type || '—'}</td>
                    <td className="px-5 py-3.5 font-semibold text-gray-900">{formatGHS(t.amount)}</td>
                    <td className="px-5 py-3.5 text-gray-600">{formatGHS(t.fee)}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">
                      {t.userName || t.userEmail || t.user?.fullName || t.user?.email || '—'}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">{formatDateTime(itemDate(t))}</td>
                  </AnimatedRow>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
