import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import { ensureUploadsDir, getPhotos, savePhoto, Photo } from '@/lib/storage';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const nameFilter = searchParams.get('name')?.toLowerCase() || '';
    const dateFilter = searchParams.get('date') || '';

    let photos = await getPhotos();

    // Applica filtri
    if (nameFilter) {
      photos = photos.filter(p => 
        p.name.toLowerCase().includes(nameFilter)
      );
    }

    if (dateFilter) {
      photos = photos.filter(p => 
        p.uploadDate.startsWith(dateFilter)
      );
    }

    return NextResponse.json(photos);
  } catch (error) {
    console.error('Errore GET:', error);
    return NextResponse.json({ error: 'Errore nel recupero delle foto' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureUploadsDir();

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'Nessun file caricato' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Genera nome univoco
    const uniqueId = Date.now().toString();
    const fileExtension = path.extname(file.name);
    const filename = `photo-${uniqueId}${fileExtension}`;
    const filepath = path.join(process.cwd(), 'public', 'uploads', filename);

    // Salva il file
    await writeFile(filepath, buffer);

    // Salva i metadati
    const photo: Photo = {
      id: uniqueId,
      name: file.name,
      filename: filename,
      uploadDate: new Date().toISOString(),
      size: file.size
    };

    await savePhoto(photo);

    return NextResponse.json({ 
      message: 'Foto caricata con successo',
      photo 
    });
  } catch (error) {
    console.error('Errore POST:', error);
    return NextResponse.json({ error: 'Errore nel caricamento' }, { status: 500 });
  }
}