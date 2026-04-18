import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js@2';

const app = new Hono();

app.use('*', logger(console.log));
app.use('*', cors());

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

const BASE_PATH = '/make-server-88fc1426';

// Storage bucket
const PHOTO_BUCKET = 'make-88fc1426-cat-photos';

const initStorage = async () => {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some((b: any) => b.name === PHOTO_BUCKET);
    if (!bucketExists) {
      const { error } = await supabase.storage.createBucket(PHOTO_BUCKET, { public: true });
      if (error) console.error('Failed to create bucket:', error);
      else console.log(`Bucket ${PHOTO_BUCKET} created`);
    } else {
      console.log(`Bucket ${PHOTO_BUCKET} already exists`);
    }
  } catch (err) {
    console.error('Storage init error:', err);
  }
};
initStorage();

// Error handling
app.onError((err, c) => {
  console.error('Server Error:', err);
  return c.json({ error: err.message }, 500);
});

// Photo Upload API
const uploadPhotoHandler = async (c: any) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const folder = (formData.get('folder') as string) || 'general';

    if (!file) return c.json({ error: 'No file provided' }, 400);

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filename = `${folder}/${crypto.randomUUID()}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const { error } = await supabase.storage
      .from(PHOTO_BUCKET)
      .upload(filename, arrayBuffer, { contentType: file.type, upsert: true });

    if (error) {
      console.error('Storage upload error:', error);
      return c.json({ error: error.message }, 500);
    }

    const { data: { publicUrl } } = supabase.storage
      .from(PHOTO_BUCKET)
      .getPublicUrl(filename);

    console.log('Photo uploaded:', publicUrl);
    return c.json({ url: publicUrl });
  } catch (err: any) {
    console.error('Upload handler error:', err);
    return c.json({ error: err.message }, 500);
  }
};

app.post('/upload-photo', uploadPhotoHandler);
app.post(`${BASE_PATH}/upload-photo`, uploadPhotoHandler);

// Cats API
const getCatsHandler = async (c: any) => {
  console.log('GET /cats request received');
  try {
    const { data, error } = await supabase.from('cats').select('*').order('created_at', { ascending: true });
    if (error) {
      console.error('Database error fetching cats:', error);
      return c.json({ error: error.message }, 500);
    }
    return c.json(data || []);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
};

app.get('/cats', getCatsHandler);
app.get(`${BASE_PATH}/cats`, getCatsHandler);

const createCatHandler = async (c: any) => {
  try {
    const cat = await c.req.json();
    console.log('Creating cat:', cat);
    
    // id가 없으면 UUID 직접 생성 (cats 테이블 id 컬럼에 DEFAULT 없음)
    if (!cat.id || cat.id === 'undefined' || cat.id === 'null') {
      cat.id = crypto.randomUUID();
    }

    const { data, error } = await supabase.from('cats').insert(cat).select().single();
    
    if (error) {
      console.error('Error inserting cat:', error);
      return c.json({ error: error.message }, 500);
    }
    return c.json(data);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
};

app.post('/cats', createCatHandler);
app.post(`${BASE_PATH}/cats`, createCatHandler);

const updateCatHandler = async (c: any) => {
  try {
    const { catId } = c.req.param();
    const cat = await c.req.json();
    console.log(`Updating cat ${catId}:`, cat);
    
    // Explicitly mapping to match the table schema exactly
    const updateData = {
      name: cat.name,
      birth_year: cat.birth_year,
      birth_month: cat.birth_month,
      birth_day: cat.birth_day,
      gender: cat.gender,
      breed: cat.breed,
      neutered: cat.neutered,
      photo_url: cat.photo_url ?? null,
    };

    const { data, error } = await supabase
      .from('cats')
      .update(updateData)
      .eq('id', catId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating cat:', error);
      return c.json({ error: error.message }, 500);
    }
    return c.json(data);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
};

app.put('/cats/:catId', updateCatHandler);
app.put(`${BASE_PATH}/cats/:catId`, updateCatHandler);

const deleteCatHandler = async (c: any) => {
  const { catId } = c.req.param();
  const { error } = await supabase.from('cats').delete().eq('id', catId);
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ success: true });
};

app.delete('/cats/:catId', deleteCatHandler);
app.delete(`${BASE_PATH}/cats/:catId`, deleteCatHandler);

// Records API
const getRecordsHandler = async (c: any) => {
  const { catId } = c.req.param();
  try {
    const { data, error } = await supabase.from('health_records').select('*').eq('cat_id', catId);
    if (error) return c.json({ error: error.message }, 500);
    
    const records = (data || []).map(row => {
      let recordData = row.data;
      if (typeof recordData === 'string') {
        try { recordData = JSON.parse(recordData); } catch {}
      }
      return { ...recordData, type: row.type, date: row.date, id: row.id, catId: row.cat_id };
    });
    return c.json(records);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
};

app.get('/records/:catId', getRecordsHandler);
app.get(`${BASE_PATH}/records/:catId`, getRecordsHandler);

const getSpecificRecordHandler = async (c: any) => {
  const { catId, type, date } = c.req.param();
  try {
    const { data, error } = await supabase
      .from('health_records')
      .select('*')
      .eq('cat_id', catId)
      .eq('type', type)
      .eq('date', date)
      .maybeSingle();
    
    if (error) return c.json({ error: error.message }, 500);
    if (!data) return c.json(null);
    
    let recordData = data.data;
    if (typeof recordData === 'string') {
      try { recordData = JSON.parse(recordData); } catch {}
    }
    return c.json({ ...recordData, type: data.type, date: data.date, id: data.id, catId: data.cat_id });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
};

app.get('/records/:catId/:type/:date', getSpecificRecordHandler);
app.get(`${BASE_PATH}/records/:catId/:type/:date`, getSpecificRecordHandler);

const saveRecordHandler = async (c: any) => {
  try {
    const body = await c.req.json();
    const { catId, type, date } = body;
    
    // Check if exists
    const { data: existing } = await supabase
      .from('health_records')
      .select('id')
      .eq('cat_id', catId)
      .eq('type', type)
      .eq('date', date)
      .maybeSingle();
    
    if (existing) {
      const { error } = await supabase.from('health_records').update({ data: body }).eq('id', existing.id);
      if (error) return c.json({ error: error.message }, 500);
    } else {
      const { error } = await supabase.from('health_records').insert({ 
        cat_id: catId, 
        type, 
        date, 
        data: body 
      });
      if (error) return c.json({ error: error.message }, 500);
    }
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
};

app.post('/records', saveRecordHandler);
app.post(`${BASE_PATH}/records`, saveRecordHandler);

const deleteRecordHandler = async (c: any) => {
  const { catId, type, date } = c.req.param();

  try {
    // 1. 레코드를 먼저 조회해서 photoUrl 확인
    const { data: existing, error: fetchError } = await supabase
      .from('health_records')
      .select('data')
      .eq('cat_id', catId)
      .eq('type', type)
      .eq('date', date)
      .maybeSingle();

    if (fetchError) {
      console.error('deleteRecordHandler fetch error:', fetchError);
      return c.json({ error: fetchError.message }, 500);
    }

    // 2. photoUrl이 있으면 Storage에서도 삭제
    if (existing?.data) {
      let recordData = existing.data;
      if (typeof recordData === 'string') {
        try { recordData = JSON.parse(recordData); } catch {}
      }
      const photoUrl: string | undefined = recordData?.photoUrl;
      if (photoUrl) {
        // URL에서 버킷 이름 이후 경로 추출
        const bucketMarker = `/${PHOTO_BUCKET}/`;
        const markerIdx = photoUrl.indexOf(bucketMarker);
        if (markerIdx !== -1) {
          const storagePath = photoUrl.slice(markerIdx + bucketMarker.length);
          console.log('Deleting photo from storage:', storagePath);
          const { error: storageError } = await supabase.storage
            .from(PHOTO_BUCKET)
            .remove([storagePath]);
          if (storageError) {
            console.error('Storage delete error (non-fatal):', storageError);
          }
        }
      }
    }

    // 3. DB 레코드 삭제
    const { error } = await supabase
      .from('health_records')
      .delete()
      .eq('cat_id', catId)
      .eq('type', type)
      .eq('date', date);

    if (error) return c.json({ error: error.message }, 500);
    return c.json({ success: true });
  } catch (err: any) {
    console.error('deleteRecordHandler error:', err);
    return c.json({ error: err.message }, 500);
  }
};

app.delete('/records/:catId/:type/:date', deleteRecordHandler);
app.delete(`${BASE_PATH}/records/:catId/:type/:date`, deleteRecordHandler);

Deno.serve(app.fetch);