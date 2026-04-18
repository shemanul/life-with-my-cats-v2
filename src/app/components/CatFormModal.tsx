import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { CatAvatar } from './CatAvatar';
import type { Cat } from '../types/health-record';
import { uploadPhotoToStorage } from '../utils/storage';

interface CatFormModalProps {
  cat?: Cat | null;
  onSave: (data: Omit<Cat, 'id'> & { id?: string }) => Promise<void>;
  onClose: () => void;
}

export function CatFormModal({ cat, onSave, onClose }: CatFormModalProps) {
  const isEdit = !!cat;

  const [name, setName] = useState(cat?.name ?? '');
  const [breed, setBreed] = useState(cat?.breed ?? '');
  const [birthDate, setBirthDate] = useState(cat?.birthDate ?? '');
  const [gender, setGender] = useState<'female' | 'male'>(cat?.gender ?? 'female');
  const [neutered, setNeutered] = useState(cat?.neutered ?? true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 사진: 새로 선택한 파일과 미리보기 URL
  const [pendingPhotoFile, setPendingPhotoFile] = useState<File | null>(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string>('');

  // CatAvatar에 표시할 URL (새로 선택한 파일 미리보기 → 기존 DB URL 순)
  const displayPhotoUrl = pendingPreviewUrl || cat?.photoUrl;

  const handlePhotoChange = (file: File) => {
    setPendingPhotoFile(file);
    setPendingPreviewUrl(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setErrorMsg('이름을 입력해주세요 🐾');
      return;
    }
    setErrorMsg('');
    setSaving(true);
    try {
      let photoUrl = cat?.photoUrl;
      if (pendingPhotoFile) {
        photoUrl = await uploadPhotoToStorage(pendingPhotoFile, 'avatars');
      }

      await onSave({
        id: cat?.id,
        name: name.trim(),
        breed: breed.trim() || '미등록',
        birthDate,
        gender,
        neutered,
        photoUrl,
      });
      onClose();
    } catch (e: any) {
      console.error('고양이 저장 실패:', e);
      setErrorMsg(e?.message || '저장에 실패했어요. 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-t-3xl shadow-2xl overflow-y-auto"
        style={{ maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-10">
        {/* Handle */}
        <div className="w-10 h-1.5 bg-gray-300 rounded-full mx-auto mb-4" />

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            {isEdit ? '아이 정보 수정' : '새 아이 추가'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Photo */}
        <div className="flex flex-col items-center mb-4">
          <CatAvatar
            catId={cat?.id ?? '__preview__'}
            name={name || '🐱'}
            photoUrl={displayPhotoUrl}
            size={80}
            editable
            onPhotoChange={handlePhotoChange}
          />
          <p className="text-xs text-gray-400 mt-1">사진을 탭해서 변경</p>
        </div>

        <div className="space-y-4">
          {/* 이름 */}
          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-1 block">이름 *</Label>
            <Input
              value={name}
              onChange={(e) => { setName(e.target.value); setErrorMsg(''); }}
              placeholder="아리"
              className="rounded-xl border-2 border-pink-200 focus:border-pink-400"
            />
          </div>

          {/* 품종 */}
          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-1 block">품종</Label>
            <Input
              value={breed}
              onChange={(e) => setBreed(e.target.value)}
              placeholder="랙돌"
              className="rounded-xl border-2 border-pink-200 focus:border-pink-400"
            />
          </div>

          {/* 생년월일 */}
          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-1 block">생년월일</Label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full border-2 border-pink-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-400 bg-white text-gray-800"
            />
          </div>

          {/* 성별 */}
          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-2 block">성별</Label>
            <div className="grid grid-cols-2 gap-3">
              {([['female', '여아 🎀'], ['male', '남아 🐾']] as const).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setGender(val)}
                  className={`py-3 rounded-xl border-2 font-medium text-sm transition-all ${
                    gender === val
                      ? 'bg-pink-50 border-pink-400 text-pink-700'
                      : 'bg-gray-50 border-gray-200 text-gray-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 중성화 */}
          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-2 block">중성화</Label>
            <div className="grid grid-cols-2 gap-3">
              {([true, false] as const).map((val) => (
                <button
                  key={String(val)}
                  onClick={() => setNeutered(val)}
                  className={`py-3 rounded-xl border-2 font-medium text-sm transition-all ${
                    neutered === val
                      ? 'bg-purple-50 border-purple-400 text-purple-700'
                      : 'bg-gray-50 border-gray-200 text-gray-600'
                  }`}
                >
                  {val ? '완료 ✓' : '미완료'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 에러 메시지 */}
        {errorMsg && (
          <p className="mt-3 text-center text-sm text-red-500 font-medium">{errorMsg}</p>
        )}

        <Button
          onClick={handleSave}
          disabled={saving}
          className={`w-full mt-4 text-white rounded-full h-14 text-base font-semibold shadow-md transition-all ${
            !name.trim()
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600'
          }`}
        >
          {saving
            ? pendingPhotoFile && !cat?.photoUrl
              ? '사진 업로드 중...'
              : '저장 중...'
            : isEdit
            ? '수정 완료'
            : '추가하기'}
        </Button>
        </div>
      </div>
    </div>
  );
}