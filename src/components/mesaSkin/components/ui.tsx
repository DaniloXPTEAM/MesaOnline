import type { CSSProperties, DragEventHandler, MouseEventHandler, ReactNode } from "react";

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

type ActionProps = {
  href?: string;
  children: ReactNode;
  className?: string;
  onClick?: MouseEventHandler<HTMLElement>;
  title?: string;
  ariaLabel?: string;
  style?: CSSProperties;
  active?: boolean;
  draggable?: boolean;
  onDragStart?: DragEventHandler<HTMLElement>;
  onDragOver?: DragEventHandler<HTMLElement>;
  onDrop?: DragEventHandler<HTMLElement>;
  onContextMenu?: MouseEventHandler<HTMLElement>;
  /** Botão visível porém inativo (ex.: ferramentas do mestre para o jogador). */
  disabled?: boolean;
};

/**
 * One component for every clickable thing on the page.
 * If `href` is supplied (via the LINKS map in src/config.ts) it renders an <a>,
 * otherwise a <button>. That is the whole integration surface.
 */
export function Action({ href, children, className, onClick, title, ariaLabel, style, active, draggable, onDragStart, onDragOver, onDrop, onContextMenu, disabled }: ActionProps) {
  const dnd = { draggable, onDragStart, onDragOver, onDrop, onContextMenu };
  const cls = cx(
    "group/act outline-none focus-visible:ring-2 focus-visible:ring-[#e0b25c]/80 focus-visible:ring-offset-1 focus-visible:ring-offset-[color:var(--mx-0b0706)]",
    className,
    active && "is-active",
  );
  if (href) {
    return (
      <a href={href} className={cls} onClick={onClick} title={title} aria-label={ariaLabel} style={style} {...dnd}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" className={cls} onClick={onClick} title={title} aria-label={ariaLabel} style={style} disabled={disabled} {...dnd}>
      {children}
    </button>
  );
}

export function Tray({ children, className, deep }: { children: ReactNode; className?: string; deep?: boolean }) {
  return <div className={cx(deep ? "tray-deep" : "tray", "rounded-[12px]", className)}>{children}</div>;
}

/** Tiny tracked brass label sitting above the data — the flight-deck detail. */
export function Micro({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("micro text-[#c9a25e]/85", className)}>{children}</div>;
}

export function SectionTitle({ glyph, children }: { glyph: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-3 pt-3 pb-2">
      <span className="grid h-5 w-5 place-items-center rounded-[5px] border border-[#7a5227]/70 bg-[color:var(--mx-241708)] text-[#e0b25c]">
        {glyph}
      </span>
      <h2 className="font-display text-[15px] font-semibold tracking-[0.04em] text-[color:var(--mx-f0e2c6)]">{children}</h2>
    </div>
  );
}

export function Bar({
  value,
  max,
  tone,
  height = 8,
  shine = true,
}: {
  value: number;
  max: number;
  tone: "hp" | "mp" | "foe" | string;
  height?: number;
  shine?: boolean;
}) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  const fill =
    tone === "hp"
      ? "linear-gradient(180deg,#67c957 0%,#3d8c2c 100%)"
      : tone === "mp"
        ? "linear-gradient(180deg,#57a7f0 0%,#2264b0 100%)"
        : tone === "foe"
          ? "linear-gradient(180deg,#e3564c 0%,#9d1c1c 100%)"
          : (tone as string);
  return (
    <div
      className="relative w-full overflow-hidden rounded-full bg-[color:var(--mx-070404)] ring-1 ring-white/[0.07]"
      style={{ height }}
    >
      <div
        className="h-full rounded-full transition-[width] duration-700 ease-out"
        style={{ width: `${pct}%`, backgroundImage: fill }}
      />
      {shine && (
        <div
          className="animate-shine pointer-events-none absolute inset-y-0 w-1/3 rounded-full bg-gradient-to-r from-transparent via-white/25 to-transparent"
          style={{ animationDuration: `${5 + (pct % 7)}s` }}
        />
      )}
    </div>
  );
}

/** Hand-drawn arcane pentagram used for magic-related affordances. */
export function Pentagram({ size = 18, color = "#a855c7", className }: { size?: number; color?: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9.2" fill="none" stroke={color} strokeWidth="1.3" opacity="0.9" />
      <path
        d="M12 3.6 L15.9 18.2 L4.6 8.9 L19.4 8.9 L8.1 18.2 Z"
        fill="none"
        stroke={color}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Wordmark star — an engraved four-point compass burst. */
export function StarBurst({ size = 34, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden="true">
      <defs>
        <radialGradient id="burstGlow" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#ff6a5e" stopOpacity="0.85" />
          <stop offset="60%" stopColor="#8c1c1c" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#8c1c1c" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="burstGold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f7dfa4" />
          <stop offset="55%" stopColor="#d9a94c" />
          <stop offset="100%" stopColor="#8c6522" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="url(#burstGlow)" />
      <path
        d="M32 2 C34.5 20 38 27 62 32 C38 37 34.5 44 32 62 C29.5 44 26 37 2 32 C26 27 29.5 20 32 2 Z"
        fill="url(#burstGold)"
      />
      <path d="M32 14 C33 25 35 29 50 32 C35 35 33 39 32 50 C31 39 29 35 14 32 C29 29 31 25 32 14 Z" fill="var(--mx-ffe6b0)" opacity="0.55" />
      <circle cx="32" cy="32" r="4.2" fill="#5c1210" />
    </svg>
  );
}

/** Ornate ormolu corner mount for the outer console frame. */
export function CornerMount({
  className,
  flip,
  style,
}: {
  className?: string;
  flip?: boolean;
  style?: CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 80 80"
      width="70"
      height="70"
      className={className}
      style={{ ...(flip ? { transform: "scaleX(-1)" } : {}), ...style }}
      aria-hidden="true"
    >
      <path d="M2 78 L2 22 C2 11 11 2 22 2 L78 2" fill="none" stroke="#8c6522" strokeWidth="2" opacity="0.85" />
      <path d="M10 78 L10 26 C10 17 17 10 26 10 L78 10" fill="none" stroke="#d9a94c" strokeWidth="1.1" opacity="0.55" />
      <path
        d="M18 40 C26 38 34 30 36 18 M36 18 C30 22 22 22 18 18 M36 18 C34 26 38 32 46 34"
        fill="none"
        stroke="#d9a94c"
        strokeWidth="1.2"
        opacity="0.7"
        strokeLinecap="round"
      />
      <circle cx="36" cy="18" r="2.4" fill="#f2d68f" opacity="0.75" />
    </svg>
  );
}
