import { useEffect, useState } from 'react';
import api from '../api/axios';
import Layout from '../components/Layout';

function extractArray(raw) {
  if (Array.isArray(raw)) return raw;
  if (raw?.content && Array.isArray(raw.content)) return raw.content;
  if (raw?.data && Array.isArray(raw.data)) return raw.data;
  if (raw?.items && Array.isArray(raw.items)) return raw.items;
  return [];
}

function formatGHS(amount) {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    maximumFractionDigits: 2,
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

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get('/admin/transactions');
        setTransactions(extractArray(data));
      } catch {
        setError('Could not load transactions. Please try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <Layout title="Transactions">
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
                <th className="px-5 py-3 font-semibold">Amount</th>
                <th className="px-5 py-3 font-semibold">Fee</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-gray-400">
                    Loading transactions…
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-gray-400">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50/60">
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-500">{t.id}</td>
                    <td className="px-5 py-3.5 font-medium text-gray-900">{t.type || '—'}</td>
                    <td className="px-5 py-3.5 font-semibold text-gray-900">{formatGHS(t.amount)}</td>
                    <td className="px-5 py-3.5 text-gray-600">{formatGHS(t.fee)}</td>
                    <td className="px-5 py-3.5">
                      <StatusPill status={t.status} />
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">
                      {t.date || t.createdAt ? new Date(t.date || t.createdAt).toLocaleString() : '—'}
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
