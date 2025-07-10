import { useState, useEffect } from 'react';
import Image from 'next/image';

interface DriveImageProps {
  photo: {
    id: string;
    name: string;
    driveData?: {
      thumbnailLink?: string;
      webContentLink?: string;
    };
  };
  sizes?: string;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  priority?: boolean;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export default function DriveImage({ photo, fill, width, height, ...props }: DriveImageProps) {
  const [imageUrl, setImageUrl] = useState<string>('');

  useEffect(() => {
    // Usa il thumbnail per l'anteprima (più veloce)
    if (photo.driveData?.thumbnailLink) {
      // Modifica il link per ottenere una risoluzione più alta
      const highResThumbnail = photo.driveData.thumbnailLink.replace('=s220', '=s800');
      setImageUrl(highResThumbnail);
    }
  }, [photo]);

  if (!imageUrl) {
    return (
      <div className="photo-placeholder">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return fill ? (
    <Image
      src={imageUrl}
      alt={photo.name}
      fill
      {...props}
      unoptimized // Necessario per URL esterni
    />
  ) : (
    <Image
      src={imageUrl}
      alt={photo.name}
      width={width || 1200}
      height={height || 800}
      {...props}
      unoptimized // Necessario per URL esterni
    />
  );
}