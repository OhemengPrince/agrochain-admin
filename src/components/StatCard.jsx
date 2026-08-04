import { motion } from 'framer-motion';
import CountUp from './CountUp';
import { SkeletonStatCard } from './Skeleton';

const GRADIENTS = {
  blue: 'from-blue-500 to-blue-700',
  green: 'from-[#1A6B2E] to-[#2E8B45]',
  orange: 'from-orange-400 to-orange-600',
  purple: 'from-purple-500 to-purple-700',
  gold: 'from-amber-400 to-yellow-600',
  teal: 'from-teal-400 to-teal-600',
  cyan: 'from-cyan-500 to-cyan-700',
  rose: 'from-rose-400 to-rose-600',
};

const defaultFormatter = (v) => Math.round(v).toLocaleString();

// `value` should be a raw number so it can be animated with CountUp; pass
// `formatter` to render it (e.g. currency). If `value` is a string it's
// shown as-is (no count-up) — useful for the rare non-numeric stat.
export default function StatCard({ label, value, icon, gradient = 'green', formatter = defaultFormatter, loading = false }) {
  if (loading) return <SkeletonStatCard />;

  const grad = GRADIENTS[gradient] || GRADIENTS.green;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`rounded-2xl bg-gradient-to-br ${grad} p-5 text-white shadow-md transition-shadow duration-200 hover:shadow-xl hover:shadow-black/10`}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-wide text-white/80">{label}</p>
          <p className="mt-2 text-2xl font-extrabold tabular-nums">
            {typeof value === 'number' ? <CountUp value={value} formatter={formatter} /> : value}
          </p>
        </div>
        {icon && (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20">
            {icon}
          </div>
        )}
      </div>
    </motion.div>
  );
}
