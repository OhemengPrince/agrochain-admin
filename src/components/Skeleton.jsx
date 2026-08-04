export function SkeletonStatCard() {
  return (
    <div className="rounded-2xl bg-gray-100 p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
          <div className="mt-3 h-7 w-24 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="h-11 w-11 shrink-0 animate-pulse rounded-xl bg-gray-200" />
      </div>
    </div>
  );
}

export function SkeletonTableRows({ columns = 5, rows = 6 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r}>
          {Array.from({ length: columns }).map((__, c) => (
            <td key={c} className="px-5 py-4">
              <div
                className="h-3.5 animate-pulse rounded bg-gray-200"
                style={{ width: `${55 + ((r * 7 + c * 13) % 40)}%` }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function SkeletonChart({ height = 256 }) {
  return (
    <div
      className="w-full animate-pulse rounded-xl bg-gray-100"
      style={{ height }}
    />
  );
}
