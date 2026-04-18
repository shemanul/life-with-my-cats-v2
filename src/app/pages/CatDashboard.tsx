import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, History, Loader2 } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import type { Cat } from '../types/health-record';
import { getCatById, getFoodRecord, getVitalityRecord, getMedicationRecord, getToothBrushRecord, getPoopRecord, getVomitRecord, getTotalRecordCount } from '../utils/storage';
import { CatAvatar } from '../components/CatAvatar';
import { uploadPhotoToStorage } from '../utils/storage';
import { updateCat } from '../utils/cat-storage';

const formatDate = (date: Date) => date.toISOString().split('T')[0];
const getTodayString = () => formatDate(new Date());

interface CategoryCard {
  id: string;
  title: string;
  emoji: string;
  path: string;
  bgColor: string;
}

export function CatDashboard() {
  const { catId } = useParams<{ catId: string }>();
  const navigate = useNavigate();
  const [cat, setCat] = useState<Cat | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);
  const [todayStatus, setTodayStatus] = useState({
    food: false,
    vitality: false,
    medication: false,
    toothbrush: false,
    poop: false,
    vomit: false,
  });

  const loadData = async () => {
    if (!catId) return;
    setLoading(true);
    console.log(`[Dashboard] Loading data for catId: ${catId}`);
    try {
      const foundCat = await getCatById(catId);
      console.log(`[Dashboard] Found cat:`, foundCat);
      if (foundCat) {
        setCat(foundCat);
        const today = getTodayString();
        const [total, food, vitality, medication, toothbrush, poop, vomit] = await Promise.all([
          getTotalRecordCount(catId),
          getFoodRecord(catId, today),
          getVitalityRecord(catId, today),
          getMedicationRecord(catId, today),
          getToothBrushRecord(catId, today),
          getPoopRecord(catId, today),
          getVomitRecord(catId, today),
        ]);
        setTotalRecords(total);
        setTodayStatus({
          food: !!food,
          vitality: !!vitality,
          medication: !!medication,
          toothbrush: !!toothbrush,
          poop: !!poop,
          vomit: !!vomit,
        });
      } else {
        console.error(`[Dashboard] Cat with ID ${catId} not found in the list.`);
      }
    } catch (err) {
      console.error(`[Dashboard] Error loading data:`, err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [catId]);

  // ✅ 사진 업로드 핸들러 (버그 수정: forceUpdate만 호출하던 것을 실제 업로드로 교체)
  const handlePhotoChange = async (file: File) => {
    if (!cat) return;
    try {
      const url = await uploadPhotoToStorage(file, 'profile');
      const updated = await updateCat({ ...cat, photoUrl: url });
      setCat(updated);
    } catch (err) {
      console.error('[Dashboard] Photo upload failed:', err);
      alert('사진 업로드에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-pink-50">
        <Loader2 className="w-10 h-10 text-pink-500 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">우리 아이 정보를 불러오고 있어요...</p>
      </div>
    );
  }

  if (!cat) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-pink-50 p-6 text-center">
        <div className="text-6xl mb-6">😿</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">고양이를 찾을 수 없습니다</h2>
        <p className="text-gray-500 mb-8">정보를 불러오는 중에 문제가 발생했거나<br/>해당 아이가 등록되지 않았을 수 있어요.</p>
        <Button onClick={() => navigate('/')} className="bg-pink-500 hover:bg-pink-600 rounded-full px-8">
          홈으로 돌아가기
        </Button>
      </div>
    );
  }

  const categories: CategoryCard[] = [
    { id: 'food',       title: '음식섭취', emoji: '🍽️', path: `/${catId}/food`,       bgColor: 'bg-orange-50' },
    { id: 'vitality',   title: '활력정도', emoji: '⚡',  path: `/${catId}/vitality`,   bgColor: 'bg-green-50'  },
    { id: 'medication', title: '복약지킴', emoji: '💊',  path: `/${catId}/medication`, bgColor: 'bg-blue-50'   },
    { id: 'toothbrush', title: '양치',     emoji: '🪥',  path: `/${catId}/toothbrush`, bgColor: 'bg-cyan-50'   },
    { id: 'poop',       title: '배변상태', emoji: '💩',  path: `/${catId}/poop`,       bgColor: 'bg-amber-50'  },
    { id: 'vomit',      title: '구토상태', emoji: '🤮',  path: `/${catId}/vomit`,      bgColor: 'bg-red-50'    },
  ];

  const completedToday = Object.values(todayStatus).filter(Boolean).length;
  const totalCategories = Object.keys(todayStatus).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-100 to-pink-50">
      <div className="max-w-md mx-auto p-5 pb-10">
        {/* Header */}
        <div className="mb-6 pt-4">
          <Button variant="ghost" onClick={() => navigate('/')} className="mb-4 -ml-2 text-gray-600" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" />
            전체 목록
          </Button>

          {/* Cat Profile Card */}
          <Card className="bg-white rounded-3xl p-6 shadow-md border-0 mb-6">
            <div className="flex items-center gap-4 mb-4">
              {/* ✅ photoUrl 추가 (누락되어 있던 버그 수정) */}
              <CatAvatar
                catId={catId!}
                name={cat.name}
                photoUrl={cat.photoUrl}
                size={64}
                editable
                onPhotoChange={handlePhotoChange}
              />
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-800">{cat.name}</h1>
                <p className="text-gray-500 text-sm">{cat.breed} · {(() => {
                  if (!cat.birthDate) return '생일 정보 없음';
                  try {
                    const parts = cat.birthDate.split(/[-./]/).map(Number);
                    if (parts.length < 3) return '생일 형식 오류';
                    const [y, m, d] = parts;
                    const now = new Date();
                    let age = now.getFullYear() - y;
                    const passed = now.getMonth() + 1 > m || (now.getMonth() + 1 === m && now.getDate() >= d);
                    if (!passed) age -= 1;
                    return `${age}세 (${cat.birthDate.replace(/-/g, '.')})`;
                  } catch (e) {
                    return '나이 계산 오류';
                  }
                })()}</p>
              </div>
              <div 
                onClick={() => navigate(`/${catId}/history`)}
                className="flex flex-col items-center justify-center bg-pink-50 hover:bg-pink-100 transition-colors rounded-2xl p-2 px-3 border border-pink-100 cursor-pointer shadow-sm active:scale-95"
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <History className="w-4 h-4 text-pink-500" />
                  <span className="text-[10px] font-bold text-pink-600 uppercase tracking-tight">Records</span>
                </div>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-sm font-black text-gray-800">{completedToday}</span>
                  <span className="text-[10px] text-gray-400 font-medium">/</span>
                  <span className="text-[10px] text-gray-500 font-bold">{totalRecords}</span>
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">오늘의 건강체크</span>
                <span className="font-semibold text-pink-600">{completedToday}/{totalCategories}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-pink-400 to-pink-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(completedToday / totalCategories) * 100}%` }}
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-3 gap-3">
          {categories.map((category) => {
            const isCompleted = todayStatus[category.id as keyof typeof todayStatus];
            return (
              <Card
                key={category.id}
                className={`relative ${category.bgColor} rounded-2xl p-4 cursor-pointer hover:shadow-md transition-all border-0 ${isCompleted ? 'ring-2 ring-green-400' : ''}`}
                onClick={() => navigate(category.path)}
              >
                {isCompleted && (
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
                <div className="flex flex-col items-center text-center gap-2">
                  <span className="text-3xl">{category.emoji}</span>
                  <span className="text-xs font-medium text-gray-700">{category.title}</span>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Today's tip */}
        <Card className="mt-6 bg-white rounded-2xl p-4 border-0 shadow-sm">
          <div className="flex gap-3">
            <span className="text-2xl">💡</span>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800 text-sm mb-1">건강 TIP</h3>
              <p className="text-gray-600 text-xs leading-relaxed">
                매일 꾸준한 기록으로 우리 아이의 건강 상태를 파악하세요. 이상 증상 발견 시 즉시 수의사와 상담하세요.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}