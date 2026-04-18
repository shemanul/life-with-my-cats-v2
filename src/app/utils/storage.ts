import type {
  FoodRecord,
  VitalityRecord,
  MedicationRecord,
  ToothBrushRecord,
  PoopRecord,
  VomitRecord,
} from '../types/health-record';
import { supabase, serverFetch, serverUpload } from './supabase-client';
import { fetchCats, fetchCatById } from './cat-storage';

export { fetchCats as getCats, fetchCatById as getCatById };

/**
 * USE_DIRECT: VITE_SUPABASE_PROJECT_ID 환경변수가 있으면 (Vercel 배포)
 * Supabase 직접 호출, 없으면 (Figma Make 프리뷰) Edge Function 경유
 */
const USE_DIRECT = !!import.meta.env.VITE_SUPABASE_PROJECT_ID;
const PHOTO_BUCKET = 'make-88fc1426-cat-photos';

// ─── Photo Upload ────────────────────────────────────────────────────

export const uploadPhotoToStorage = async (file: File, folder = 'general'): Promise<string> => {
  if (!USE_DIRECT) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    const { url } = await serverUpload('/upload-photo', formData);
    return url;
  }
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const filename = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(filename, file, { contentType: file.type, upsert: true });
  if (error) { console.error('[storage] upload error:', error); throw new Error(error.message); }
  const { data: { publicUrl } } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(filename);
  return publicUrl;
};

// ─── Health Records (direct Supabase) ───────────────────────────────

const rowToRecord = (row: any) => {
  let recordData = row.data;
  if (typeof recordData === 'string') {
    try { recordData = JSON.parse(recordData); } catch { /* ignore */ }
  }
  return { ...recordData, type: row.type, date: row.date, id: row.id, catId: row.cat_id };
};

const getRecord = async <T>(catId: string, type: string, date: string): Promise<T | undefined> => {
  try {
    if (!USE_DIRECT) {
      const data = await serverFetch(`/records/${catId}/${type}/${date}`);
      return data as T;
    }
    const { data, error } = await supabase
      .from('health_records')
      .select('*')
      .eq('cat_id', catId)
      .eq('type', type)
      .eq('date', date)
      .maybeSingle();
    if (error || !data) return undefined;
    return rowToRecord(data) as T;
  } catch (err) {
    console.error(`[storage] getRecord error (${type}/${date}):`, err);
    return undefined;
  }
};

const getRecordsByCat = async <T>(catId: string, type: string): Promise<T[]> => {
  try {
    if (!USE_DIRECT) {
      const records = await serverFetch(`/records/${catId}`);
      return (records || []).filter((r: any) => r.type === type) as T[];
    }
    const { data, error } = await supabase
      .from('health_records')
      .select('*')
      .eq('cat_id', catId)
      .eq('type', type);
    if (error) return [];
    return (data || []).map(rowToRecord) as T[];
  } catch (err) {
    console.error(`[storage] getRecordsByCat error (${type}):`, err);
    return [];
  }
};

const saveRecord = async <T extends { id: string; catId: string; date: string }>(
  record: T,
  type: string
): Promise<void> => {
  try {
    if (!USE_DIRECT) {
      await serverFetch('/records', {
        method: 'POST',
        body: JSON.stringify({ ...record, type }),
      });
      return;
    }
    const { catId, date } = record;
    const { data: existing } = await supabase
      .from('health_records')
      .select('id')
      .eq('cat_id', catId)
      .eq('type', type)
      .eq('date', date)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('health_records')
        .update({ data: record })
        .eq('id', existing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase
        .from('health_records')
        .insert({ cat_id: catId, type, date, data: record });
      if (error) throw new Error(error.message);
    }
  } catch (err) {
    console.error(`[storage] saveRecord error (${type}):`, err);
    throw err;
  }
};

const deleteRecord = async (catId: string, type: string, date: string): Promise<void> => {
  if (!USE_DIRECT) {
    await serverFetch(`/records/${catId}/${type}/${date}`, { method: 'DELETE' });
    return;
  }
  const { error } = await supabase
    .from('health_records')
    .delete()
    .eq('cat_id', catId)
    .eq('type', type)
    .eq('date', date);
  if (error) throw new Error(error.message);
};

