'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

function isAbortError(error: unknown): boolean {
  return error instanceof Error && (
    error.name === 'AbortError' ||
    error.message.includes('aborted') ||
    error.message.includes('ECONNRESET')
  );
}

interface MaintenanceContextType {
  isServerDown: boolean;
}

const MaintenanceContext = createContext<MaintenanceContextType>({ isServerDown: false });

export function useMaintenanceStatus() {
  return useContext(MaintenanceContext);
}

export function MaintenanceProvider({ children }: { children: ReactNode }) {
  const [isServerDown, setIsServerDown] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('/api/proxy/system-status', {
          cache: 'no-store',
          signal: AbortSignal.timeout(5000),
        });
        const down = !res.ok;
        setIsServerDown(down);
        document.documentElement.style.setProperty('--banner-height', down ? '36px' : '0px');
      } catch (error) {
        if (isAbortError(error)) {
          return;
        }

        setIsServerDown(true);
        document.documentElement.style.setProperty('--banner-height', '36px');
      }
    };
    check();
  }, []);

  return (
    <MaintenanceContext.Provider value={{ isServerDown }}>
      {children}
    </MaintenanceContext.Provider>
  );
}
