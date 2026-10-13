type Props = { size?: number; withWordmark?: boolean; tone?: "dark" | "light" };

/** Tramix mark: three rising steps; the tallest, in yellow, is "where you need to be". */
export function Logo({ size = 34, withWordmark = true, tone = "dark" }: Props) {
  const c = tone === "light"
    ? { a: "#8fa6d8", b: "#ffffff", t: "#ffffff" }
    : { a: "#8fa6d8", b: "#2e4c86", t: "#0b1220" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
        <rect x="6" y="36" width="14" height="20" rx="4" fill={c.a} />
        <rect x="25" y="22" width="14" height="34" rx="4" fill={c.b} />
        <rect x="44" y="8" width="14" height="48" rx="4" fill="#e9b44c" />
      </svg>
      {withWordmark && <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: size * 0.85, letterSpacing: "-0.05em", color: c.t }}>tramix</span>}
    </span>
  );
}
