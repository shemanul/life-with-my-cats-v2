import exifr from 'exifr';

/**
 * 사진 파일에서 촬영 일시를 추출합니다.
 * EXIF DateTimeOriginal → 파일 lastModified 순으로 폴백합니다.
 * 반환 형식: "2024년 03월 15일 14시 30분"
 */
export async function getPhotoDateTime(file: File): Promise<string> {
  try {
    const exif = await exifr.parse(file, { pick: ['DateTimeOriginal', 'DateTime'] });
    const dt: Date | undefined = exif?.DateTimeOriginal ?? exif?.DateTime;
    if (dt instanceof Date && !isNaN(dt.getTime())) {
      return formatKoreanDateTime(dt);
    }
  } catch {
    // EXIF 읽기 실패 시 폴백
  }

  // EXIF 없으면 파일의 lastModified 사용
  return formatKoreanDateTime(new Date(file.lastModified));
}

function formatKoreanDateTime(date: Date): string {
  const y = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `📸 ${y}년 ${mo}월 ${d}일 ${h}시 ${min}분`;
}
