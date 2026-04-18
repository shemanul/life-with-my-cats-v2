import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Upload, X, Loader2 } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import type { Cat, PoopRecord as PoopRecordType } from '../types/health-record';
import { getCatById, getPoopRecord, savePoopRecord, uploadPhotoToStorage } from '../utils/storage';
import { getPhotoDateTime } from '../utils/photo-datetime';

const getTodayString = () => new Date().toISOString().split('T')[0];

const poopStatuses = [
  {
    value: 'normal' as const,
    label: '정상변',
    emoji: '✅',
    description: '건강한 상태',
    color: 'bg-green-50 border-green-300',
  },
  {
    value: 'soft' as const,
    label: '무른 변',
    emoji: '⚠️',
    description: '약간 무른 상태',
    color: 'bg-yellow-50 border-yellow-300',
  },
  {
    value: 'diarrhea' as const,
    label: '설사',
    emoji: '🔴',
    description: '물변 상태',
    color: 'bg-red-50 border-red-300',
  },
  {
    value: 'constipation' as const,
    label: '변비',
    emoji: '💢',
    description: '딱딱하거나 안 나옴',
    color: 'bg-orange-50 border-orange-300',
  },
];

export function PoopRecord() {
  const { catId } = useParams<{ catId: string }>();
  const navigate = useNavigate();
  const [cat, setCat] = useState<Cat | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [selectedStatus, setSelectedStatus] = useState<PoopRecordType['status'] | null>(null);
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [photoUploading, setPhotoUploading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (catId) {
        const foundCat = await getCatById(catId);
        if (foundCat) {
          setCat(foundCat);
          const existing = await getPoopRecord(catId, selectedDate);
          if (existing) {
            setSelectedStatus(existing.status);
            setNotes(existing.notes || '');
            setPhotoUrl(existing.photoUrl || '');
          } else {
            setSelectedStatus(null);
            setNotes('');
            setPhotoUrl('');
          }
        }
      }
    };

    loadData();
  }, [catId, selectedDate]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 촬영 일시 자동 입력
    const dateStr = await getPhotoDateTime(file);
    setNotes(prev => prev ? `${dateStr}\n${prev}` : dateStr);

    // Storage 업로드
    setPhotoUploading(true);
    try {
      const url = await uploadPhotoToStorage(file, `records/${catId}/poop`);
      setPhotoUrl(url);
    } catch (err) {
      console.error('Photo upload failed:', err);
      toast.error('사진 업로드에 실패했습니다');
    } finally {
      setPhotoUploading(false);
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    if (!catId || !selectedStatus) {
      toast.error('배변 상태를 선택해주세요!');
      return;
    }

    try {
      const record: PoopRecordType = {
        id: `${catId}-${selectedDate}`,
        catId,
        date: selectedDate,
        status: selectedStatus,
        photoUrl: photoUrl || undefined,
        notes: notes || undefined,
      };

      await savePoopRecord(record);
      toast.success('배변 상태가 기록되었습니다!');
      navigate(`/${catId}`);
    } catch (error) {
      console.error('Save error:', error);
      toast.error('저장 중 오류가 발생했습니다');
    }
  };

  if (!cat) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-pink-50 pb-10">
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
            <span className="text-4xl">💩</span>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{cat.name} 배변상태</h1>
              <p className="text-gray-500 text-sm">오늘의 배변 상태를 기록하세요</p>
            </div>
          </div>

          {/* Date Selector */}
          <Card className="bg-white rounded-2xl p-4 shadow-sm border-0 mb-4">
            <Label className="text-sm font-semibold text-gray-700 mb-2 block">기록 날짜</Label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border-2 border-amber-200 rounded-xl focus:border-amber-400"
            />
          </Card>
        </div>

        {/* Status Selection */}
        <Card className="bg-white rounded-3xl p-6 mb-4 shadow-sm border-0">
          <h2 className="text-lg font-bold text-gray-800 mb-4">배변 상태</h2>
          <div className="grid grid-cols-2 gap-3">
            {poopStatuses.map((status) => (
              <button
                key={status.value}
                onClick={() => setSelectedStatus(status.value)}
                className={`p-4 rounded-2xl border-2 transition-all ${
                  selectedStatus === status.value
                    ? `${status.color} shadow-md`
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">{status.emoji}</div>
                  <div className="font-semibold text-gray-800 text-sm mb-1">
                    {status.label}
                  </div>
                  <p className="text-xs text-gray-500">{status.description}</p>
                  {selectedStatus === status.value && (
                    <span className="text-green-500 text-sm mt-1 block">✓</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Photo Upload */}
        <Card className="bg-white rounded-3xl p-6 mb-4 shadow-sm border-0">
          <Label className="text-lg font-bold text-gray-800 mb-3 block">사진 (선택)</Label>
          
          {!photoUrl ? (
            <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                id="photo-upload"
                disabled={photoUploading}
              />
              <label
                htmlFor="photo-upload"
                className={`cursor-pointer flex flex-col items-center gap-3 ${photoUploading ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  {photoUploading
                    ? <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
                    : <Upload className="w-8 h-8 text-gray-400" />
                  }
                </div>
                <div>
                  <p className="font-medium text-gray-700 text-sm">
                    {photoUploading ? '업로드 중...' : '사진 업로드'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">배변 상태 사진 첨부</p>
                </div>
              </label>
            </div>
          ) : (
            <div className="relative">
              <img
                src={photoUrl}
                alt="배변 사진"
                className="w-full h-48 object-cover rounded-2xl"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 rounded-full"
                onClick={() => setPhotoUrl('')}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </Card>

        {/* Notes */}
        <Card className="bg-white rounded-3xl p-6 mb-6 shadow-sm border-0">
          <Label className="text-lg font-bold text-gray-800 mb-3 block">메모</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="배변 횟수, 색깔, 특이사항 등을 기록하세요..."
            rows={4}
            className="resize-none border-0 bg-gray-50 rounded-2xl"
          />
        </Card>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-full h-14 text-base font-semibold shadow-lg"
          disabled={!selectedStatus || photoUploading}
        >
          {photoUploading ? '사진 업로드 중...' : '저장하기'}
        </Button>
      </div>
    </div>
  );
}