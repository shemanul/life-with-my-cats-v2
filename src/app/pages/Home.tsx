import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { ChevronRight, Plus, Pencil, Trash2, Loader2, LogOut } from 'lucide-react';
import { Card } from '../components/ui/card';
import type { Cat } from '../types/health-record';
import { fetchCats, createCat, updateCat, deleteCat } from '../utils/cat-storage';
import { CatAvatar } from '../components/CatAvatar';
import { CatFormModal } from '../components/CatFormModal';
import { uploadPhotoToStorage } from '../utils/storage';
import { clearSession } from '../utils/auth';

export function Home() {
  const [cats, setCats] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [editingCat, setEditingCat] = useState<Cat | null>(null);
  const [modalKey, setModalKey] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const navigate = useNavigate();

  const loadCats = async () => {
    setLoading(true);
    try {
      const data = await fetchCats();
      console.log('[Home] Loaded cats:', data);
      setCats(data);
    } catch (err) {
      console.error('[Home] Error loading cats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCats();
  }, []);

  const getAgeString = (cat: Cat) => {
    if (!cat.birthDate) return '생일 정보 없음';
    
    try {
      // Robust date parsing (YYYY-MM-DD or YYYY.MM.DD or YYYY/MM/DD)
      const parts = cat.birthDate.split(/[-./]/).map(Number);
      if (parts.length < 3) return '생일 형식 오류';
      
      const [y, m, d] = parts;
      const now = new Date();
      let age = now.getFullYear() - y;
      const hasBirthdayPassed =
        now.getMonth() + 1 > m ||
        (now.getMonth() + 1 === m && now.getDate() >= d);
      
      if (!hasBirthdayPassed) age -= 1;
      
      const label = cat.birthDate.replace(/-/g, '.');
      return `${age}세 · ${label}`;
    } catch (e) {
      return '나이 계산 오류';
    }
  };

  const handleSave = async (data: Omit<Cat, 'id'> & { id?: string }) => {
    try {
      if (data.id) {
        await updateCat(data as Cat);
      } else {
        await createCat(data);
      }
      await loadCats();
    } catch (e: any) {
      console.error('[Home] Save failed:', e);
      throw e; // 모달에서 에러 메시지 표시하도록 re-throw
    }
  };

  const handleCatPhotoChange = async (cat: Cat, file: File) => {
    try {
      const url = await uploadPhotoToStorage(file, 'avatars');
      await updateCat({ ...cat, photoUrl: url });
      await loadCats();
    } catch (err) {
      console.error('[Home] Photo upload failed:', err);
      alert('사진 업로드에 실패했습니다.');
    }
  };

  const handleDelete = async (cat: Cat) => {
    if (!window.confirm(`${cat.name}을(를) 삭제할까요?\n건강 기록은 그대로 남습니다.`)) return;
    setDeletingId(cat.id);
    try {
      await deleteCat(cat.id);
      await loadCats();
    } catch (e) {
      console.error('[Home] Delete failed:', e);
    } finally {
      setDeletingId(null);
    }
  };

  const handleLogout = () => {
    if (window.confirm('로그아웃 하시겠어요?')) {
      clearSession();
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-100 to-pink-50">
      <div className="max-w-md mx-auto p-5 pb-24">
        {/* Header */}
        <div className="text-center mb-8 pt-8 relative">
          <button
            onClick={handleLogout}
            className="absolute right-0 top-8 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-white/70 transition-all"
            title="로그아웃"
          >
            <LogOut className="w-4 h-4" />
          </button>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Life with My Cats
          </h1>
          <p className="text-gray-600 text-sm">우리 아이들 건강관리</p>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-pink-300">
            <Loader2 className="w-12 h-12 animate-spin mb-4" />
            <p className="text-gray-400 font-medium">냥이 정보를 가져오고 있어요...</p>
          </div>
        ) : (
          /* Cat Cards */
          <div className="space-y-4">
            {cats.map((cat) => (
              <Card
                key={cat.id}
                className="bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-lg transition-shadow border-0"
              >
                <div className="p-6">
                  {/* Top row: photo + name + actions */}
                  <div className="flex items-center justify-between mb-5">
                    <div
                      className="flex items-center gap-4 flex-1 cursor-pointer"
                      onClick={() => navigate(`/${cat.id}`)}
                    >
                      <div onClick={(e) => e.stopPropagation()}>
                        <CatAvatar
                          catId={cat.id}
                          name={cat.name}
                          photoUrl={cat.photoUrl}
                          size={72}
                          editable
                          onPhotoChange={(file) => handleCatPhotoChange(cat, file)}
                        />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800">{cat.name}</h2>
                        <p className="text-gray-500 text-sm">{cat.breed}</p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => { setEditingCat(cat); setModalKey(k => k + 1); setModalMode('edit'); }}
                        className="p-2 rounded-full hover:bg-blue-50 text-blue-400 hover:text-blue-600 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat)}
                        disabled={deletingId === cat.id}
                        className="p-2 rounded-full hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => navigate(`/${cat.id}`)}
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                      >
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </button>
                    </div>
                  </div>

                  {/* Info rows */}
                  <div
                    className="space-y-2 cursor-pointer"
                    onClick={() => navigate(`/${cat.id}`)}
                  >
                    <div className="flex items-center justify-between py-2.5 px-3.5 bg-pink-50 rounded-xl">
                      <span className="text-gray-600 text-sm font-medium">나이</span>
                      <span className="font-bold text-gray-800">
                        {getAgeString(cat)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2.5 px-3.5 bg-pink-50 rounded-xl">
                      <span className="text-gray-600 text-sm font-medium">성별</span>
                      <span className="font-bold text-gray-800">
                        {cat.gender === 'female' ? '여아 🎀' : '남아 🐾'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2.5 px-3.5 bg-pink-50 rounded-xl">
                      <span className="text-gray-600 text-sm font-medium">중성화</span>
                      <span className="font-bold text-gray-800">{cat.neutered ? '완료 ✓' : '미완료'}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            {cats.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <p className="text-5xl mb-4">🐾</p>
                <p className="text-base font-medium">등록된 아이가 없어요</p>
                <p className="text-sm mt-1">아래 버튼으로 추가해주세요</p>
              </div>
            )}
          </div>
        )}

        {/* Footer tip */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-xs">
            💝 매일 꾸준히 기록하여 우리 아이의 건강을 지켜주세요
          </p>
          <p className="text-gray-400 text-xs mt-1">
            📷 사진을 탭하면 변경할 수 있어요 &nbsp;·&nbsp; ✏️ 연필 아이콘으로 정보 수정
          </p>
        </div>
      </div>

      {/* FAB: 새 아이 추가 */}
      <button
        onClick={() => { setEditingCat(null); setModalKey(k => k + 1); setModalMode('add'); }}
        className="fixed bottom-8 right-1/2 translate-x-1/2 w-[85%] max-w-[320px] bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full h-14 flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl active:scale-95 transition-all font-bold text-base z-40"
      >
        <Plus className="w-5 h-5" />
        새 아이 추가
      </button>

      {/* Modal */}
      {modalMode && (
        <CatFormModal
          key={modalKey}
          cat={modalMode === 'edit' ? editingCat : null}
          onSave={handleSave}
          onClose={() => setModalMode(null)}
        />
      )}
    </div>
  );
}