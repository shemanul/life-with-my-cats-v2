import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import type { Cat, MedicationRecord as MedicationRecordType } from '../types/health-record';
import { getCatById, getMedicationRecord, saveMedicationRecord } from '../utils/storage';

const getTodayString = () => new Date().toISOString().split('T')[0];

export function MedicationRecord() {
  const { catId } = useParams<{ catId: string }>();
  const navigate = useNavigate();
  const [cat, setCat] = useState<Cat | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [morning, setMorning] = useState(false);
  const [evening, setEvening] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const loadData = async () => {
      if (catId) {
        const foundCat = await getCatById(catId);
        if (foundCat) {
          setCat(foundCat);
          const existing = await getMedicationRecord(catId, selectedDate);
          if (existing) {
            setMorning(existing.morning);
            setEvening(existing.evening);
            setNotes(existing.notes || '');
          } else {
            setMorning(false);
            setEvening(false);
            setNotes('');
          }
        }
      }
    };

    loadData();
  }, [catId, selectedDate]);

  const handleSave = async () => {
    if (!catId) return;

    try {
      const record: MedicationRecordType = {
        id: `${catId}-${selectedDate}`,
        catId,
        date: selectedDate,
        morning,
        evening,
        notes: notes || undefined,
      };

      await saveMedicationRecord(record);
      toast.success('복약 기록이 저장되었습니다!');
      navigate(`/${catId}`);
    } catch (error) {
      console.error('Save error:', error);
      toast.error('저장 중 오류가 발생했습니다');
    }
  };

  if (!cat) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-pink-50 pb-10">
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
            <span className="text-4xl">💊</span>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{cat.name} 복약지킴</h1>
              <p className="text-gray-500 text-sm">약을 잘 먹였는지 체크하세요</p>
            </div>
          </div>

          {/* Date Selector */}
          <Card className="bg-white rounded-2xl p-4 shadow-sm border-0 mb-4">
            <Label className="text-sm font-semibold text-gray-700 mb-2 block">기록 날짜</Label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border-2 border-blue-200 rounded-xl focus:border-blue-400"
            />
          </Card>
        </div>

        {/* Medication Checklist */}
        <Card className="bg-white rounded-3xl p-6 mb-4 shadow-sm border-0">
          <h2 className="text-lg font-bold text-gray-800 mb-4">복약 체크</h2>
          
          <div className="space-y-3">
            {/* Morning */}
            <button
              onClick={() => setMorning(!morning)}
              className={`w-full p-5 rounded-2xl border-2 transition-all ${
                morning
                  ? 'bg-amber-50 border-amber-300'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  morning ? 'bg-amber-400' : 'bg-gray-300'
                }`}>
                  <span className="text-2xl">☀️</span>
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-gray-800">아침 복약</p>
                  <p className="text-sm text-gray-500">오전에 약 먹이기</p>
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
                  ? 'bg-indigo-50 border-indigo-300'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  evening ? 'bg-indigo-400' : 'bg-gray-300'
                }`}>
                  <span className="text-2xl">🌙</span>
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-gray-800">저녁 복약</p>
                  <p className="text-sm text-gray-500">오후/저녁에 약 먹이기</p>
                </div>
                {evening && (
                  <span className="text-green-500 text-xl">✓</span>
                )}
              </div>
            </button>
          </div>

          {(morning || evening) && (
            <div className="mt-4 p-3 bg-blue-50 rounded-2xl">
              <p className="text-sm font-medium text-blue-800 text-center">
                {morning && evening ? '아침, 저녁 모두' : morning ? '아침' : '저녁'} 복약 완료 ✓
              </p>
            </div>
          )}
        </Card>

        {/* Notes */}
        <Card className="bg-white rounded-3xl p-6 mb-6 shadow-sm border-0">
          <Label className="text-lg font-bold text-gray-800 mb-3 block">메모</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="약 종류, 복용량, 특이사항 등을 기록하세요..."
            rows={4}
            className="resize-none border-0 bg-gray-50 rounded-2xl"
          />
        </Card>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-full h-14 text-base font-semibold shadow-lg"
        >
          저장하기
        </Button>
      </div>
    </div>
  );
}