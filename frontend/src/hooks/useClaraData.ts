'use client';

import React from 'react';
import type { AiHealth, Alert, PortfolioSummary, Project, UserPersonaId } from '@/types';
import { dataClient } from '@/services/dataClient';

/**
 * Fetch a server resource and refetch whenever any mutation succeeds. React
 * state only mirrors the server; nothing here is a second source of truth.
 */
function useResource<T>(load: () => Promise<T>, subscribe: (listener: () => void) => () => void, initialValue: T, shouldPoll?: (data: T) => boolean) {
  const [data, setData] = React.useState<T>(initialValue);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const mounted = React.useRef(false);
  const requestId = React.useRef(0);

  const refresh = React.useCallback(async () => {
    const current = ++requestId.current;
    try {
      const next = await load();
      if (mounted.current && current === requestId.current) {
        setData(next);
        setError(null);
      }
    } catch (cause) {
      if (mounted.current && current === requestId.current) setError(cause instanceof Error ? cause.message : 'Gagal memuat data.');
    } finally {
      if (mounted.current && current === requestId.current) setLoading(false);
    }
  }, [load]);

  React.useEffect(() => {
    mounted.current = true;
    setLoading(true);
    void refresh();
    const unsubscribe = subscribe(() => void refresh());
    return () => {
      mounted.current = false;
      requestId.current += 1;
      unsubscribe();
    };
  }, [refresh, subscribe]);

  // Poll only while something is being processed (e.g. AI document analysis); stops automatically.
  const polling = shouldPoll ? shouldPoll(data) : false;
  React.useEffect(() => {
    if (!polling) return;
    const timer = setInterval(() => void refresh(), 2000);
    return () => clearInterval(timer);
  }, [polling, refresh]);

  return { data, refresh, loading, error };
}

const processing = (p?: Project) => Boolean(p && (p.documents.some((d) => d.status === 'PROCESSING') || p.extraction?.status === 'PROCESSING'));

const subscribeData = (listener: () => void) => dataClient.subscribeData(listener);
const subscribePersona = (listener: () => void) => dataClient.subscribePersona(listener);
const subscribeNever = () => () => {};

export function useProjects() {
  const r = useResource<Project[]>(dataClient.getProjects, subscribeData, [], (list) => list.some(processing));
  return { projects: r.data, refreshProjects: r.refresh, loading: r.loading, error: r.error };
}

export function useProject(id: string) {
  const load = React.useCallback(() => dataClient.getProject(id), [id]);
  const r = useResource<Project | undefined>(load, subscribeData, undefined, processing);
  return { project: r.data, refreshProject: r.refresh, loading: r.loading, error: r.error };
}

export function useAlerts() {
  const r = useResource<Alert[]>(dataClient.getAllAlerts, subscribeData, []);
  return { alerts: r.data, refreshAlerts: r.refresh, loading: r.loading, error: r.error };
}

export function useDashboardSummary() {
  const r = useResource<PortfolioSummary | null>(dataClient.getDashboardSummary, subscribeData, null);
  return { summary: r.data, refreshSummary: r.refresh, loading: r.loading, error: r.error };
}

/** Checked on mount and on demand (retry button); no background polling. */
export function useAiHealth() {
  const r = useResource<AiHealth | null>(dataClient.getAiHealth, subscribeNever, null);
  return { health: r.data, refreshHealth: r.refresh, loading: r.loading };
}

export function useActivePersona() {
  const r = useResource<UserPersonaId>(dataClient.getActivePersona, subscribePersona, 'BUDI');
  const { refresh } = r;
  const selectPersona = React.useCallback(async (persona: UserPersonaId) => {
    await dataClient.setActivePersona(persona);
    await refresh();
  }, [refresh]);
  return { personaId: r.data, selectPersona, refreshPersona: refresh, loading: r.loading, error: r.error };
}
