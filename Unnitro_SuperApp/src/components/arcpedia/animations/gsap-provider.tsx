/**
 * GSAP Provider — registers GSAP plugins and provides a context
 * for animation configuration across the app.
 *
 * Phase 1: Scaffold only. GSAP will be installed as an npm
 * dependency in Phase 2. This file defines the component
 * structure and context API so other components can be built
 * against a stable interface.
 *
 * Usage (Phase 2):
 *   Wrap your layout with <GSAPProvider> to register ScrollTrigger
 *   and other GSAP plugins once on mount.
 */

"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface GSAPContextValue {
  /** Whether GSAP and its plugins are registered and ready */
  isReady: boolean;
}

const GSAPContext = createContext<GSAPContextValue>({ isReady: false });

/**
 * Hook to check if GSAP is initialised.
 *
 * @example
 * const { isReady } = useGSAP();
 * if (!isReady) return <Skeleton />;
 */
export function useGSAP(): GSAPContextValue {
  return useContext(GSAPContext);
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface GSAPProviderProps {
  children: React.ReactNode;
}

/**
 * Registers GSAP plugins (ScrollTrigger, etc.) on first mount.
 *
 * Phase 2 will add:
 *   import gsap from "gsap";
 *   import { ScrollTrigger } from "gsap/ScrollTrigger";
 *   gsap.registerPlugin(ScrollTrigger);
 */
export function GSAPProvider({ children }: GSAPProviderProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Phase 2: Register GSAP plugins here
    // gsap.registerPlugin(ScrollTrigger);

    // For now, mark as ready immediately
    setIsReady(true);

    return () => {
      // Phase 2: Kill all ScrollTrigger instances on unmount
      // ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <GSAPContext.Provider value={{ isReady }}>
      {children}
    </GSAPContext.Provider>
  );
}

export default GSAPProvider;
