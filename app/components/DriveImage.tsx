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
  // Per Google Drive, usiamo un proxy API che gestisce l'autenticazione
  const getImageUrl = () => {
    if (!photo.driveData?.fileId) {
      return '/placeholder-image.jpg';
    }

    // Usa la nostra API proxy per scaricare l'immagine
    return `/api/drive-image/${photo.driveData.fileId}`;
  };

  // Per i thumbnail, usa il thumbnailLink se disponibile
  const getThumbnailUrl = () => {
    if (photo.driveData?.thumbnailLink) {
      // Il thumbnailLink è pubblico e non richiede autenticazione
      return photo.driveData.thumbnailLink;
    }
    return getImageUrl();
  };

  // Usa thumbnail per anteprime piccole, immagine completa per grandi
  const shouldUseThumbnail = !imageProps.width || imageProps.width <= 400;
  const imageUrl = shouldUseThumbnail ? getThumbnailUrl() : getImageUrl();

  return (
    <Image
      src={imageUrl}
      alt={alt || photo.name}
      {...imageProps}
      onError={(e) => {
        console.warn(`Errore caricamento immagine Drive: ${photo.name}`);
        const target = e.target as HTMLImageElement;
        // Fallback al thumbnail se l'immagine principale fallisce
        if (!shouldUseThumbnail && photo.driveData?.thumbnailLink) {
          target.src = photo.driveData.thumbnailLink;
        } else {
          target.src = '/placeholder-image.jpg';
        }
      }}
      unoptimized // Importante per immagini esterne
    />
  );
}