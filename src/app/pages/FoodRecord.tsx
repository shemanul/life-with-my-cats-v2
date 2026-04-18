import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import type { Cat, FoodRecord as FoodRecordType } from '../types/health-record';
import { getCatById, getFoodRecord, saveFoodRecord } from '../utils/storage';

const getTodayString = () => new Date().toISOString().split('T')[0];
const getCurrentTime = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};

export function FoodRecord() {
  const { catId } = useParams<{ catId: string }>();
  const navigate = useNavigate();
  const [cat, setCat] = useState<Cat | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [mainFoodEntries, setMainFoodEntries] = useState<{ amount: number; time: string }[]>([]);
  const [snackEntries, setSnackEntries] = useState<{ name: string; amount: string; time: string }[]>([]);

  useEffect(() => {
    const loadData = async () => {
      if (catId) {
        const foundCat = await getCatById(catId);
        if (foundCat) {
          setCat(foundCat);
          const existing = await getFoodRecord(catId, selectedDate);
          if (existing) {
            setMainFoodEntries(existing.mainFood);
            setSnackEntries(existing.snacks);
          } else {
            setMainFoodEntries([]);
            setSnackEntries([]);
          }
        }
      }
    };

    loadData();
  }, [catId, selectedDate]);

  const addMainFood = () => {
    setMainFoodEntries([...mainFoodEntries, { amount: 0, time: getCurrentTime() }]);
  };

  const updateMainFood = (index: number, field: 'amount' | 'time', value: number | string) => {
    const updated = [...mainFoodEntries];
    if (field === 'amount') {
      updated[index].amount = Number(value);
    } else {
      updated[index].time = String(value);
    }
    setMainFoodEntries(updated);
  };

  const removeMainFood = (index: number) => {
    setMainFoodEntries(mainFoodEntries.filter((_, i) => i !== index));
  };

  const addSnack = () => {
    setSnackEntries([...snackEntries, { name: '', amount: '', time: getCurrentTime() }]);
  };

  const updateSnack = (index: number, field: 'name' | 'amount' | 'time', value: string) => {
    const updated = [...snackEntries];
    updated[index][field] = value;
    setSnackEntries(updated);
  };

  const removeSnack = (index: number) => {
    setSnackEntries(snackEntries.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!catId) return;

    try {
      const record: FoodRecordType = {
        id: `${catId}-${selectedDate}`,
        catId,
        date: selectedDate,
        mainFood: mainFoodEntries,
        snacks: snackEntries,
      };

      await saveFoodRecord(record);
      toast.success('음식 섭취 기록이 저장되었습니다!');
      navigate(`/${catId}`);
    } catch (error) {
      console.error('Save error:', error);
      toast.error('저장 중 오류가 발생했습니다');
    }
  };

  if (!cat) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-pink-50 pb-10">
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
            <span className="text-4xl">🍽️</span>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{cat.name} 음식섭취</h1>
              <p className="text-gray-500 text-sm">먹은 음식을 기록하세요</p>
            </div>
          </div>

          {/* Date Selector */}
          <Card className="bg-white rounded-2xl p-4 shadow-sm border-0 mb-4">
            <Label className="text-sm font-semibold text-gray-700 mb-2 block">기록 날짜</Label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border-2 border-orange-200 rounded-xl focus:border-orange-400"
            />
          </Card>
        </div>

        {/* Main Food Section */}
        <Card className="bg-white rounded-3xl p-6 mb-4 shadow-sm border-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">주식 (사료)</h2>
            <Button onClick={addMainFood} size="sm" className="rounded-full bg-orange-500 hover:bg-orange-600">
              <Plus className="w-4 h-4 mr-1" />
              추가
            </Button>
          </div>

          <div className="space-y-3">
            {mainFoodEntries.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                아직 기록이 없습니다
              </div>
            ) : (
              mainFoodEntries.map((entry, index) => (
                <div key={index} className="flex gap-2 items-end bg-orange-50 p-3 rounded-2xl">
                  <div className="flex-1">
                    <Label className="text-xs text-gray-600">급여량 (g)</Label>
                    <Input
                      type="number"
                      value={entry.amount}
                      onChange={(e) => updateMainFood(index, 'amount', e.target.value)}
                      placeholder="50"
                      className="border-0 bg-white rounded-xl mt-1"
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs text-gray-600">시간</Label>
                    <Input
                      type="time"
                      value={entry.time}
                      onChange={(e) => updateMainFood(index, 'time', e.target.value)}
                      className="border-0 bg-white rounded-xl mt-1"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeMainFood(index)}
                    className="text-red-500 hover:bg-red-50 rounded-xl"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>

          {mainFoodEntries.length > 0 && (
            <div className="mt-4 p-3 bg-orange-100 rounded-2xl">
              <p className="text-sm font-semibold text-orange-800 text-center">
                총 {mainFoodEntries.reduce((sum, entry) => sum + entry.amount, 0)}g
              </p>
            </div>
          )}
        </Card>

        {/* Snacks Section */}
        <Card className="bg-white rounded-3xl p-6 mb-6 shadow-sm border-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">간식</h2>
            <Button onClick={addSnack} size="sm" className="rounded-full bg-pink-500 hover:bg-pink-600">
              <Plus className="w-4 h-4 mr-1" />
              추가
            </Button>
          </div>

          <div className="space-y-3">
            {snackEntries.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                아직 기록이 없습니다
              </div>
            ) : (
              snackEntries.map((entry, index) => (
                <div key={index} className="bg-pink-50 p-3 rounded-2xl space-y-2">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label className="text-xs text-gray-600">간식 이름</Label>
                      <Input
                        type="text"
                        value={entry.name}
                        onChange={(e) => updateSnack(index, 'name', e.target.value)}
                        placeholder="츄르"
                        className="border-0 bg-white rounded-xl mt-1"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSnack(index)}
                      className="text-red-500 hover:bg-red-50 rounded-xl mt-5"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label className="text-xs text-gray-600">양</Label>
                      <Input
                        type="text"
                        value={entry.amount}
                        onChange={(e) => updateSnack(index, 'amount', e.target.value)}
                        placeholder="1개"
                        className="border-0 bg-white rounded-xl mt-1"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs text-gray-600">시간</Label>
                      <Input
                        type="time"
                        value={entry.time}
                        onChange={(e) => updateSnack(index, 'time', e.target.value)}
                        className="border-0 bg-white rounded-xl mt-1"
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white rounded-full h-14 text-base font-semibold shadow-lg"
        >
          저장하기
        </Button>
      </div>
    </div>
  );
}