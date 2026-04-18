import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Upload, X, Loader2 } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import type { Cat, VomitRecord as VomitRecordType } from '../types/health-record';
import { getCatById, getVomitRecord, saveVomitRecord, uploadPhotoToStorage } from '../utils/storage';
import { getPhotoDateTime } from '../utils/photo-datetime';

const getTodayString = () => new Date().toISOString().split('T')[0];

export function VomitRecord() {
  const { catId } = useParams<{ catId: string }>();
  const navigate = useNavigate();
  const [cat, setCat] = useState<Cat | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [occurred, setOccurred] = useState<boolean | null>(null);
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [photoUploading, setPhotoUploading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (catId) {
        const foundCat = await getCatById(catId);
        if (foundCat) {
          setCat(foundCat);
          const existing = await getVomitRecord(catId, selectedDate);
          if (existing) {
            setOccurred(existing.occurred);
            setNotes(existing.notes || '');
            setPhotoUrl(existing.photoUrl || '');
          } else {
            setOccurred(null);
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
      const url = await uploadPhotoToStorage(file, `records/${catId}/vomit`);
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
    if (!catId || occurred === null) {
      toast.error('구토 여부를 선택해주세요!');
      return;
    }

    try {
      const record: VomitRecordType = {
        id: `${catId}-${selectedDate}`,
        catId,
        date: selectedDate,
        occurred,
        photoUrl: photoUrl || undefined,
        notes: notes || undefined,
      };

      await saveVomitRecord(record);
      toast.success('구토 상태가 기록되었습니다!');
      navigate(`/${catId}`);
    } catch (error) {
      console.error('Save error:', error);
      toast.error('저장 중 오류가 발생했습니다');
    }
  };

  if (!cat) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-pink-50 pb-10">
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
            <span className="text-4xl">🤮</span>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{cat.name} 구토상태</h1>
              <p className="text-gray-500 text-sm">오늘 구토를 했는지 기록하세요</p>
            </div>
          </div>

          {/* Date Selector */}
          <Card className="bg-white rounded-2xl p-4 shadow-sm border-0 mb-4">
            <Label className="text-sm font-semibold text-gray-700 mb-2 block">기록 날짜</Label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border-2 border-red-200 rounded-xl focus:border-red-400"
            />
          </Card>
        </div>

        {/* Vomit Status */}
        <Card className="bg-white rounded-3xl p-6 mb-4 shadow-sm border-0">
          <h2 className="text-lg font-bold text-gray-800 mb-4">구토 여부</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setOccurred(false)}
              className={`p-6 rounded-2xl border-2 transition-all ${
                occurred === false
                  ? 'bg-green-50 border-green-300 shadow-md'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                  occurred === false ? 'bg-green-400' : 'bg-gray-300'
                }`}>
                  <span className="text-2xl">✅</span>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-gray-800">구토 안함</p>
                  <p className="text-xs text-gray-500 mt-1">건강한 상태</p>
                </div>
                {occurred === false && (
                  <span className="text-green-500 text-sm">✓</span>
                )}
              </div>
            </button>

            <button
              onClick={() => setOccurred(true)}
              className={`p-6 rounded-2xl border-2 transition-all ${
                occurred === true
                  ? 'bg-red-50 border-red-300 shadow-md'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                  occurred === true ? 'bg-red-400' : 'bg-gray-300'
                }`}>
                  <span className="text-2xl">❌</span>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-gray-800">구토함</p>
                  <p className="text-xs text-gray-500 mt-1">관찰 필요</p>
                </div>
                {occurred === true && (
                  <span className="text-green-500 text-sm">✓</span>
                )}
              </div>
            </button>
          </div>

          {occurred === true && (
            <div className="mt-4 p-3 bg-red-50 border-2 border-red-200 rounded-2xl">
              <p className="text-xs text-red-800 text-center">
                ⚠️ 구토가 반복되거나 다른 증상이 동반되면 수의사와 상담하세요
              </p>
            </div>
          )}
        </Card>

        {/* Photo Upload - Only show if vomit occurred */}
        {occurred === true && (
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
                      ? <Loader2 className="w-8 h-8 text-red-400 animate-spin" />
                      : <Upload className="w-8 h-8 text-gray-400" />
                    }
                  </div>
                  <div>
                    <p className="font-medium text-gray-700 text-sm">
                      {photoUploading ? '업로드 중...' : '사진 업로드'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">구토물 사진 첨부</p>
                  </div>
                </label>
              </div>
            ) : (
              <div className="relative">
                <img
                  src={photoUrl}
                  alt="구토 사진"
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
        )}

        {/* Notes */}
        <Card className="bg-white rounded-3xl p-6 mb-6 shadow-sm border-0">
          <Label className="text-lg font-bold text-gray-800 mb-3 block">메모</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="구토 시간, 횟수, 색깔, 특이사항 등을 기록하세요..."
            rows={4}
            className="resize-none border-0 bg-gray-50 rounded-2xl"
          />
        </Card>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-full h-14 text-base font-semibold shadow-lg"
          disabled={occurred === null || photoUploading}
        >
          {photoUploading ? '사진 업로드 중...' : '저장하기'}
        </Button>
      </div>
    </div>
  );
}