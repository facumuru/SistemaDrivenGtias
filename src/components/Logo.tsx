/* eslint-disable @next/next/no-img-element */
export function Logo({ claro = false, alto = 28 }: { claro?: boolean; alto?: number }) {
  return (
    <span className="inline-flex shrink-0 items-center">
      <img
        src="/logo-driven.png"
        alt="Driven"
        style={{ height: alto, width: "auto", maxWidth: "none" }}
        className={claro ? "brightness-0 invert" : ""}
      />
    </span>
  );
}
