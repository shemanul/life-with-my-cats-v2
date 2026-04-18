import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import type { Cat, ToothBrushRecord as ToothBrushRecordType } from '../types/health-record';
import { getCatById, getToothBrushRecord, saveToothBrushRecord } from '../utils/storage';

const getTodayString = () => new Date().toISOString().split('T')[0];

export function ToothBrushRecord() {
  const { catId } = useParams<{ catId: string }>();
  const navigate = useNavigate();
  const [cat, setCat] = useState<Cat | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [morning, setMorning] = useState(false);
  const [evening, setEvening] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (catId) {
        const foundCat = await getCatById(catId);
        if (foundCat) {
          setCat(foundCat);
          const existing = await getToothBrushRecord(catId, selectedDate);
          if (existing) {
            setMorning(existing.morning);
            setEvening(existing.evening);
          } else {
            setMorning(false);
            setEvening(false);
          }
        }
      }
    };

    loadData();
  }, [catId, selectedDate]);

  const handleSave = async () => {
    if (!catId) return;

    try {
      const record: ToothBrushRecordType = {
        id: `${catId}-${selectedDate}`,
        catId,
        date: selectedDate,
        morning,
        evening,
      };

      await saveToothBrushRecord(record);
      toast.success('양치 기록이 저장되었습니다!');
      navigate(`/${catId}`);
    } catch (error) {
      console.error('Save error:', error);
      toast.error('저장 중 오류가 발생했습니다');
    }
  };

  if (!cat) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-pink-50 pb-10">
      <div className="max-w-md mx-auto p-5">
        <div className="mb-6 pt-4">
          <Button
            variant="ghost"
            onClick={() => navigate(`/${catId}`)}
            className="mb-4 -ml-2"
            size="sm"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            뒤로
          </Button>

          <div className="flex items-center gap-3 mb-6">
            <span className="text-4xl">🪥</span>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{cat.name} 양치</h1>
              <p className="text-gray-500 text-sm">오늘 양치를 했는지 체크하세요</p>
            </div>
          </div>

          {/* Date Selector */}
          <Card className="bg-white rounded-2xl p-4 shadow-sm border-0 mb-4">
            <Label className="text-sm font-semibold text-gray-700 mb-2 block">기록 날짜</Label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border-2 border-cyan-200 rounded-xl focus:border-cyan-400"
            />
          </Card>
        </div>

        {/* ToothBrush Checklist */}
        <Card className="bg-white rounded-3xl p-6 mb-4 shadow-sm border-0">
          <h2 className="text-lg font-bold text-gray-800 mb-4">양치 체크</h2>
          
          <div className="space-y-3">
            {/* Morning */}
            <button
              onClick={() => setMorning(!morning)}
              className={`w-full p-5 rounded-2xl border-2 transition-all ${
                morning
                  ? 'bg-cyan-50 border-cyan-300'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  morning ? 'bg-cyan-400' : 'bg-gray-300'
                }`}>
                  <span className="text-2xl">☀️</span>
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-gray-800">오전 양치</p>
                  <p className="text-sm text-gray-500">오전에 양치하기</p>
                </div>
                {morning && (
                  <span className="text-green-500 text-xl">✓</span>
                )}
              </div>
            </button>

            {/* Evening */}
            <button
              onClick={() => setEvening(!evening)}
              className={`w-full p-5 rounded-2xl border-2 transition-all ${
                evening
                  ? 'bg-teal-50 border-teal-300'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  evening ? 'bg-teal-400' : 'bg-gray-300'
                }`}>
                  <span className="text-2xl">🌙</span>
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-gray-800">오후 양치</p>
                  <p className="text-sm text-gray-500">오후/저녁에 양치하기</p>
                </div>
                {evening && (
                  <span className="text-green-500 text-xl">✓</span>
                )}
              </div>
            </button>
          </div>

          {(morning || evening) && (
            <div className="mt-4 p-3 bg-cyan-50 rounded-2xl">
              <p className="text-sm font-medium text-cyan-800 text-center">
                {morning && evening ? '오전, 오후 모두' : morning ? '오전' : '오후'} 양치 완료 ✓
              </p>
            </div>
          )}
        </Card>

        {/* Info Card */}
        <Card className="bg-gradient-to-r from-cyan-400 to-teal-400 rounded-3xl p-5 mb-6 border-0 shadow-sm">
          <div className="flex gap-3 text-white">
            <span className="text-2xl">💡</span>
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-1">양치 팁</h3>
              <p className="text-xs leading-relaxed text-white/90">
                고양이의 치아 건강은 매우 중요합니다. 규칙적인 양치는 치석과 잇몸 질환을 예방할 수 있어요.
              </p>
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white rounded-full h-14 text-base font-semibold shadow-lg"
        >
          저장하기
        </Button>
      </div>
    </div>
  );
}