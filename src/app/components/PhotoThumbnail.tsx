import { useState } from 'react';
import { X, ZoomIn } from 'lucide-react';

interface PhotoThumbnailProps {
  src: string;
  alt?: string;
  size?: number; // px
  className?: string;
}

export function PhotoThumbnail({ src, alt = '사진', size = 112, className = '' }: PhotoThumbnailProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!src) return null;

  return (
    <>
      {/* Thumbnail */}
      <div
        className={`relative cursor-pointer group flex-shrink-0 ${className}`}
        style={{ width: size, height: size }}
        onClick={() => setLightboxOpen(true)}
      >
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover rounded-2xl shadow-sm border border-white"
        />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/25 rounded-2xl">
          <ZoomIn className="w-6 h-6 text-white drop-shadow" />
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <div
            className="relative max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <X className="w-7 h-7" />
            </button>
            <img
              src={src}
              alt={alt}
              className="w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
            />
            <p className="text-center text-white/70 text-sm mt-3">{alt}</p>
          </div>
        </div>
      )}
    </>
  );
}
