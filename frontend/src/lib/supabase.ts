import type { Project } from '@/types';
import { USER_PERSONAS } from '@/types';

type SupabaseClient = any;

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseKey) return null;
  if (!supabaseInstance) {
    try {
      const pkg = '@supabase/' + 'supabase-js';
      const req = (typeof globalThis !== 'undefined' && (globalThis as any).require) || eval('require');
      const { createClient } = req(pkg);
      supabaseInstance = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
    } catch {
      return null;
    }
  }
  return supabaseInstance;
}

export const isSupabaseConfigured = (): boolean => Boolean(supabaseUrl && supabaseKey);

/**
 * Asynchronously syncs a project to Supabase.
 * Fails gracefully without throwing, logging status to console.
 */
export async function syncProjectToSupabase(project: Project): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;

  try {
    const row = {
      id: project.id,
      name: project.name,
      client: project.client,
      status: project.status,
      contract_value: project.contractValue,
      planned_cost: project.plannedCost,
      actual_cost: project.actualCost,
      billable_value: project.billableValue,
      billed_value: project.billedValue,
      paid_value: project.paidValue,
      progress: project.progress,
      baseline_version: project.baselineVersion ?? 'V1',
      start_date: project.startDate,
      end_date: project.endDate,
      revision_limit: project.agreementBaseline?.revisionLimit ?? 3,
      active_revision_count: project.activeRevisionCount,
      data_json: project,
    };

    const { error } = await sb.from('projects').upsert(row, { onConflict: 'id' });
    if (error) {
      console.warn(`[SUPABASE] sync project=${project.id} failed:`, error.message);
    } else {
      console.log(`[SUPABASE] synced project=${project.id} to cloud`);
    }
  } catch (err) {
    console.warn(`[SUPABASE] sync project error:`, err instanceof Error ? err.message : err);
  }
}

/**
 * Asynchronously deletes a project from Supabase.
 */
export async function deleteProjectFromSupabase(projectId: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;

  try {
    const { error } = await sb.from('projects').delete().eq('id', projectId);
    if (error) console.warn(`[SUPABASE] delete project=${projectId} failed:`, error.message);
  } catch (err) {
    console.warn(`[SUPABASE] delete project error:`, err instanceof Error ? err.message : err);
  }
}

/**
 * Sync all initial seed data (users + projects) to Supabase.
 */
export async function syncSeedToSupabase(projects: Project[]): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;

  try {
    // 1. Ensure Storage Bucket exists
    await sb.storage.createBucket('clara-files', { public: true }).catch(() => null);

    // 2. Sync Demo Users
    const users = Object.values(USER_PERSONAS).map((p) => ({
      id: p.id,
      name: p.name,
      role_title: p.roleTitle,
      department: p.department,
      initials: p.initials,
      avatar_bg: p.avatarBg,
      badge_bg: p.badgeBg,
      badge_text: p.badgeText,
      description: p.description,
      primary_focus: p.primaryFocus,
    }));
    await sb.from('demo_users').upsert(users, { onConflict: 'id' });

    // 3. Sync Meta
    await sb.from('demo_meta').upsert({
      key: 'data_version',
      value: '4',
    }, { onConflict: 'key' });

    // 4. Clean up any extra/test projects in Supabase not in the seed
    const seedIds = new Set(projects.map((p) => p.id));
    const { data: existingRows } = await sb.from('projects').select('id');
    if (existingRows) {
      for (const row of existingRows) {
        if (!seedIds.has(row.id)) {
          await sb.from('projects').delete().eq('id', row.id);
        }
      }
    }

    // 5. Sync Projects
    for (const p of projects) {
      await syncProjectToSupabase(p);
    }
    console.log(`[SUPABASE] full seed sync complete for ${projects.length} projects`);
  } catch (err) {
    console.warn(`[SUPABASE] seed sync error:`, err instanceof Error ? err.message : err);
  }
}

/**
 * Upload a file to Supabase Storage with local fallback.
 */
export async function uploadFileToSupabase(filePath: string, buffer: Buffer, mimeType: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;

  try {
    const { error } = await sb.storage.from('clara-files').upload(filePath, buffer, {
      contentType: mimeType,
      upsert: true,
    });
    if (error) {
      console.warn(`[SUPABASE] storage upload failed for ${filePath}:`, error.message);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Fetch all projects from Supabase.
 */
export async function fetchProjectsFromSupabase(): Promise<Project[] | null> {
  const sb = getSupabase();
  if (!sb) return null;

  try {
    const { data, error } = await sb.from('projects').select('*');
    if (error) {
      console.warn('[SUPABASE] fetch projects failed:', error.message);
      return null;
    }
    if (!data) return null;

    const projects: Project[] = [];
    for (const row of data) {
      let p: Project | null = null;
      if (row.data_json) {
        p = typeof row.data_json === 'string' ? JSON.parse(row.data_json) : (row.data_json as Project);
      }
      if (p) {
        if (row.name) p.name = row.name;
        if (row.client) p.client = row.client;
        if (row.status) p.status = row.status;
        if (typeof row.progress === 'number') p.progress = row.progress;
        if (row.start_date) p.startDate = row.start_date;
        if (row.end_date) p.endDate = row.end_date;
        if (typeof row.active_revision_count === 'number') p.activeRevisionCount = row.active_revision_count;
        projects.push(p);
      }
    }
    return projects;
  } catch (err) {
    console.warn('[SUPABASE] fetch projects error:', err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * Fetch a single project by ID from Supabase.
 */
export async function fetchProjectFromSupabase(id: string): Promise<Project | null> {
  const sb = getSupabase();
  if (!sb) return null;

  try {
    const { data, error } = await sb.from('projects').select('*').eq('id', id).maybeSingle();
    if (error) {
      console.warn(`[SUPABASE] fetch project=${id} failed:`, error.message);
      return null;
    }
    if (!data) return null;

    let p: Project | null = null;
    if (data.data_json) {
      p = typeof data.data_json === 'string' ? JSON.parse(data.data_json) : (data.data_json as Project);
    }
    if (p) {
      if (data.name) p.name = data.name;
      if (data.client) p.client = data.client;
      if (data.status) p.status = data.status;
      if (typeof data.progress === 'number') p.progress = data.progress;
      if (data.start_date) p.startDate = data.start_date;
      if (data.end_date) p.endDate = data.end_date;
      if (typeof data.active_revision_count === 'number') p.activeRevisionCount = data.active_revision_count;
    }
    return p;
  } catch (err) {
    console.warn(`[SUPABASE] fetch project=${id} error:`, err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * Download a file from Supabase Storage bucket clara-files.
 */
export async function downloadFileFromSupabase(filePath: string): Promise<Buffer | null> {
  const sb = getSupabase();
  if (!sb) return null;

  try {
    const { data, error } = await sb.storage.from('clara-files').download(filePath);
    if (error || !data) {
      return null;
    }
    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  }
}
