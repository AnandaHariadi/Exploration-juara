'use client';

import React from 'react';
import type { Alert, Project, UserPersonaId } from '@/types';
import { dataClient } from '@/services/dataClient';

function useResource<T>(
  load: () => Promise<T>,
  subscribe: (listener: () => void) => () => void,
  initialValue: T,
) {
  const [data, setData] = React.useState<T>(initialValue);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const mounted = React.useRef(false);
  const requestId = React.useRef(0);

  const refresh = React.useCallback(async () => {
    const currentRequest = ++requestId.current;
    try {
      const next = await load();
      if (mounted.current && currentRequest === requestId.current) {
        setData(next);
        setError(null);
      }
    } catch (cause) {
      if (mounted.current && currentRequest === requestId.current) {
        setError(cause instanceof Error ? cause.message : 'Gagal memuat data.');
      }
    } finally {
      if (mounted.current && currentRequest === requestId.current) setLoading(false);
    }
  }, [load]);

  React.useEffect(() => {
    mounted.current = true;
    void refresh();
    const unsubscribe = subscribe(() => { void refresh(); });
    return () => {
      mounted.current = false;
      requestId.current += 1;
      unsubscribe();
    };
  }, [refresh, subscribe]);

  return { data, refresh, loading, error };
}

const loadProjects = () => dataClient.getProjects();
const loadAlerts = () => dataClient.getAllAlerts();
const loadPersona = () => dataClient.getActivePersona();
const subscribeData = (listener: () => void) => dataClient.subscribeData(listener);
const subscribePersona = (listener: () => void) => dataClient.subscribePersona(listener);

export function useProjects() {
  const resource = useResource<Project[]>(loadProjects, subscribeData, []);
  return { projects: resource.data, refreshProjects: resource.refresh, loading: resource.loading, error: resource.error };
}

export function useAlerts() {
  const resource = useResource<Alert[]>(loadAlerts, subscribeData, []);
  return { alerts: resource.data, refreshAlerts: resource.refresh, loading: resource.loading, error: resource.error };
}

export function useActivePersona() {
  const resource = useResource<UserPersonaId>(loadPersona, subscribePersona, 'BUDI');
  const selectPersona = React.useCallback(async (persona: UserPersonaId) => {
    await dataClient.setActivePersona(persona);
    await resource.refresh();
  }, [resource.refresh]);
  return { personaId: resource.data, selectPersona, refreshPersona: resource.refresh, loading: resource.loading, error: resource.error };
}
