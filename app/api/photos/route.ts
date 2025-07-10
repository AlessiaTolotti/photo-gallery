import { NextRequest, NextResponse } from 'next/server';

interface Photo {
  id: string;
  name: string;
  filename: string;
  uploadDate: string;
  size: number;
  driveData?: {
    fileId?: string;
    webViewLink?: string;
    thumbnailLink?: string;
    mimeType?: string;
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const name = searchParams.get('name');
    const date = searchParams.get('date');
    
    // Per ora restituiamo un array vuoto tipizzato - implementerai la logica dopo
    const photos: Photo[] = [];
    
    console.log('API /photos chiamata con filtri:', { name, date });
    
    return NextResponse.json(photos);
    
  } catch (err) {
    console.error('Errore API /photos:', err);
    return NextResponse.json(
      { error: 'Failed to fetch photos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Logica per caricare nuove foto
    console.log('Caricamento foto:', body);
    
    return NextResponse.json({
      message: 'Photo uploaded successfully',
      photo: body
    });
    
  } catch (err) {
    console.error('Errore caricamento foto:', err);
    return NextResponse.json(
      { error: 'Failed to upload photo' },
      { status: 500 }
    );
  }
}