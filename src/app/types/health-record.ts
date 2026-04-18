export interface Cat {
  id: string;
  name: string;
  birthDate: string;   // 'YYYY-MM-DD'
  gender: 'female' | 'male';
  breed: string;
  neutered: boolean;
  photoUrl?: string;   // Supabase Storage URL
}

export interface FoodRecord {
  id: string;
  catId: string;
  date: string;
  mainFood: {
    amount: number; // grams
    time: string;
  }[];
  snacks: {
    name: string;
    amount: string;
    time: string;
  }[];
}

export interface VitalityRecord {
  id: string;
  catId: string;
  date: string;
  status: 'very-active' | 'active' | 'normal' | 'tired' | 'sick';
  notes?: string;
}

export interface MedicationRecord {
  id: string;
  catId: string;
  date: string;
  morning: boolean;
  evening: boolean;
  notes?: string;
}

export interface ToothBrushRecord {
  id: string;
  catId: string;
  date: string;
  morning: boolean;
  evening: boolean;
}

export interface PoopRecord {
  id: string;
  catId: string;
  date: string;
  status: 'normal' | 'soft' | 'diarrhea' | 'constipation';
  photoUrl?: string;
  notes?: string;
}

export interface VomitRecord {
  id: string;
  catId: string;
  date: string;
  occurred: boolean;
  photoUrl?: string;
  notes?: string;
}

export interface DailyRecord {
  date: string;
  catId: string;
  food?: FoodRecord;
  vitality?: VitalityRecord;
  medication?: MedicationRecord;
  toothbrush?: ToothBrushRecord;
  poop?: PoopRecord;
  vomit?: VomitRecord;
}