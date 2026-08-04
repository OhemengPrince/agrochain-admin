import { motion } from 'framer-motion';

// Caps the stagger delay so a 200-row table doesn't take visibly long to
// finish animating in — rows past ~15 all animate together at the same max delay.
const MAX_STAGGER_INDEX = 15;
const STAGGER_STEP = 0.035;

export default function AnimatedRow({ index = 0, className = '', children, ...props }) {
  const delay = Math.min(index, MAX_STAGGER_INDEX) * STAGGER_STEP;
  return (
    <motion.tr
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.tr>
  );
}
