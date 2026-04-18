import { createClient } from '@supabase/supabase-js';
import { projectId as _projectId, publicAnonKey as _publicAnonKey } from '/utils/supabase/info';

// Vercel 환경변수 우선 사용, 없으면 Figma Make 하드코딩 값 폴백
const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || "bwifhsxbsydzrqznwjnl";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3aWZoc3hic3lkenJxem53am5sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNzQxMDMsImV4cCI6MjA5MTk1MDEwM30.9bZU0MEX9zb_XKQTvw0dQAn46uiNKjMQyApxCQKPzD8";

const supabaseUrl = `https://${projectId}.supabase.co`;
const supabaseKey = supabaseAnonKey;

let supabaseInstance: any = null;

export const getSupabase = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseKey);
  }
  return supabaseInstance;
};

export const supabase = getSupabase();

export const serverFetch = async (path: string, options: RequestInit = {}) => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const functionName = 'make-server-88fc1426';
  
  // Use the standard Supabase Function URL format
  const url = `${supabaseUrl}/functions/v1/${functionName}${cleanPath}`;
  
  console.log(`[Frontend] Fetching: ${url}`);
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Frontend] Server Error (${url}):`, errorText);
      throw new Error(`Server request failed: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`[Frontend] Received data from ${path}:`, data);
    return data;
  } catch (err) {
    console.error(`[Frontend] Network or Parse Error:`, err);
    throw err;
  }
};

/** FormData(파일 등) 업로드용 - Content-Type 헤더를 직접 지정하지 않아야 browser가 multipart boundary를 자동 설정함 */
export const serverUpload = async (path: string, formData: FormData): Promise<any> => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const functionName = 'make-server-88fc1426';
  const url = `${supabaseUrl}/functions/v1/${functionName}${cleanPath}`;

  console.log(`[Frontend] Uploading to: ${url}`);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${supabaseKey}`,
      // Content-Type 미설정 → 브라우저가 multipart/form-data; boundary=... 자동 설정
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Frontend] Upload Error (${url}):`, errorText);
    throw new Error(`Upload failed (${response.status}): ${errorText}`);
  }

  return response.json();
};