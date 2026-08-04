export default function StatCard({ label, value, icon, accent = '#1A6B2E' }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
          <p className="mt-2 text-2xl font-extrabold text-gray-900">{value}</p>
        </div>
        {icon && (
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: accent + '1A', color: accent }}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
