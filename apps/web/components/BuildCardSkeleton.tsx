export function BuildCardSkeleton() {
  return (
    <div className="rounded-xl bg-zinc-800/80 border border-zinc-700 p-4 flex flex-col gap-2 min-h-[180px] animate-pulse">
      <div className="flex items-center gap-1.5">
        <div className="h-5 w-20 bg-zinc-700 rounded-md" />
        <div className="h-5 w-16 bg-zinc-700 rounded-md" />
      </div>
      <div className="h-5 w-3/4 bg-zinc-700 rounded mt-2" />
      <div className="h-5 w-1/2 bg-zinc-700 rounded" />
      <div className="mt-auto flex justify-between pt-2">
        <div className="h-3 w-24 bg-zinc-700 rounded" />
        <div className="h-3 w-32 bg-zinc-700 rounded" />
      </div>
    </div>
  );
}
