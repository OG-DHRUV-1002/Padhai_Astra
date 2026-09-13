
"use client";

import { useState, useEffect, useRef } from 'react';

const INACTIVITY_TIMEOUT = 15000; // 15 seconds

export function useDistractionDetector(isDetectionEnabled: boolean) {
  const [isDistracted, setIsDistracted] = useState(false);
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null);

  const resetInactivityTimer = () => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }
    inactivityTimer.current = setTimeout(() => {
      setIsDistracted(true);
    }, INACTIVITY_TIMEOUT);
  };

  useEffect(() => {
    if (!isDetectionEnabled) {
      setIsDistracted(false);
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
      return;
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsDistracted(true);
      }
    };
    
    const handleUserActivity = () => {
        resetInactivityTimer();
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);

    resetInactivityTimer();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);

      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
    };
  }, [isDetectionEnabled]);

  const resetDistraction = () => {
    setIsDistracted(false);
    resetInactivityTimer();
  };

  return { isDistracted, resetDistraction };
}
