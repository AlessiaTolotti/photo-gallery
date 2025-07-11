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
  // Debug: logga i dati della foto
  console.log('🖼️ DriveImage rendering:', {
    photoId: photo.id,
    hasFileId: !!photo.driveData?.fileId,
    hasThumbnail: !!photo.driveData?.thumbnailLink,
    thumbnailLink: photo.driveData?.thumbnailLink
  });

  const getImageUrl = () => {
    if (!photo.driveData?.fileId) {
      console.log('❌ No fileId, using placeholder');
      return '/placeholder-image.jpg';
    }

    const url = `/api/drive-image/${photo.driveData.fileId}`;
    console.log('🔗 Using API proxy URL:', url);
    return url;
  };

  const getThumbnailUrl = () => {
    if (photo.driveData?.thumbnailLink) {
      // Google Drive thumbnails sono pubblici, dovrebbero funzionare
      const thumbUrl = photo.driveData.thumbnailLink.replace('s220', 's400');
      console.log('👀 Using thumbnail URL:', thumbUrl);
      return thumbUrl;
    }
    return getImageUrl();
  };

  // Usa sempre il thumbnail per le anteprime (più veloce)
  const shouldUseThumbnail = photo.driveData?.thumbnailLink;
  const imageUrl = shouldUseThumbnail ? getThumbnailUrl() : getImageUrl();
  
  console.log('📸 Final image URL:', imageUrl);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Image
        src={imageUrl}
        alt={alt || photo.name}
        {...imageProps}
        onLoad={() => {
          console.log('✅ Image loaded successfully:', photo.name);
        }}
        onError={(e) => {
          console.error('❌ Image load error:', photo.name, imageUrl);
          const target = e.target as HTMLImageElement;
          
          // Prova fallback al thumbnail se non era già quello
          if (!shouldUseThumbnail && photo.driveData?.thumbnailLink) {
            console.log('🔄 Trying thumbnail fallback...');
            target.src = photo.driveData.thumbnailLink;
          } else if (imageUrl !== '/placeholder-image.jpg') {
            console.log('🔄 Using placeholder fallback...');
            target.src = '/placeholder-image.jpg';
          }
        }}
        unoptimized // Importante per immagini esterne
      />
      
      {/* Indicatore di caricamento/debug */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'absolute',
          top: '4px',
          left: '4px',
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '2px 6px',
          fontSize: '10px',
          borderRadius: '3px'
        }}>
          {shouldUseThumbnail ? 'THUMB' : 'API'}
        </div>
      )}
    </div>
  );
}