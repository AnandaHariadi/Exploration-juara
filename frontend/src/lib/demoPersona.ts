import { AsyncLocalStorage } from 'node:async_hooks';
import type { UserPersonaId } from '@/types';

export const DEMO_PERSONA_COOKIE = 'clara_demo_persona';

const personas: readonly UserPersonaId[] = ['BUDI', 'SITI', 'HENDRA', 'ADMIN'];
const requestPersona = new AsyncLocalStorage<UserPersonaId>();

export function asDemoPersona(value: string | undefined): UserPersonaId {
  return personas.includes(value as UserPersonaId) ? value as UserPersonaId : 'BUDI';
}

export function withDemoPersona<T>(value: string | undefined, action: () => Promise<T>): Promise<T> {
  return requestPersona.run(asDemoPersona(value), action);
}

export function currentDemoPersona(): UserPersonaId {
  return requestPersona.getStore() ?? 'BUDI';
}
