import { NextResponse } from 'next/server';
import { google } from 'googleapis';

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

// Configura Google Drive API con Service Account
function getGoogleDriveService() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });

  return google.drive({ version: 'v3', auth });
}

export async function GET() {
  try {
    console.log('🔄 Iniziando sincronizzazione Google Drive...');
    
    const drive = getGoogleDriveService();
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    
    if (!folderId) {
      throw new Error('GOOGLE_DRIVE_FOLDER_ID non configurato');
    }

    // Ottieni le foto dalla cartella Google Drive
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false and (mimeType contains 'image/')`,
      fields: 'files(id, name, size, createdTime, mimeType, webViewLink, thumbnailLink)',
      orderBy: 'createdTime desc',
    });

    const files = response.data.files || [];
    console.log(`📁 Trovati ${files.length} file nella cartella Drive`);

    // Converti i file Drive nel formato Photo
    const photos: Photo[] = files.map((file) => ({
      id: file.id || '',
      name: file.name || 'Senza nome',
      filename: file.name || 'unknown',
      uploadDate: file.createdTime || new Date().toISOString(),
      size: parseInt(file.size || '0'),
      driveData: {
        fileId: file.id || '',
        webViewLink: file.webViewLink || '',
        thumbnailLink: file.thumbnailLink || '',
        mimeType: file.mimeType || '',
      },
    }));

    // Ottieni l'URL della cartella
    const folderResponse = await drive.files.get({
      fileId: folderId,
      fields: 'webViewLink',
    });

    const folderUrl = folderResponse.data.webViewLink || '';

    console.log(`✅ Sincronizzazione completata: ${photos.length} foto`);

    return NextResponse.json({
      message: `Sincronizzazione completata: ${photos.length} foto trovate`,
      photos,
      folderUrl,
      success: true,
    });
    
  } catch (err) {
    console.error('❌ Errore Google Drive sync:', err);
    
    // Errore più dettagliato per il debug
    const errorMessage = err instanceof Error ? err.message : 'Errore sconosciuto';
    
    return NextResponse.json({
      error: 'Failed to sync with Google Drive',
      details: errorMessage,
      photos: [],
      folderUrl: null,
      success: false,
    }, { status: 500 });
  }
}