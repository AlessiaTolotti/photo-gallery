import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getPhotos, savePhoto, Photo } from '@/lib/storage';

// Cartella da monitorare - MODIFICA QUESTO PATH
const WATCH_FOLDER = path.join('C:', 'Users', 'Tolotti Alessia', 'Desktop', 'PhotoStudioImages');

export async function GET() {
  try {
    // Assicurati che la cartella esista
    try {
      await fs.access(WATCH_FOLDER);
    } catch {
      await fs.mkdir(WATCH_FOLDER, { recursive: true });
      return NextResponse.json({ 
        message: `Cartella creata in: ${WATCH_FOLDER}. Inserisci le immagini qui.`,
        photos: [] 
      });
    }

    // Leggi tutti i file nella cartella
    const files = await fs.readdir(WATCH_FOLDER);
    
    // Filtra solo le immagini
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
    const imageFiles = files.filter(file => 
      imageExtensions.includes(path.extname(file).toLowerCase())
    );

    // Ottieni le foto già salvate nel database
    const existingPhotos = await getPhotos();
    const existingFilenames = existingPhotos.map(p => p.filename);

    // Trova nuove immagini
    const newImages = imageFiles.filter(file => !existingFilenames.includes(file));

    // Importa le nuove immagini
    for (const filename of newImages) {
      const sourcePath = path.join(WATCH_FOLDER, filename);
      const destPath = path.join(process.cwd(), 'public', 'uploads', filename);
      
      // Copia il file nella cartella uploads
      await fs.copyFile(sourcePath, destPath);
      
      // Ottieni info sul file
      const stats = await fs.stat(sourcePath);
      
      // Salva nei metadati
      const photo: Photo = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: filename,
        filename: filename,
        uploadDate: new Date().toISOString(),
        size: stats.size
      };
      
      await savePhoto(photo);
    }

    // Restituisci tutte le foto
    const allPhotos = await getPhotos();
    
    return NextResponse.json({
      message: `Trovate ${newImages.length} nuove immagini`,
      watchFolder: WATCH_FOLDER,
      photos: allPhotos
    });
  } catch (error) {
    console.error('Errore nel monitoraggio della cartella:', error);
    return NextResponse.json({ 
      error: 'Errore nel monitoraggio della cartella',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}