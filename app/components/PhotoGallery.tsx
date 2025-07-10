import fs from 'fs/promises';
import path from 'path';

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

export interface Photo {
  id: string;
  name: string;
  filename: string;
  uploadDate: string;
  size: number;
  driveData?: {
    webContentLink?: string;
    thumbnailLink?: string;
    mimeType?: string;
  };
}

// Assicura che la directory uploads esista
export async function ensureUploadsDir() {
  try {
    await fs.access(UPLOADS_DIR);
  } catch {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
  }
}

// Database JSON semplice per memorizzare i metadati
const DB_PATH = path.join(process.cwd(), 'photos.json');

export async function getPhotos(): Promise<Photo[]> {
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    // File non esiste ancora, ritorna array vuoto
    return [];
  }
}

export async function savePhoto(photo: Photo): Promise<void> {
  const photos = await getPhotos();
  photos.push(photo);
  await fs.writeFile(DB_PATH, JSON.stringify(photos, null, 2));
}

export async function getPhotoById(id: string): Promise<Photo | null> {
  const photos = await getPhotos();
  return photos.find(p => p.id === id) || null;
}