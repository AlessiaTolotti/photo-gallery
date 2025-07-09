import { NextRequest, NextResponse } from 'next/server';
import { getPhotoById } from '@/lib/storage';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const photo = await getPhotoById(params.id);
    
    if (!photo) {
      return NextResponse.json({ error: 'Foto non trovata' }, { status: 404 });
    }

    return NextResponse.json(photo);
  } catch (error) {
    console.error('Errore GET by ID:', error);
    return NextResponse.json({ error: 'Errore nel recupero della foto' }, { status: 500 });
  }
}