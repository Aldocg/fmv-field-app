export function LoadingSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-3xl border border-slate-100 bg-white p-4 shadow-soft"
        >
          <div className="h-5 w-2/3 rounded bg-slate-200" />
          <div className="mt-3 h-4 w-full rounded bg-slate-100" />
          <div className="mt-2 h-4 w-1/2 rounded bg-slate-100" />
          <div className="mt-4 h-8 w-28 rounded-full bg-slate-100" />
        </div>
      ))}
    </div>
  )
}