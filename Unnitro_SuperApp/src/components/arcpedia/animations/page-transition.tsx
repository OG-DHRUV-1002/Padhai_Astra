/**
 * PageTransition — route-level transition animation.
 *
 * Phase 1: Scaffold only. Renders children immediately.
 * In Phase 2, this will use GSAP timeline animations to
 * create smooth page-enter / page-exit transitions.
 *
 * Usage (Phase 2):
 *   // In a layout.tsx:
 *   <PageTransition>
 *     {children}
 *   </PageTransition>
 */

"use client";

import React, { useRef } from "react";
import { useGSAP } from "./gsap-provider";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TransitionVariant = "fade" | "slide-up" | "slide-left" | "scale";

export interface PageTransitionProps {
  children: React.ReactNode;
  /** Transition style (default: "fade") */
  variant?: TransitionVariant;
  /** Duration of the transition in seconds (default: 0.5) */
  duration?: number;
  /** Additional CSS classes for the wrapper */
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PageTransition({
  children,
  variant = "fade",
  duration = 0.5,
  className = "",
}: PageTransitionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { isReady } = useGSAP();

  // Phase 2: useEffect with GSAP timeline
  // useEffect(() => {
  //   if (!isReady || !ref.current) return;
  //
  //   const tl = gsap.timeline();
  //   tl.fromTo(
  //     ref.current,
  //     getEnterFrom(variant),
  //     { ...getEnterTo(variant), duration }
  //   );
  //
  //   return () => { tl.kill(); };
  // }, [isReady, variant, duration]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

export default PageTransition;
