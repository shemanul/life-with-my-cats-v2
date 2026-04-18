import { useState, useEffect } from 'react';
import { Loader2, Eye, EyeOff, Fingerprint } from 'lucide-react';
import {
  loginWithPassword,
  loginWithBiometric,
  isBiometricAvailable,
  isBiometricRegistered,
  registerBiometric,
} from '../utils/auth';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [error, setError] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricRegistered, setBiometricRegistered] = useState(false);
  const [biometricStatus, setBiometricStatus] = useState(''); // 상태 안내 메시지

  // 지문 등록 제안 모달 상태
  const [showBiometricOffer, setShowBiometricOffer] = useState(false);
  const [pendingUserId, setPendingUserId] = useState('');
  const [offerLoading, setOfferLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const available = await isBiometricAvailable();
      const registered = isBiometricRegistered();
      setBiometricAvailable(available);
      setBiometricRegistered(registered);
      console.log('[Biometric] available:', available, '| registered:', registered, '| isSecureContext:', window.isSecureContext);
    })();
  }, []);

  // 비밀번호 로그인
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id.trim() || !password.trim()) {
      setError('아이디와 비밀번호를 입력해주세요.');
      return;
    }
    setLoading(true);
    setError('');

    const result = await loginWithPassword(id.trim(), password, rememberMe);
    setLoading(false);

    if (result.success) {
      // 지문 사용 가능한데 아직 등록 안 된 경우 → 등록 제안
      if (biometricAvailable && !biometricRegistered) {
        setPendingUserId(id.trim());
        setShowBiometricOffer(true);
      } else {
        onLoginSuccess();
      }
    } else {
      setError(result.error || '로그인 실패');
    }
  };

  // 지문 로그인
  const handleBiometricLogin = async () => {
    setBiometricLoading(true);
    setError('');
    setBiometricStatus('');
    const result = await loginWithBiometric(rememberMe);
    setBiometricLoading(false);

    if (result.success) {
      onLoginSuccess();
    } else {
      setError(result.error || '생체인증 실패');
    }
  };

  // 지문 등록 (로그인 화면에서 직접)
  const handleBiometricRegister = async () => {
    if (!id.trim()) {
      setError('먼저 아이디를 입력해주세요.');
      return;
    }
    setBiometricLoading(true);
    setBiometricStatus('');
    const success = await registerBiometric(id.trim());
    setBiometricLoading(false);
    if (success) {
      setBiometricRegistered(true);
      setBiometricStatus('✅ 지문 등록 완료! 이제 지문으로 로그인할 수 있어요.');
    } else {
      setBiometricStatus('❌ 등록 실패. 기기에서 지문/Face ID를 지원하는지 확인해주세요.');
    }
  };

  // 지문 등록 수락
  const handleBiometricOfferAccept = async () => {
    setOfferLoading(true);
    const success = await registerBiometric(pendingUserId);
    setOfferLoading(false);
    if (success) setBiometricRegistered(true);
    setShowBiometricOffer(false);
    onLoginSuccess();
  };

  // 지문 등록 거절
  const handleBiometricOfferDecline = () => {
    setShowBiometricOffer(false);
    onLoginSuccess();
  };

  // ── 지문 등록 제안 모달 ──────────────────────────────────────────────
  if (showBiometricOffer) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-100 to-pink-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 shadow-xl max-w-sm w-full text-center">
          <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Fingerprint className="w-10 h-10 text-pink-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">지문 로그인 등록</h2>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            다음부터 지문으로 빠르게<br />로그인할 수 있어요. 등록하시겠어요?
          </p>
          <button
            onClick={handleBiometricOfferAccept}
            disabled={offerLoading}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full h-12 font-bold mb-3 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {offerLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Fingerprint className="w-4 h-4" />}
            지문 등록하기
          </button>
          <button
            onClick={handleBiometricOfferDecline}
            className="w-full text-gray-400 text-sm py-2 hover:text-gray-600 transition-colors"
          >
            나중에
          </button>
        </div>
      </div>
    );
  }

  // ── 메인 로그인 화면 ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-100 to-pink-50 flex items-center justify-center p-6">
      <div className="max-w-sm w-full">

        {/* 로고 영역 */}
        <div className="text-center mb-10">
          <div className="text-7xl mb-3 animate-bounce" style={{ animationDuration: '2s' }}>🐱</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-1">Life with My Cats</h1>
          <p className="text-gray-500 text-sm">우리 아이들 건강관리</p>
        </div>

        {/* 로그인 카드 */}
        <div className="bg-white rounded-3xl p-6 shadow-xl">
          <form onSubmit={handlePasswordLogin} className="space-y-4">

            {/* 아이디 */}
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">아이디</label>
              <input
                type="text"
                value={id}
                onChange={e => { setId(e.target.value); setError(''); }}
                placeholder="아이디를 입력하세요"
                className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3 text-gray-800 bg-gray-50 focus:outline-none focus:border-pink-300 focus:bg-white transition-all"
                autoComplete="username"
                disabled={loading}
              />
            </div>

            {/* 비밀번호 */}
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">비밀번호</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="비밀번호를 입력하세요"
                  className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3 pr-12 text-gray-800 bg-gray-50 focus:outline-none focus:border-pink-300 focus:bg-white transition-all"
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* 자동 로그인 */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <div
                onClick={() => setRememberMe(!rememberMe)}
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                  rememberMe ? 'bg-pink-500 border-pink-500' : 'bg-white border-gray-300'
                }`}
              >
                {rememberMe && <span className="text-white text-xs font-bold">✓</span>}
              </div>
              <span className="text-sm text-gray-600">자동 로그인 <span className="text-gray-400">(30일간 유지)</span></span>
            </label>

            {/* 에러 메시지 */}
            {error && (
              <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
                <p className="text-red-500 text-sm text-center">⚠️ {error}</p>
              </div>
            )}

            {/* 상태 메시지 */}
            {biometricStatus && (
              <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3">
                <p className="text-blue-600 text-sm text-center">{biometricStatus}</p>
              </div>
            )}

            {/* 로그인 버튼 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full h-12 font-bold hover:shadow-lg active:scale-95 transition-all disabled:opacity-60 mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  로그인 중...
                </span>
              ) : '로그인'}
            </button>
          </form>

          {/* 지문 영역 */}
          {biometricAvailable ? (
            <>
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-400 font-medium">또는</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              {biometricRegistered ? (
                /* 등록됨 → 지문 로그인 버튼 */
                <button
                  onClick={handleBiometricLogin}
                  disabled={biometricLoading}
                  className="w-full flex items-center justify-center gap-3 bg-gray-50 border-2 border-gray-100 rounded-full h-12 font-semibold text-gray-700 hover:bg-pink-50 hover:border-pink-200 active:scale-95 transition-all disabled:opacity-60"
                >
                  {biometricLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-pink-500" />
                  ) : (
                    <Fingerprint className="w-5 h-5 text-pink-500" />
                  )}
                  지문으로 로그인
                </button>
              ) : (
                /* 미등록 → 지문 등록 버튼 */
                <button
                  onClick={handleBiometricRegister}
                  disabled={biometricLoading}
                  className="w-full flex items-center justify-center gap-3 bg-pink-50 border-2 border-pink-100 rounded-full h-12 font-semibold text-pink-600 hover:bg-pink-100 active:scale-95 transition-all disabled:opacity-60"
                >
                  {biometricLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-pink-500" />
                  ) : (
                    <Fingerprint className="w-5 h-5 text-pink-500" />
                  )}
                  지문 등록하기
                </button>
              )}

              {/* 등록 해제 링크 */}
              {biometricRegistered && (
                <button
                  onClick={() => {
                    localStorage.removeItem('lwmc_biometric_cred');
                    localStorage.removeItem('lwmc_biometric_user');
                    setBiometricRegistered(false);
                    setBiometricStatus('지문 등록이 해제되었습니다.');
                  }}
                  className="w-full text-center text-xs text-gray-300 hover:text-gray-400 mt-2 transition-colors"
                >
                  지문 등록 해제
                </button>
              )}
            </>
          ) : (
            /* 지문 미지원 환경 안내 */
            !window.isSecureContext ? (
              <p className="text-center text-xs text-gray-300 mt-4">
                🔒 지문 인증은 HTTPS 환경(Vercel 배포)에서만 사용 가능해요
              </p>
            ) : null
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          🐾 소중한 우리 아이들의 건강을 함께 지켜요
        </p>
      </div>
    </div>
  );
}