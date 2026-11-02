'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { PublicTenantDto, SessionContextDto } from '@eduflow/types';
import { apiFetch, ApiRequestError } from './api';

interface SessionState {
  session: SessionContextDto | null;
  publicTenant: PublicTenantDto | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const SessionContext = createContext<SessionState>({
  session: null,
  publicTenant: null,
  loading: true,
  refresh: async () => {},
  logout: async () => {},
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<SessionContextDto | null>(null);
  const [publicTenant, setPublicTenant] = useState<PublicTenantDto | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSession = useCallback(async () => {
    try {
      const [tenantData, sessionData] = await Promise.allSettled([
        apiFetch<PublicTenantDto>('/tenant'),
        apiFetch<SessionContextDto>('/auth/session'),
      ]);

      if (tenantData.status === 'fulfilled') {
        setPublicTenant(tenantData.value);
      }

      if (sessionData.status === 'fulfilled') {
        setSession(sessionData.value);
      } else {
        setSession(null);
      }
    } catch {
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const logout = async () => {
    try {
      await apiFetch<void>('/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    setSession(null);
    window.location.href = '/login';
  };

  return (
    <SessionContext.Provider
      value={{
        session,
        publicTenant,
        loading,
        refresh: fetchSession,
        logout,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
