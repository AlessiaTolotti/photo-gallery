import { NextResponse } from 'next/server';

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

export async function GET() {
  try {
    console.log('API watch chiamata');
    
    // Per ora restituiamo una risposta di esempio tipizzata
    // Implementerai il monitoraggio cartella locale dopo
    const photos: Photo[] = [];
    
    return NextResponse.json({
      message: 'Local folder watch not implemented yet',
      photos,
      watchFolder: null
    });
    
  } catch (err) {
    console.error('Errore watch folder:', err);
    return NextResponse.json(
      { error: 'Failed to watch local folder' },
      { status: 500 }
    );
  }
}