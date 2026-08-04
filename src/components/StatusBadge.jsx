const STATUS_STYLES = {
  PENDING: 'bg-yellow-50 text-yellow-700',
  COMPLETED: 'bg-green-50 text-green-700',
  SUCCESS: 'bg-green-50 text-green-700',
  ACTIVE: 'bg-green-50 text-green-700',
  CONFIRMED: 'bg-blue-50 text-blue-700',
  FAILED: 'bg-red-50 text-red-700',
  SUSPENDED: 'bg-red-50 text-red-700',
  REMOVED: 'bg-red-50 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-600',
  REFUNDED: 'bg-purple-50 text-purple-700',
};

export default function StatusBadge({ status }) {
  const cls = STATUS_STYLES[status] || 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>
      {status || 'UNKNOWN'}
    </span>
  );
}
