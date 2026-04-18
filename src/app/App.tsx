import { useState, useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { Toaster } from './components/ui/sonner';
import { router } from './routes';
import { LoginPage } from './pages/LoginPage';
import { getSession } from './utils/auth';
import { Loader2 } from 'lucide-react';

export default function App() {
  // null = 세션 확인 중, true = 로그인됨, false = 로그인 필요
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const session = getSession();
    setIsAuthenticated(!!session);
  }, []);

  // 세션 확인 중 (스플래시)
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-100 to-pink-50 flex flex-col items-center justify-center gap-4">
        <div className="text-6xl">🐱</div>
        <Loader2 className="w-6 h-6 animate-spin text-pink-400" />
      </div>
    );
  }

  // 로그인 필요
  if (!isAuthenticated) {
    return (
      <>
        <LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />
        <Toaster />
      </>
    );
  }

  // 인증됨 → 메인 앱
  return (
    <>
      <RouterProvider router={router} />
      <Toaster />
    </>
  );
}
