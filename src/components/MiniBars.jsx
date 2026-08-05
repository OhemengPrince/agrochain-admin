import { motion } from 'framer-motion';

// Tiny bar sparkline used on the compact KPI cards (mirrors the reference
// dashboard's mini bar-chart glyph next to each top stat).
export default function MiniBars({ data = [], color = '#1A6B2E' }) {
  const max = Math.max(1, ...data);
  return (
    <div className="flex h-9 items-end gap-1">
      {data.map((v, i) => (
        <motion.span
          key={i}
          initial={{ height: 0 }}
          animate={{ height: `${Math.max(12, (v / max) * 100)}%` }}
          transition={{ duration: 0.6, delay: i * 0.05, ease: 'easeOut' }}
          style={{ backgroundColor: color }}
          className="w-1.5 rounded-full opacity-80"
        />
      ))}
    </div>
  );
}
