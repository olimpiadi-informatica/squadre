import clsx from "clsx";

export function RegionImage({
  id,
  name,
  className,
}: {
  id: string;
  name: string;
  className?: string;
}) {
  return (
    <img
      src={`/images/regions/${id.toUpperCase()}.svg`}
      alt={`Flag of ${name}`}
      className={clsx("size-8 object-contain", className)}
    />
  );
}
