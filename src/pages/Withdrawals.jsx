import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import AnimatedRow from '../components/AnimatedRow';
import { SkeletonTableRows } from '../components/Skeleton';
import { getWithdrawals } from '../api/admin';
import { extractArray, formatGHS, formatDateTime, itemDate } from '../utils/format';

const STATUS_OPTIONS = ['ALL', 'PENDING', 'COMPLETED', 'FAILED'];

export default function Withdrawals() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await getWithdrawals();
        setWithdrawals(extractArray(data));
      } catch {
        const msg = 'Could not load withdrawals. Please try again.';
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (statusFilter === 'ALL') return withdrawals;
    return withdrawals.filter((w) => (w.status || '').toUpperCase() === statusFilter);
  }, [withdrawals, statusFilter]);

  const totalWithdrawn = useMemo(
    () =>
      withdrawals
        .filter((w) => (w.status || '').toUpperCase() === 'COMPLETED')
        .reduce((sum, w) => sum + (Number(w.amount) || 0), 0),
    [withdrawals]
  );

  const pendingTotal = useMemo(
    () =>
      withdrawals
        .filter((w) => (w.status || '').toUpperCase() === 'PENDING')
        .reduce((sum, w) => sum + (Number(w.amount) || 0), 0),
    [withdrawals]
  );

  return (
    <Layout title="Withdrawals">
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard loading={loading} label="Total Withdrawn" value={totalWithdrawn} gradient="green" formatter={(v) => formatGHS(v)} />
        <StatCard loading={loading} label="Pending Payout" value={pendingTotal} gradient="gold" formatter={(v) => formatGHS(v)} />
        <StatCard loading={loading} label="Requests Shown" value={filtered.length} gradient="cyan" />
      </div>

      <div className="mb-5 flex items-center gap-3">
        <label className="text-xs font-semibold text-gray-500">Status</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3.5 py-2 text-sm font-medium text-gray-700 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s === 'ALL' ? 'All Statuses' : s}
            </option>
          ))}
        </select>
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
                <th className="px-5 py-3 font-semibold">User</th>
                <th className="px-5 py-3 font-semibold">Amount</th>
                <th className="px-5 py-3 font-semibold">Method</th>
                <th className="px-5 py-3 font-semibold">Account</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <SkeletonTableRows columns={7} />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-gray-400">
                    No withdrawal requests match this filter.
                  </td>
                </tr>
              ) : (
                filtered.map((w, i) => (
                  <AnimatedRow key={w.id} index={i} className="transition-colors duration-150 hover:bg-gray-50/80">
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-500">{w.id}</td>
                    <td className="px-5 py-3.5 text-gray-700">
                      {w.userName || w.user?.fullName || w.user?.email || '—'}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-gray-900">{formatGHS(w.amount)}</td>
                    <td className="px-5 py-3.5 text-gray-600">{w.method || (w.bankName ? 'Bank' : 'MoMo')}</td>
                    <td className="px-5 py-3.5 text-gray-600">
                      {w.accountNumber || w.momoNumber || w.accountName || '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={w.status} />
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">{formatDateTime(itemDate(w))}</td>
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
