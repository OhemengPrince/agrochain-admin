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

const DOT_STYLES = {
  PENDING: 'bg-yellow-500',
  COMPLETED: 'bg-green-500',
  SUCCESS: 'bg-green-500',
  ACTIVE: 'bg-green-500',
  CONFIRMED: 'bg-blue-500',
  FAILED: 'bg-red-500',
  SUSPENDED: 'bg-red-500',
  REMOVED: 'bg-red-500',
  CANCELLED: 'bg-gray-400',
  REFUNDED: 'bg-purple-500',
};

export default function StatusBadge({ status }) {
  const cls = STATUS_STYLES[status] || 'bg-gray-100 text-gray-600';
  const dot = DOT_STYLES[status] || 'bg-gray-400';
  const isPending = status === 'PENDING';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>
      <span className="relative flex h-1.5 w-1.5">
        {isPending && (
          <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${dot} opacity-75`} />
        )}
        <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${dot}`} />
      </span>
      {status || 'UNKNOWN'}
    </span>
  );
}
