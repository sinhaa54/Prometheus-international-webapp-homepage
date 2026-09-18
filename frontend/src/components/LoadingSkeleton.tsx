export function LoadingSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton" />
      ))}
    </div>
  );
}
