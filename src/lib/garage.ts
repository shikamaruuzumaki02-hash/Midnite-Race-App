import { createClient } from '@/lib/supabase/client';

export const MAX_GARAGE_PHOTOS = 5;

export interface CarModel {
  id: string;
  name: string;
  created_at: string;
}

export interface GaragePhoto {
  id: string;
  garage_id: string;
  photo_url: string;
  position: number;
  created_at: string;
}

export interface Garage {
  id: string;
  user_id: string;
  model_id: string;
  created_at: string;
  garage_photos: GaragePhoto[];
  profiles?: {
    id: string;
    name: string;
  };
}

export async function getCarModels(): Promise<CarModel[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('car_models')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getCarModelById(modelId: string): Promise<CarModel | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('car_models')
    .select('*')
    .eq('id', modelId)
    .single();

  if (error) return null;
  return data;
}

export async function getGaragesByModel(modelId: string): Promise<Garage[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('garages')
    .select(
      `
      id,
      user_id,
      model_id,
      created_at,
      garage_photos (
        id,
        garage_id,
        photo_url,
        position,
        created_at
      ),
      profiles:user_id (
        id,
        name
      )
    `
    )
    .eq('model_id', modelId);

  if (error) throw error;

  const garages = (data ?? []) as unknown as Garage[];

  garages.forEach((garage) => {
    garage.garage_photos.sort((a, b) => a.position - b.position);
  });

  garages.sort((a, b) => {
    const nameA = a.profiles?.name ?? '';
    const nameB = b.profiles?.name ?? '';
    return nameA.localeCompare(nameB);
  });

  return garages;
}

export async function getUserGarageForModel(
  userId: string,
  modelId: string
): Promise<Garage | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('garages')
    .select(
      `
      id,
      user_id,
      model_id,
      created_at,
      garage_photos (
        id,
        garage_id,
        photo_url,
        position,
        created_at
      )
    `
    )
    .eq('user_id', userId)
    .eq('model_id', modelId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const garage = data as unknown as Garage;
  garage.garage_photos.sort((a, b) => a.position - b.position);
  return garage;
}

export async function createGarage(userId: string, modelId: string): Promise<Garage> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('garages')
    .insert({ user_id: userId, model_id: modelId })
    .select()
    .single();

  if (error) throw error;
  return { ...data, garage_photos: [] };
}

export function getNextAvailablePosition(photos: GaragePhoto[]): number | null {
  const usedPositions = new Set(photos.map((p) => p.position));
  for (let i = 0; i < MAX_GARAGE_PHOTOS; i++) {
    if (!usedPositions.has(i)) return i;
  }
  return null;
}

export async function deleteGaragePhoto(photoId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('garage_photos').delete().eq('id', photoId);
  if (error) throw error;
}

export async function insertGaragePhoto(
  garageId: string,
  photoUrl: string,
  position: number
): Promise<GaragePhoto> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('garage_photos')
    .insert({ garage_id: garageId, photo_url: photoUrl, position })
    .select()
    .single();

  if (error) throw error;
  return data;
    }
