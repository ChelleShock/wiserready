import React from "react";

/**
 * SliceraFooter
 *
 * A clean, responsive footer for Slicera web apps.
 * - Shows moth sword logo (via `logoSrc` or built‑in SVG fallback)
 * - Copy: "© 2025 Slicera | Crafted with purpose" and
 *         "Part of the Slicera product suite"
 * - Subtle separators, dark-mode ready, keyboard & screen‑reader friendly
 *
 * Usage:
 *   <SliceraFooter logoSrc="/assets/slicera-moth-sword.svg" />
 */
export default function SliceraFooter({ logoSrc }: { logoSrc?: string }) {
  return (
    <footer
      aria-label="Slicera site footer"
      className="w-full border-t border-neutral-200/70 dark:border-neutral-800/70 bg-white/70 dark:bg-neutral-950/70 backdrop-blur supports-[backdrop-filter]:bg-white/40 supports-[backdrop-filter]:dark:bg-neutral-950/40"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between py-6">
          {/* Left: Logo + brand */}
          <a
            href="/"
            className="group inline-flex items-center gap-3 text-neutral-800 dark:text-neutral-100"
            aria-label="Slicera home"
          >
            <div className="h-7 w-7 shrink-0">
              {logoSrc ? (
                <img
                  src={logoSrc}
                  alt="Slicera moth sword logo"
                  className="h-7 w-7 object-contain"
                  loading="lazy"
                />
              ) : (
                <MothSwordSVG className="h-7 w-7" />
              )}
            </div>
            <span className="font-semibold tracking-tight">Slicera</span>
          </a>

          {/* Center: Copy */}
          <p className="text-sm text-neutral-600 dark:text-neutral-400 text-center sm:text-left">
            <span>© 2025 Slicera</span>
            <span className="px-2 text-neutral-400">|</span>
            <span>Crafted with purpose</span>
            {/* <span className="hidden sm:inline px-2 text-neutral-400">•</span> */}
            {/* <span className="block sm:inline">Part of the Slicera product suite</span> */}
          </p>

          {/* Right: Optional slot (edit or remove) */}
          <div className="flex items-center justify-center sm:justify-end gap-3 text-xs text-neutral-500 dark:text-neutral-400">
            <span className="rounded-full border border-neutral-200 dark:border-neutral-800 px-2.5 py-1 leading-none">
              v1.0
            </span>
            <a
              href="/legal/terms"
              className="hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
            >
              Terms
            </a>
            <span aria-hidden>·</span>
            <a
              href="/legal/privacy"
              className="hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
            >
              Privacy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function MothSwordSVG({ className = "h-7 w-7" }: { className?: string }) {
  // Minimal, brand-agnostic moth + sword mark as a placeholder.
  // Replace with your final logo when ready.
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Moth sword logo"
    >
      {/* Sword */}
      <path
        d="M32 6 L35 10 L33 24 L37 28 L32 30 L27 28 L31 24 L29 10 Z"
        className="fill-neutral-800 dark:fill-neutral-100"
      />
      <rect x="30.5" y="30" width="3" height="14" rx="1.5" className="fill-neutral-800 dark:fill-neutral-100" />
      <rect x="26" y="44" width="12" height="2.5" rx="1.25" className="fill-neutral-800 dark:fill-neutral-100" />

      {/* Moth wings */}
      <path
        d="M8 36c6-10 16-10 24-6 8-4 18-4 24 6-4 6-10 10-18 10-2 0-4-.3-6-.9-2 .6-4 .9-6 .9-8 0-14-4-18-10Z"
        className="fill-neutral-700/80 dark:fill-neutral-200/80"
      />
      <circle cx="24" cy="40" r="2" className="fill-neutral-900 dark:fill-neutral-50" />
      <circle cx="40" cy="40" r="2" className="fill-neutral-900 dark:fill-neutral-50" />

      {/* Subtle accent */}
      <path d="M32 48c0 3-2 6-6 6h12c-4 0-6-3-6-6Z" className="fill-neutral-600/40 dark:fill-neutral-300/30" />
    </svg>
  );
}