const parseRecordId = (id: string): { catId: string; date: string } | null => {
  const parts = id.split('-');
  if (parts.length >= 2) {
    return { catId: parts[0], date: parts.slice(1).join('-') };
  }
  return null;
};

// ─── Typed helpers ──────────────────────────────────────────────────

export const getFoodRecord = (catId: string, date: string) => getRecord<FoodRecord>(catId, 'food', date);
export const saveFoodRecord = (record: FoodRecord) => saveRecord(record, 'food');
export const getFoodRecordsByCat = (catId: string) => getRecordsByCat<FoodRecord>(catId, 'food');

export const getVitalityRecord = (catId: string, date: string) => getRecord<VitalityRecord>(catId, 'vitality', date);
export const saveVitalityRecord = (record: VitalityRecord) => saveRecord(record, 'vitality');
export const getVitalityRecordsByCat = (catId: string) => getRecordsByCat<VitalityRecord>(catId, 'vitality');

export const getMedicationRecord = (catId: string, date: string) => getRecord<MedicationRecord>(catId, 'medication', date);
export const saveMedicationRecord = (record: MedicationRecord) => saveRecord(record, 'medication');
export const getMedicationRecordsByCat = (catId: string) => getRecordsByCat<MedicationRecord>(catId, 'medication');

export const getToothBrushRecord = (catId: string, date: string) => getRecord<ToothBrushRecord>(catId, 'toothbrush', date);
export const saveToothBrushRecord = (record: ToothBrushRecord) => saveRecord(record, 'toothbrush');
export const getToothBrushRecordsByCat = (catId: string) => getRecordsByCat<ToothBrushRecord>(catId, 'toothbrush');

export const getPoopRecord = (catId: string, date: string) => getRecord<PoopRecord>(catId, 'poop', date);
export const savePoopRecord = (record: PoopRecord) => saveRecord(record, 'poop');
export const getPoopRecordsByCat = (catId: string) => getRecordsByCat<PoopRecord>(catId, 'poop');

export const getVomitRecord = (catId: string, date: string) => getRecord<VomitRecord>(catId, 'vomit', date);
export const saveVomitRecord = (record: VomitRecord) => saveRecord(record, 'vomit');
export const getVomitRecordsByCat = (catId: string) => getRecordsByCat<VomitRecord>(catId, 'vomit');

export const deleteFoodRecord = async (id: string) => { const p = parseRecordId(id); if (p) await deleteRecord(p.catId, 'food', p.date); };
export const deleteVitalityRecord = async (id: string) => { const p = parseRecordId(id); if (p) await deleteRecord(p.catId, 'vitality', p.date); };
export const deleteMedicationRecord = async (id: string) => { const p = parseRecordId(id); if (p) await deleteRecord(p.catId, 'medication', p.date); };
export const deleteToothBrushRecord = async (id: string) => { const p = parseRecordId(id); if (p) await deleteRecord(p.catId, 'toothbrush', p.date); };
export const deletePoopRecord = async (id: string) => { const p = parseRecordId(id); if (p) await deleteRecord(p.catId, 'poop', p.date); };
export const deleteVomitRecord = async (id: string) => { const p = parseRecordId(id); if (p) await deleteRecord(p.catId, 'vomit', p.date); };

export const deleteHealthRecord = async (catId: string, type: string, date: string): Promise<void> => {
  await deleteRecord(catId, type, date);
};

export const getTotalRecordCount = async (catId: string): Promise<number> => {
  try {
    if (!USE_DIRECT) {
      const records = await serverFetch(`/records/${catId}`);
      return (records || []).length;
    }
    const { count, error } = await supabase
      .from('health_records')
      .select('*', { count: 'exact', head: true })
      .eq('cat_id', catId);
    if (error) return 0;
    return count || 0;
  } catch {
    return 0;
  }
};
