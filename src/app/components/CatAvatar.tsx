import { useRef } from 'react';
import { Camera } from 'lucide-react';

// catId → 기본 이미지 URL (DB에 photo_url 없을 때 폴백)
// Unsplash URL 방식으로 교체 → 다운로드 후 Vercel 배포에서도 정상 작동
const DEFAULT_IMAGES: Record<string, string> = {
  ari:  'https://images.unsplash.com/photo-1758153412755-38876d86d028?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
  kung: 'https://images.unsplash.com/photo-1610973053414-abc5309f0a8c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
};

// 그 외 catId는 귀여운 고양이 플레이스홀더 이미지
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1518791841217-8f162f1912da?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400';

interface CatAvatarProps {
  catId: string;
  name: string;
  photoUrl?: string;        // Supabase Storage URL 또는 기본 이미지 URL
  size?: number;            // px
  editable?: boolean;
  onPhotoChange?: (file: File) => void;
  className?: string;
}

export function CatAvatar({
  catId,
  name,
  photoUrl,
  size = 80,
  editable = false,
  onPhotoChange,
  className = '',
}: CatAvatarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Storage URL 우선, 없으면 catId 기반 기본 이미지, 그 외 공통 폴백
  const displaySrc = photoUrl || DEFAULT_IMAGES[catId] || FALLBACK_IMAGE;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onPhotoChange?.(file);
    // 같은 파일 재선택 가능하도록 초기화
    e.target.value = '';
  };

  return (
    <div
      className={`relative flex-shrink-0 ${editable ? 'cursor-pointer group' : ''} ${className}`}
      style={{ width: size, height: size }}
      onClick={() => editable && inputRef.current?.click()}
    >
      <div className="w-full h-full rounded-full overflow-hidden bg-gray-100 border-2 border-white shadow">
        {displaySrc ? (
          <img
            src={displaySrc}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl">
            🐱
          </div>
        )}
      </div>

      {editable && (
        <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
          <Camera className="text-white" style={{ width: size * 0.3, height: size * 0.3 }} />
        </div>
      )}

      {editable && (
        <div
          className="absolute bottom-0 right-0 bg-pink-500 rounded-full flex items-center justify-center shadow-md border-2 border-white"
          style={{ width: size * 0.32, height: size * 0.32 }}
        >
          <Camera className="text-white" style={{ width: size * 0.17, height: size * 0.17 }} />
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
