import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import type { Cat, VitalityRecord as VitalityRecordType } from '../types/health-record';
import { getCatById, getVitalityRecord, saveVitalityRecord } from '../utils/storage';

const getTodayString = () => new Date().toISOString().split('T')[0];

const vitalityLevels = [
  {
    value: 'very-active' as const,
    label: '매우 활발',
    emoji: '😄',
    color: 'bg-green-50 border-green-300 text-green-700',
  },
  {
    value: 'active' as const,
    label: '활발함',
    emoji: '😊',
    color: 'bg-lime-50 border-lime-300 text-lime-700',
  },
  {
    value: 'normal' as const,
    label: '보통',
    emoji: '😐',
    color: 'bg-yellow-50 border-yellow-300 text-yellow-700',
  },
  {
    value: 'tired' as const,
    label: '피곤함',
    emoji: '😔',
    color: 'bg-orange-50 border-orange-300 text-orange-700',
  },
  {
    value: 'sick' as const,
    label: '아픈 듯',
    emoji: '😣',
    color: 'bg-red-50 border-red-300 text-red-700',
  },
];

export function VitalityRecord() {
  const { catId } = useParams<{ catId: string }>();
  const navigate = useNavigate();
  const [cat, setCat] = useState<Cat | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [selectedStatus, setSelectedStatus] = useState<VitalityRecordType['status'] | null>(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const loadData = async () => {
      if (catId) {
        const foundCat = await getCatById(catId);
        if (foundCat) {
          setCat(foundCat);
          const existing = await getVitalityRecord(catId, selectedDate);
          if (existing) {
            setSelectedStatus(existing.status);
            setNotes(existing.notes || '');
          } else {
            setSelectedStatus(null);
            setNotes('');
          }
        }
      }
    };

    loadData();
  }, [catId, selectedDate]);

  const handleSave = async () => {
    if (!catId || !selectedStatus) {
      toast.error('활력 상태를 선택해주세요!');
      return;
    }

    try {
      const record: VitalityRecordType = {
        id: `${catId}-${selectedDate}`,
        catId,
        date: selectedDate,
        status: selectedStatus,
        notes: notes || undefined,
      };

      await saveVitalityRecord(record);
      toast.success('활력 정도가 기록되었습니다!');
      navigate(`/${catId}`);
    } catch (error) {
      console.error('Save error:', error);
      toast.error('저장 중 오류가 발생했습니다');
    }
  };

  if (!cat) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-pink-50 pb-10">
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
            <span className="text-4xl">⚡</span>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{cat.name} 활력정도</h1>
              <p className="text-gray-500 text-sm">활동 상태를 체크하세요</p>
            </div>
          </div>

          {/* Date Selector */}
          <Card className="bg-white rounded-2xl p-4 shadow-sm border-0 mb-4">
            <Label className="text-sm font-semibold text-gray-700 mb-2 block">기록 날짜</Label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border-2 border-green-200 rounded-xl focus:border-green-400"
            />
          </Card>
        </div>

        {/* Vitality Selection */}
        <Card className="bg-white rounded-3xl p-6 mb-4 shadow-sm border-0">
          <h2 className="text-lg font-bold text-gray-800 mb-4">오늘의 상태</h2>
          <div className="space-y-3">
            {vitalityLevels.map((level) => (
              <button
                key={level.value}
                onClick={() => setSelectedStatus(level.value)}
                className={`w-full p-4 rounded-2xl border-2 transition-all ${
                  selectedStatus === level.value
                    ? `${level.color} border-2 shadow-md`
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{level.emoji}</span>
                  <span className="font-semibold text-gray-800">{level.label}</span>
                  {selectedStatus === level.value && (
                    <span className="ml-auto text-green-500">✓</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Notes */}
        <Card className="bg-white rounded-3xl p-6 mb-6 shadow-sm border-0">
          <Label className="text-lg font-bold text-gray-800 mb-3 block">메모</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="특이사항이나 관찰한 내용을 적어주세요..."
            rows={4}
            className="resize-none border-0 bg-gray-50 rounded-2xl"
          />
        </Card>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          className="w-full bg-gradient-to-r from-green-500 to-lime-500 hover:from-green-600 hover:to-lime-600 text-white rounded-full h-14 text-base font-semibold shadow-lg"
          disabled={!selectedStatus}
        >
          저장하기
        </Button>
      </div>
    </div>
  );
}