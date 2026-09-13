/**
 * ScrollReveal — reusable scroll-triggered reveal animation.
 *
 * Phase 1: Scaffold only. Renders children immediately without
 * animation. In Phase 2, this will use GSAP ScrollTrigger to
 * fade/slide elements in as they enter the viewport.
 *
 * Usage (Phase 2):
 *   <ScrollReveal direction="up" delay={0.2}>
 *     <Card>...</Card>
 *   </ScrollReveal>
 */

"use client";

import React, { useRef } from "react";
import { useGSAP } from "./gsap-provider";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RevealDirection = "up" | "down" | "left" | "right" | "none";

export interface ScrollRevealProps {
  children: React.ReactNode;
  /** Direction the element slides in from (default: "up") */
  direction?: RevealDirection;
  /** Delay in seconds before the animation starts (default: 0) */
  delay?: number;
  /** Duration of the reveal animation in seconds (default: 0.8) */
  duration?: number;
  /** Distance to travel in pixels (default: 60) */
  distance?: number;
  /** Additional CSS classes for the wrapper div */
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ScrollReveal({
  children,
  direction = "up",
  delay = 0,
  duration = 0.8,
  distance = 60,
  className = "",
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { isReady } = useGSAP();

  // Phase 2: useEffect with gsap.fromTo() + ScrollTrigger
  // useEffect(() => {
  //   if (!isReady || !ref.current) return;
  //
  //   const fromVars = getFromVars(direction, distance);
  //   gsap.fromTo(ref.current, fromVars, {
  //     ...toVars,
  //     delay,
  //     duration,
  //     scrollTrigger: {
  //       trigger: ref.current,
  //       start: "top 85%",
  //       toggleActions: "play none none reverse",
  //     },
  //   });
  // }, [isReady, direction, delay, duration, distance]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

export default ScrollReveal;
