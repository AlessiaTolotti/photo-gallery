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
    console.log('API drive-sync chiamata');
    
    // Per ora restituiamo una risposta di esempio tipizzata
    // Implementerai la vera integrazione Google Drive dopo
    const photos: Photo[] = [];
    
    return NextResponse.json({
      message: 'Google Drive sync not implemented yet',
      photos,
      folderUrl: null
    });
    
  } catch (err) {
    console.error('Errore Google Drive sync:', err);
    return NextResponse.json(
      { error: 'Failed to sync with Google Drive' },
      { status: 500 }
    );
  }
}