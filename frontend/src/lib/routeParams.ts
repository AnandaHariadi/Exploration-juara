import { assertId } from './api';

export type ProjectParams = { params: Promise<{ id: string }> };
export type ProjectChildParams<K extends string> = { params: Promise<{ id: string } & Record<K, string>> };

export async function projectIdFrom(ctx: ProjectParams): Promise<string> {
  const { id } = await ctx.params;
  return assertId(id, 'ID proyek');
}
