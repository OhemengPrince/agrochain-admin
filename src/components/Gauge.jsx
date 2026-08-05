import { motion } from 'framer-motion';

// Half-circle gauge (270°) matching the reference dashboard's "Waste
// Processing Level" style dial. `value` is 0-100.
export default function Gauge({ value = 0, color = '#1A6B2E', trackColor = '#0F1F13', size = 148 }) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const arcFraction = 0.75; // 270° of the circle is the visible track
  const arcLength = circumference * arcFraction;
  const filled = arcLength * (clamped / 100);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 140 140" className="-rotate-[135deg]">
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${arcLength} ${circumference}`}
        />
        <motion.circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - filled }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold text-gray-900">{Math.round(clamped)}%</span>
      </div>
    </div>
  );
}
