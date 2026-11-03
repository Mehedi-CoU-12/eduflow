'use client';

import React, { createContext, useContext, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { PublicTenantDto, SessionContextDto } from '@eduflow/types';
import { apiFetch } from './api';

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
  const queryClient = useQueryClient();

  const { data: publicTenant = null } = useQuery<PublicTenantDto | null>({
    queryKey: ['publicTenant'],
    queryFn: async () => {
      try {
        return await apiFetch<PublicTenantDto>('/tenant');
      } catch {
        return null;
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: session = null,
    isLoading: sessionLoading,
    refetch,
  } = useQuery<SessionContextDto | null>({
    queryKey: ['session'],
    queryFn: async () => {
      try {
        return await apiFetch<SessionContextDto>('/auth/session');
      } catch {
        return null;
      }
    },
    staleTime: 60 * 1000,
  });

  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const logout = async () => {
    try {
      await apiFetch<void>('/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    queryClient.setQueryData(['session'], null);
    queryClient.clear();
    window.location.href = '/login';
  };

  return (
    <SessionContext.Provider
      value={{
        session,
        publicTenant,
        loading: sessionLoading,
        refresh,
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
