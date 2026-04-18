import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Calendar, Trash2 } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { PhotoThumbnail } from '../components/PhotoThumbnail';
import type { Cat } from '../types/health-record';
import {
  getCatById,
  getFoodRecordsByCat,
  getVitalityRecordsByCat,
  getMedicationRecordsByCat,
  getToothBrushRecordsByCat,
  getPoopRecordsByCat,
  getVomitRecordsByCat,
  deleteHealthRecord,
} from '../utils/storage';

export function History() {
  const { catId } = useParams<{ catId: string }>();
  const navigate = useNavigate();
  const [cat, setCat] = useState<Cat | null>(null);
  const [history, setHistory] = useState<{ date: string; records: any[] }[]>([]);
  const [loading, setLoading] = useState(true);
  // 삭제 확인 중인 항목 key: `${catId}-${type}-${date}`
  const [confirmKey, setConfirmKey] = useState<string | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  useEffect(() => {
    if (catId) {
      const loadRecords = async () => {
        setLoading(true);
        try {
          const foundCat = await getCatById(catId);
          if (foundCat) {
            setCat(foundCat);

            const [
              foodRecords,
              vitalityRecords,
              medicationRecords,
              toothbrushRecords,
              poopRecords,
              vomitRecords,
            ] = await Promise.all([
              getFoodRecordsByCat(catId),
              getVitalityRecordsByCat(catId),
              getMedicationRecordsByCat(catId),
              getToothBrushRecordsByCat(catId),
              getPoopRecordsByCat(catId),
              getVomitRecordsByCat(catId),
            ]);

            const allRecords = [
              ...(foodRecords || []).map(r => ({ ...r, type: 'food' })),
              ...(vitalityRecords || []).map(r => ({ ...r, type: 'vitality' })),
              ...(medicationRecords || []).map(r => ({ ...r, type: 'medication' })),
              ...(toothbrushRecords || []).map(r => ({ ...r, type: 'toothbrush' })),
              ...(poopRecords || []).map(r => ({ ...r, type: 'poop' })),
              ...(vomitRecords || []).map(r => ({ ...r, type: 'vomit' })),
            ];

            const groupedByDate = allRecords.reduce((acc, record) => {
              const dateKey = record.date || 'unknown';
              if (!acc[dateKey]) {
                acc[dateKey] = [];
              }
              acc[dateKey].push(record);
              return acc;
            }, {} as Record<string, any[]>);

            const historyArray = Object.entries(groupedByDate)
              .map(([date, records]) => ({ date, records }))
              .sort((a, b) => b.date.localeCompare(a.date));

            setHistory(historyArray);
          }
        } catch (err) {
          console.error('기록 불러오기 실패:', err);
        } finally {
          setLoading(false);
        }
      };

      loadRecords();
    }
  }, [catId]);

  if (!cat) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateString === today.toISOString().split('T')[0]) {
      return '오늘';
    } else if (dateString === yesterday.toISOString().split('T')[0]) {
      return '어제';
    } else {
      return `${date.getMonth() + 1}월 ${date.getDate()}일`;
    }
  };

  const getRecordEmoji = (type: string) => {
    switch (type) {
      case 'food': return '🍽️';
      case 'vitality': return '⚡';
      case 'medication': return '💊';
      case 'toothbrush': return '🪥';
      case 'poop': return '💩';
      case 'vomit': return '🤮';
      default: return '📝';
    }
  };

  const getRecordLabel = (type: string) => {
    switch (type) {
      case 'food': return '음식';
      case 'vitality': return '활력';
      case 'medication': return '복약';
      case 'toothbrush': return '양치';
      case 'poop': return '배변';
      case 'vomit': return '구토';
      default: return type;
    }
  };

  const getRecordSummary = (record: any) => {
    switch (record.type) {
      case 'food': {
        const totalFood = (record.mainFood || []).reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
        return `주식 ${totalFood}g, 간식 ${(record.snacks || []).length}개`;
      }
      case 'vitality': {
        const vitalityLabels: Record<string, string> = {
          'very-active': '매우 활발',
          'active': '활발함',
          'normal': '보통',
          'tired': '피곤함',
          'sick': '아픈 듯',
        };
        return vitalityLabels[record.status] || record.status;
      }
      case 'medication':
        return `${record.morning ? '아침' : ''}${record.morning && record.evening ? ', ' : ''}${record.evening ? '저녁' : ''}`;
      case 'toothbrush':
        return `${record.morning ? '오전' : ''}${record.morning && record.evening ? ', ' : ''}${record.evening ? '오후' : ''}`;
      case 'poop': {
        const poopLabels: Record<string, string> = {
          'normal': '정상변',
          'soft': '무른 변',
          'diarrhea': '설사',
          'constipation': '변비',
        };
        return poopLabels[record.status] || record.status;
      }
      case 'vomit':
        return record.occurred ? '구토함' : '구토 안함';
      default:
        return '';
    }
  };

  /**
   * 메모에서 사진 촬영 시(첫 줄, 📸로 시작)와 나머지 내용을 분리합니다.
   */
  const parseNotes = (notes: string | undefined): { photoDatetime: string | null; body: string } => {
    if (!notes) return { photoDatetime: null, body: '' };
    const lines = notes.split('\n');
    if (lines[0]?.startsWith('📸')) {
      const photoDatetime = lines[0].trim();
      const body = lines.slice(1).join('\n').trim();
      return { photoDatetime, body };
    }
    return { photoDatetime: null, body: notes };
  };

  const getRecordKey = (record: any) => `${record.catId}-${record.type}-${record.date}`;

  const handleDeleteRequest = (record: any) => {
    setConfirmKey(getRecordKey(record));
  };

  const handleDeleteCancel = () => {
    setConfirmKey(null);
  };

  const handleDeleteConfirm = async (record: any) => {
    const key = getRecordKey(record);
    setDeletingKey(key);
    try {
      await deleteHealthRecord(record.catId, record.type, record.date);
      // 로컬 상태에서 즉시 제거
      setHistory(prev =>
        prev
          .map(day => ({
            ...day,
            records: day.records.filter(
              r => !(r.catId === record.catId && r.type === record.type && r.date === record.date)
            ),
          }))
          .filter(day => day.records.length > 0)
      );
      setConfirmKey(null);
    } catch (err) {
      console.error('삭제 실패:', err);
    } finally {
      setDeletingKey(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-pink-50 pb-10">
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
            <span className="text-4xl">📋</span>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{cat.name} 건강기록</h1>
              <p className="text-gray-500 text-sm">지금까지의 모든 기록</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin mb-4" />
            <p className="text-sm">기록을 불러오는 중...</p>
          </div>
        ) : history.length === 0 ? (
          <Card className="bg-white rounded-3xl p-12 shadow-sm border-0 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-base">아직 기록이 없습니다</p>
            <p className="text-gray-400 text-sm mt-2">오늘부터 기록을 시작해보세요!</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {history.map(({ date, records }) => (
              <Card key={date} className="bg-white rounded-3xl p-5 shadow-sm border-0">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <h2 className="text-lg font-bold text-gray-800">{formatDate(date)}</h2>
                  <Badge variant="secondary" className="ml-auto bg-purple-50 text-purple-700">
                    {records.length}개
                  </Badge>
                </div>

                <div className="space-y-2">
                  {records.map((record, index) => {
                    const isPhotoType = record.type === 'vomit' || record.type === 'poop';
                    const hasPhoto = isPhotoType && record.photoUrl;
                    const { photoDatetime, body: noteBody } = isPhotoType
                      ? parseNotes(record.notes)
                      : { photoDatetime: null, body: record.notes || '' };

                    const recKey = getRecordKey(record);
                    const isConfirming = confirmKey === recKey;
                    const isThisDeleting = deletingKey === recKey;

                    return (
                      <div
                        key={index}
                        className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl"
                      >
                        {/* 상단: 이모지 + 타입 + 요약 + 삭제 버튼 */}
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{getRecordEmoji(record.type)}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-800 text-sm">
                              {getRecordLabel(record.type)}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <p className="text-gray-600 text-sm">
                                {getRecordSummary(record)}
                              </p>
                              {photoDatetime && (
                                <p className="font-bold text-gray-800 text-sm">
                                  {photoDatetime.replace(/^📸\s*/, '')}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* 삭제 버튼 / 인라인 확인 */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {isConfirming ? (
                              <>
                                <button
                                  onClick={handleDeleteCancel}
                                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                                >
                                  취소
                                </button>
                                <button
                                  onClick={() => handleDeleteConfirm(record)}
                                  disabled={isThisDeleting}
                                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                                >
                                  {isThisDeleting ? '삭제 중' : '삭제'}
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleDeleteRequest(record)}
                                className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* 하단: 메모(좌) + 사진(우) */}
                        {(isPhotoType || noteBody || hasPhoto) && (
                          <div className="flex items-stretch gap-2 mt-2 pl-9">
                            <p className="flex-1 text-gray-500 text-xs bg-white/60 p-2 rounded-xl leading-relaxed min-h-[2rem]">
                              {noteBody ? `💬 ${noteBody}` : '💬'}
                            </p>
                            {hasPhoto && (
                              <PhotoThumbnail
                                src={record.photoUrl}
                                alt={record.type === 'vomit' ? '구토 사진' : '배변 사진'}
                                size={112}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}