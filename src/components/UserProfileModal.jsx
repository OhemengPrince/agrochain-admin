import { AnimatePresence, motion } from 'framer-motion';
import StatusBadge from './StatusBadge';
import { formatDate } from '../utils/format';

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-50 py-3 last:border-0">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</span>
      <span className="text-sm font-semibold text-gray-900">{value || '—'}</span>
    </div>
  );
}

export default function UserProfileModal({ user, onClose }) {
  const initials = user
    ? (user.fullName || user.name || user.email || '?')
        .split(' ')
        .map((p) => p[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '';

  return (
    <AnimatePresence>
      {user && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-lg font-bold text-white">
                  {initials}
                </div>
                <div>
                  <p className="text-base font-extrabold text-gray-900">{user?.fullName || user?.name || '—'}</p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
              </div>
              <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-5 rounded-xl border border-gray-100 px-4">
              <Row label="Role" value={user?.role} />
              <Row label="Phone" value={user?.phoneNumber || user?.phone} />
              <Row label="Region" value={user?.region} />
              <Row label="District / Town" value={user?.district} />
              <Row label="Joined" value={user ? formatDate(user.createdAt) : '—'} />
              <div className="flex items-center justify-between py-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Status</span>
                <StatusBadge status={user?.suspended ? 'SUSPENDED' : 'ACTIVE'} />
              </div>
            </div>

            <button
              onClick={onClose}
              className="mt-5 w-full rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-200"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
