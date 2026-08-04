import { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import { getBookings } from '../api/admin';
import { extractArray, formatGHS, formatDate } from '../utils/format';

const STATUS_OPTIONS = ['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await getBookings();
        setBookings(extractArray(data));
      } catch {
        setError('Could not load bookings. Please try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (statusFilter === 'ALL') return bookings;
    return bookings.filter((b) => (b.status || '').toUpperCase() === statusFilter);
  }, [bookings, statusFilter]);

  return (
    <Layout title="Bookings">
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
        <span className="text-xs text-gray-400">{filtered.length} of {bookings.length} bookings</span>
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
                <th className="px-5 py-3 font-semibold">Equipment</th>
                <th className="px-5 py-3 font-semibold">Farmer</th>
                <th className="px-5 py-3 font-semibold">Owner</th>
                <th className="px-5 py-3 font-semibold">Start Date</th>
                <th className="px-5 py-3 font-semibold">End Date</th>
                <th className="px-5 py-3 font-semibold">Amount</th>
                <th className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-gray-400">
                    Loading bookings…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-gray-400">
                    No bookings match this filter.
                  </td>
                </tr>
              ) : (
                filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50/60">
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-500">{b.id}</td>
                    <td className="px-5 py-3.5 font-medium text-gray-900">
                      {b.equipmentName || b.equipment?.name || '—'}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{b.farmerName || b.farmer?.fullName || '—'}</td>
                    <td className="px-5 py-3.5 text-gray-600">{b.ownerName || b.owner?.fullName || '—'}</td>
                    <td className="px-5 py-3.5 text-gray-500">{formatDate(b.startDate)}</td>
                    <td className="px-5 py-3.5 text-gray-500">{formatDate(b.endDate)}</td>
                    <td className="px-5 py-3.5 font-semibold text-gray-900">{formatGHS(b.amount || b.totalAmount)}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={b.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
