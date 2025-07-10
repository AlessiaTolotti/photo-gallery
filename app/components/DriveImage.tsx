import Image from 'next/image';

interface DriveImageProps {
  photo: {
    id: string;
    name: string;
    driveData?: {
      fileId?: string;
      thumbnailLink?: string;
      mimeType?: string;
    };
  };
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  className?: string;
  style?: React.CSSProperties;
  priority?: boolean;
  alt?: string;
}

export default function DriveImage({ 
  photo, 
  alt,
  ...imageProps 
}: DriveImageProps) {
  // Costruisci l'URL dell'immagine da Google Drive
  const getImageUrl = () => {
    if (!photo.driveData?.fileId) {
      return '/placeholder-image.jpg'; // Immagine placeholder
    }

    // Per le immagini di Google Drive, usiamo l'endpoint di download diretto
    // Questo URL permette di visualizzare l'immagine senza autenticazione se il file è pubblico
    return `https://drive.google.com/uc?export=view&id=${photo.driveData.fileId}`;
  };

  // Se abbiamo un thumbnail link, usiamo quello per le anteprime piccole
  const getThumbnailUrl = () => {
    if (photo.driveData?.thumbnailLink) {
      // Modifica la dimensione del thumbnail se necessario
      return photo.driveData.thumbnailLink.replace('s220', 's400');
    }
    return getImageUrl();
  };

  // Usa thumbnail per le anteprime, immagine completa per le visualizzazioni grandi
  const imageUrl = imageProps.width && imageProps.width > 300 ? getImageUrl() : getThumbnailUrl();

  return (
    <Image
      src={imageUrl}
      alt={alt || photo.name}
      {...imageProps}
      onError={(e) => {
        // Fallback in caso di errore
        console.warn(`Errore caricamento immagine Drive: ${photo.name}`);
        const target = e.target as HTMLImageElement;
        target.src = '/placeholder-image.jpg';
      }}
    />
  );
}