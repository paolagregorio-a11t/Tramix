type Props = { size?: number; withWordmark?: boolean };

/** Tramix mark: three rising steps, the last one in amber ("where you need to be"). */
export function Logo({ size = 34, withWordmark = true }: Props) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
        <rect x="6" y="36" width="14" height="20" rx="4" fill="var(--teal-300)" />
        <rect x="25" y="22" width="14" height="34" rx="4" fill="var(--primary)" />
        <rect x="44" y="8" width="14" height="48" rx="4" fill="var(--accent)" />
      </svg>
      {withWordmark && (
        <span style={{ fontWeight: 700, fontSize: size * 0.9, letterSpacing: "-0.04em" }}>tramix</span>
      )}
    </span>
  );
}
