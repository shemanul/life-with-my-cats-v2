import { supabase, serverFetch } from './supabase-client';
import type { Cat } from '../types/health-record';

/**
 * USE_DIRECT: Vercel 환경(VITE_ 환경변수 설정됨)에서는 Supabase 직접 접근,
 * Figma Make 프리뷰에서는 Edge Function 경유
 */
const USE_DIRECT = !!import.meta.env.VITE_SUPABASE_PROJECT_ID;

/**
 * DB Row structure:
 * cats (id text, name text, birth_year int, birth_month int, birth_day int,
 *       gender text, breed text, neutered boolean, created_at timestamptz, photo_url text)
 */

const rowToCat = (row: any): Cat => {
  let birthDateStr = '';
  if (row.birth_year) {
    const y = row.birth_year;
    const m = String(row.birth_month || 1).padStart(2, '0');
    const d = String(row.birth_day || 1).padStart(2, '0');
    birthDateStr = `${y}-${m}-${d}`;
  }
  return {
    id: String(row.id),
    name: row.name || '이름 없음',
    breed: row.breed || '',
    birthDate: birthDateStr,
    gender: row.gender || 'female',
    neutered: row.neutered !== undefined ? !!row.neutered : true,
    photoUrl: row.photo_url || undefined,
  };
};

const catToRow = (cat: Partial<Cat>) => {
  const row: any = {
    name: cat.name,
    breed: cat.breed,
    gender: cat.gender,
    neutered: cat.neutered,
    photo_url: cat.photoUrl || null,
  };
  if (cat.birthDate) {
    const parts = cat.birthDate.split(/[-./]/).map(Number);
    if (parts.length >= 3) {
      row.birth_year = parts[0];
      row.birth_month = parts[1];
      row.birth_day = parts[2];
    }
  }
  return row;
};

export const fetchCats = async (): Promise<Cat[]> => {
  try {
    if (!USE_DIRECT) {
      const data = await serverFetch('/cats');
      if (!data || !Array.isArray(data)) return [];
      return data.map(rowToCat);
    }
    const { data, error } = await supabase
      .from('cats')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) { console.error('[cat-storage] fetchCats error:', error); return []; }
    return (data || []).map(rowToCat);
  } catch (err) {
    console.error('[cat-storage] fetchCats exception:', err);
    return [];
  }
};

export const fetchCatById = async (id: string): Promise<Cat | undefined> => {
  try {
    if (!USE_DIRECT) {
      const cats = await fetchCats();
      return cats.find(c => String(c.id) === String(id));
    }
    const { data, error } = await supabase.from('cats').select('*').eq('id', id).maybeSingle();
    if (error || !data) return undefined;
    return rowToCat(data);
  } catch { return undefined; }
};

export const createCat = async (cat: Omit<Cat, 'id'> & { id?: string }): Promise<Cat> => {
  if (!USE_DIRECT) {
    const row = catToRow(cat);
    const data = await serverFetch('/cats', { method: 'POST', body: JSON.stringify(row) });
    return rowToCat(data);
  }
  const id = cat.id || crypto.randomUUID();
  const row = { id, ...catToRow(cat) };
  const { data, error } = await supabase.from('cats').insert(row).select().single();
  if (error) { console.error('[cat-storage] createCat error:', error); throw new Error(error.message); }
  return rowToCat(data);
};

export const updateCat = async (cat: Cat): Promise<Cat> => {
  if (!USE_DIRECT) {
    const row = catToRow(cat);
    const data = await serverFetch(`/cats/${cat.id}`, { method: 'PUT', body: JSON.stringify(row) });
    return rowToCat(data);
  }
  const row = catToRow(cat);
  const { data, error } = await supabase.from('cats').update(row).eq('id', cat.id).select().single();
  if (error) { console.error('[cat-storage] updateCat error:', error); throw new Error(error.message); }
  return rowToCat(data);
};

export const deleteCat = async (id: string): Promise<void> => {
  if (!USE_DIRECT) {
    await serverFetch(`/cats/${id}`, { method: 'DELETE' });
    return;
  }
  const { error } = await supabase.from('cats').delete().eq('id', id);
  if (error) { console.error('[cat-storage] deleteCat error:', error); throw new Error(error.message); }
};