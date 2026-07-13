import type { FC } from "react";

/**
 * Treatment variant of the bestseller badge.
 * Larger, higher-contrast design intended to draw attention to social proof.
 */
export const BestsellerBadgeProminent: FC = () => (
  <div
    className="inline-flex items-center gap-1.5 rounded-sm bg-amber-400 px-3 py-1.5 text-sm font-bold uppercase tracking-wide text-amber-950 shadow-sm"
    aria-label="Bestseller"
  >
    <span aria-hidden="true" className="text-base leading-none">★</span>
    <span>Bestseller</span>
  </div>
);
