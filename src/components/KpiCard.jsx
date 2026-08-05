import { motion } from 'framer-motion';
import CountUp from './CountUp';
import MiniBars from './MiniBars';
import { SkeletonStatCard } from './Skeleton';

// Compact white KPI card matching the reference dashboard's top stat row
// (label, big number, month-over-month delta, mini sparkline).
export default function KpiCard({ label, value, delta, trend = [], barColor = '#1A6B2E', formatter, loading = false }) {
  if (loading) return <SkeletonStatCard />;

  const fmt = formatter || ((v) => Math.round(v).toLocaleString());
  const isUp = delta >= 0;

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-gray-400">{label}</p>
          <p className="mt-2 text-2xl font-extrabold tabular-nums text-gray-900">
            <CountUp value={value} formatter={fmt} />
          </p>
          {typeof delta === 'number' && (
            <p className={`mt-1.5 flex items-center gap-1 text-xs font-semibold ${isUp ? 'text-emerald-600' : 'text-red-500'}`}>
              <span>{isUp ? '↑' : '↓'}</span>
              {Math.abs(delta).toFixed(1)}% than last month
            </p>
          )}
        </div>
        <MiniBars data={trend} color={barColor} />
      </div>
    </motion.div>
  );
}
