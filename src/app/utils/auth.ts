import { supabase } from './supabase-client';

const SESSION_KEY = 'lwmc_auth_session';
const BIOMETRIC_CRED_KEY = 'lwmc_biometric_cred';
const BIOMETRIC_USER_KEY = 'lwmc_biometric_user';
const SESSION_DURATION_LONG  = 30 * 24 * 60 * 60 * 1000; // 30일 (자동 로그인)
const SESSION_DURATION_SHORT =      24 * 60 * 60 * 1000; // 1일 (일반 로그인)

export interface AuthSession {
  userId: string;
  loginTime: number;
  rememberMe: boolean;
}

// ── SHA-256 해시 ──────────────────────────────────────────────────────
export const hashSHA256 = async (text: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

// ── 세션 관리 ─────────────────────────────────────────────────────────
export const saveSession = (userId: string, rememberMe: boolean): void => {
  const session: AuthSession = { userId, loginTime: Date.now(), rememberMe };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

export const getSession = (): AuthSession | null => {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) return null;
    const session: AuthSession = JSON.parse(stored);
    const maxAge = session.rememberMe ? SESSION_DURATION_LONG : SESSION_DURATION_SHORT;
    if (Date.now() - session.loginTime > maxAge) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
};

export const clearSession = (): void => {
  localStorage.removeItem(SESSION_KEY);
};

// ── 비밀번호 로그인 (DB에서 sha256으로 직접 비교 — RPC 방식) ──────────
export const loginWithPassword = async (
  id: string,
  password: string,
  rememberMe: boolean
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log(`[Auth] Attempting login for id: "${id}"`);

    // ① RPC 방식 (SECURITY DEFINER → RLS 우회, PostgreSQL sha256 비교)
    const { data: rpcData, error: rpcError } = await supabase.rpc('verify_admin_password', {
      p_id: id,
      p_pwd: password,
    });

    console.log('[Auth] RPC result:', rpcData, '| RPC error:', rpcError?.message);

    if (!rpcError) {
      if (rpcData === true) {
        saveSession(id, rememberMe);
        console.log('[Auth] ✅ Login success via RPC');
        return { success: true };
      } else {
        return { success: false, error: '아이디 또는 비밀번호가 올바르지 않습니다.' };
      }
    }

    // ② RPC 실패 시 → 직접 조회 fallback (RLS가 꺼져 있어야 동작)
    console.warn('[Auth] RPC failed, trying direct query fallback...');

    const { data: row, error: fetchError } = await supabase
      .from('adm_pwd')
      .select('id, pwd')
      .eq('id', id)
      .maybeSingle();

    console.log('[Auth] Direct fetch result:', row ? `found (pwd length: ${row.pwd?.length})` : 'null', '| error:', fetchError?.message);

    if (fetchError || !row) {
      console.error('[Auth] Cannot read adm_pwd — RLS가 활성화되어 있을 수 있습니다. Supabase SQL Editor에서 실행: ALTER TABLE adm_pwd DISABLE ROW LEVEL SECURITY;');
      return { success: false, error: 'DB 접근 오류. Supabase RLS 설정을 확인해주세요.' };
    }

    // 저장된 pwd와 여러 형식으로 비교
    const storedPwd: string = row.pwd ?? '';
    const jsHashLower = await hashSHA256(password);
    const jsHashUpper = jsHashLower.toUpperCase();
    const pgBytea = `\\x${jsHashLower}`; // PostgreSQL bytea 출력 형식

    console.log('[Auth] Stored pwd preview:', storedPwd.substring(0, 20), '| length:', storedPwd.length);
    console.log('[Auth] JS hash preview:', jsHashLower.substring(0, 20));

    const matched =
      storedPwd === jsHashLower ||   // lowercase hex (표준)
      storedPwd === jsHashUpper ||   // uppercase hex
      storedPwd === pgBytea   ||     // PostgreSQL bytea \x...
      storedPwd === password;        // 평문 저장된 경우

    if (matched) {
      saveSession(id, rememberMe);
      console.log('[Auth] ✅ Login success via direct compare');
      return { success: true };
    }

    return { success: false, error: '아이디 또는 비밀번호가 올바르지 않습니다.' };
  } catch (err: any) {
    console.error('[Auth] Login exception:', err);
    return { success: false, error: '네트워크 오류가 발생했습니다.' };
  }
};

// ── WebAuthn 헬퍼 ─────────────────────────────────────────────────────
const bufferToBase64url = (buffer: ArrayBuffer): string =>
  btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

const base64urlToBuffer = (base64url: string): ArrayBuffer => {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
};

// ── 생체인증 가용성 확인 ──────────────────────────────────────────────
export const isBiometricAvailable = async (): Promise<boolean> => {
  if (!window.PublicKeyCredential) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
};

export const isBiometricRegistered = (): boolean =>
  !!localStorage.getItem(BIOMETRIC_CRED_KEY);

// ── 생체인증 등록 (비밀번호 로그인 성공 후 호출) ──────────────────────
export const registerBiometric = async (userId: string): Promise<boolean> => {
  try {
    const available = await isBiometricAvailable();
    if (!available) return false;

    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const userIdBytes = crypto.getRandomValues(new Uint8Array(32)); // opaque user id

    const credential = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { id: window.location.hostname, name: 'Life with My Cats' },
        user: {
          id: userIdBytes,
          name: userId,
          displayName: 'Life with My Cats Admin',
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },   // ES256
          { type: 'public-key', alg: -257 },  // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred',
        },
        timeout: 60000,
        attestation: 'none',
      },
    }) as PublicKeyCredential | null;

    if (!credential) return false;

    const credId = bufferToBase64url(credential.rawId);
    localStorage.setItem(BIOMETRIC_CRED_KEY, credId);
    localStorage.setItem(BIOMETRIC_USER_KEY, userId);
    console.log('[Auth] Biometric registered successfully');
    return true;
  } catch (err: any) {
    console.error('[Auth] Biometric registration failed:', err);
    return false;
  }
};

// ── 생체인증 로그인 ───────────────────────────────────────────────────
export const loginWithBiometric = async (
  rememberMe = true
): Promise<{ success: boolean; error?: string }> => {
  try {
    const credIdStr = localStorage.getItem(BIOMETRIC_CRED_KEY);
    const storedUserId = localStorage.getItem(BIOMETRIC_USER_KEY);

    if (!credIdStr || !storedUserId) {
      return { success: false, error: '등록된 생체인증이 없습니다.' };
    }

    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const credIdBuffer = base64urlToBuffer(credIdStr);

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [{ id: credIdBuffer, type: 'public-key' }],
        userVerification: 'required',
        timeout: 60000,
      },
    }) as PublicKeyCredential | null;

    if (!assertion) {
      return { success: false, error: '생체인증에 실패했습니다.' };
    }

    saveSession(storedUserId, rememberMe);
    console.log('[Auth] Biometric login success for userId:', storedUserId);
    return { success: true };
  } catch (err: any) {
    console.error('[Auth] Biometric login failed:', err);
    if (err.name === 'NotAllowedError') {
      return { success: false, error: '생체인증이 취소되었습니다.' };
    }
    return { success: false, error: '생체인증 중 오류가 발생했습니다.' };
  }
};