import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getPhotos, savePhoto, Photo } from '@/lib/storage';

// Configura Google Drive API
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/drive.readonly'],
});

const drive = google.drive({ version: 'v3', auth });

// Estendi l'interfaccia Photo per includere i dati di Google Drive
interface PhotoWithDrive extends Photo {
  driveData?: {
    webContentLink?: string;
    thumbnailLink?: string;
    mimeType?: string;
  };
}

export async function GET() {
  try {
    // ID della cartella Google Drive da monitorare
    const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;
    
    if (!FOLDER_ID) {
      return NextResponse.json({ 
        error: 'ID cartella Google Drive non configurato' 
      }, { status: 500 });
    }

    // Lista tutti i file nella cartella
    const response = await drive.files.list({
      q: `'${FOLDER_ID}' in parents and mimeType contains 'image/'`,
      fields: 'files(id, name, mimeType, size, createdTime, webContentLink, thumbnailLink)',
      orderBy: 'createdTime desc',
    });

    const files = response.data.files || [];
    
    // Ottieni le foto già salvate
    const existingPhotos = await getPhotos();
    const existingIds = existingPhotos.map(p => p.id);

    // Trova nuove immagini
    const newFiles = files.filter(file => !existingIds.includes(file.id!));

    // Salva le nuove immagini nel database
    for (const file of newFiles) {
      const photo: PhotoWithDrive = {
        id: file.id!,
        name: file.name!,
        filename: file.id!, // Usiamo l'ID di Google Drive come filename
        uploadDate: file.createdTime!,
        size: parseInt(file.size || '0'),
        driveData: {
          webContentLink: file.webContentLink || undefined,
          thumbnailLink: file.thumbnailLink || undefined,
          mimeType: file.mimeType || undefined,
        }
      };
      
      await savePhoto(photo as Photo);
    }

    // Restituisci tutte le foto
    const allPhotos = await getPhotos();
    
    return NextResponse.json({
      message: `Trovate ${newFiles.length} nuove immagini`,
      folderUrl: `https://drive.google.com/drive/folders/${FOLDER_ID}`,
      photos: allPhotos
    });
  } catch (error) {
    console.error('Errore nella sincronizzazione con Google Drive:', error);
    return NextResponse.json({ 
      error: 'Errore nella sincronizzazione con Google Drive',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}