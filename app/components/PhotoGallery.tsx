'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface GoogleDriveData {
  fileId?: string;
  webViewLink?: string;
  thumbnailLink?: string;
  mimeType?: string;
}

interface Photo {
  id: string;
  name: string;
  filename: string;
  uploadDate: string;
  size: number;
  driveData?: GoogleDriveData;
}

export default function PhotoGallery() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [nameFilter, setNameFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [watchFolder, setWatchFolder] = useState<string>('');
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  // Sincronizza con la cartella esterna
  const syncWithFolder = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/photos/drive-sync');
      const data = await response.json();
      
      if (data.folderUrl) {
        setWatchFolder(data.folderUrl);
      }
      
      if (data.photos && data.photos.length > 0) {
        setPhotos(data.photos);
      } else {
        setPhotos([]);
      }
      
    } catch (error) {
      console.error('❌ Errore sincronizzazione:', error);
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🚀 PhotoGallery inizializzato');
    
    // Auto-sincronizzazione all'avvio
    const initSync = async () => {
      await syncWithFolder();
    };
    
    initSync();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return Math.round(bytes / 1024) + ' KB';
    else return Math.round(bytes / 1048576) + ' MB';
  };

  // Gestisce errori di caricamento immagine
  const handleImageError = (photoId: string) => {
    console.log(`⚠️ Errore caricamento immagine per foto: ${photoId}`);
    setImageErrors(prev => new Set(prev).add(photoId));
  };

  // Converte l'URL di Google Drive in un formato utilizzabile
  const getDriveImageUrl = (fileId: string, size: 'thumbnail' | 'large' = 'thumbnail') => {
    if (!fileId) return null;
    
    // Usa l'API diretta di Google Drive per le immagini pubbliche
    if (size === 'thumbnail') {
      // Per le thumbnail, usa una dimensione più piccola
      return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
    } else {
      // Per le immagini grandi, usa una dimensione maggiore
      return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`;
    }
  };

  // Verifica se l'URL dell'immagine è valido
  const isValidImageUrl = (url: string) => {
    if (!url) return false;
    
    // Blocca URL di Google Drive con storage diretto che non funzionano
    if (url.includes('drive-storage') && url.includes('googleusercontent.com')) {
      return false;
    }
    
    return true;
  };

  // Componente DriveImage migliorato con gestione errori
  const renderDriveImage = (photo: Photo, imageProps: {
    fill?: boolean;
    width?: number;
    height?: number;
    sizes?: string;
    className?: string;
    style?: React.CSSProperties;
    priority?: boolean;
    isModal?: boolean;
  }) => {
    
    // Se c'è stato un errore per questa foto, mostra il placeholder
    if (imageErrors.has(photo.id)) {
      return (
        <div className="drive-placeholder error-placeholder">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{width: '48px', height: '48px', color: '#ef4444'}}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span style={{color: '#ef4444', fontSize: '0.75rem'}}>Immagine non disponibile</span>
          <span style={{color: '#6b7280', fontSize: '0.625rem'}}>{photo.name}</span>
        </div>
      );
    }
    
    const getImageUrl = () => {
      // Determina la dimensione basandosi su se è un modal o no
      const size = imageProps.isModal ? 'large' : 'thumbnail';
      
      // Se abbiamo un fileId, usa la funzione di conversione
      if (photo.driveData?.fileId) {
        return getDriveImageUrl(photo.driveData.fileId, size);
      }
      
      // Se abbiamo un thumbnailLink valido, prova a convertirlo
      if (photo.driveData?.thumbnailLink && isValidImageUrl(photo.driveData.thumbnailLink)) {
        // Estrai il fileId dal thumbnailLink se possibile
        const fileIdMatch = photo.driveData.thumbnailLink.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
        if (fileIdMatch) {
          return getDriveImageUrl(fileIdMatch[1], size);
        }
        return photo.driveData.thumbnailLink;
      }
      
      // Se abbiamo webViewLink, prova a estrarre il fileId
      if (photo.driveData?.webViewLink) {
        const fileIdMatch = photo.driveData.webViewLink.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
        if (fileIdMatch) {
          return getDriveImageUrl(fileIdMatch[1], size);
        }
      }
      
      // Prova il nostro proxy API come fallback
      if (photo.driveData?.fileId) {
        return `/api/drive-image/${photo.driveData.fileId}`;
      }
      
      // Fallback finale
      return '/placeholder-image.jpg';
    };

    const imageUrl = getImageUrl();
    
    if (!imageUrl) {
      return (
        <div className="drive-placeholder">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{width: '48px', height: '48px'}}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <span>Google Drive</span>
        </div>
      );
    }

    // Rimuovi isModal dalle props prima di passarle al componente Image
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { isModal, ...imagePropsForImage } = imageProps;

    return (
      <Image
        src={imageUrl}
        alt={photo.name}
        {...imagePropsForImage}
        unoptimized
        onError={() => handleImageError(photo.id)}
        onLoad={() => {
          // Rimuovi l'errore se l'immagine si carica con successo
          setImageErrors(prev => {
            const newSet = new Set(prev);
            newSet.delete(photo.id);
            return newSet;
          });
        }}
      />
    );
  };

  // Funzione per riprovare il caricamento delle immagini
  const retryImageLoading = () => {
    setImageErrors(new Set());
    // Forza un re-render per riprovare il caricamento
    setPhotos(current => [...current]);
  };

  // Filtra le foto
  const filteredPhotos = photos.filter(photo => {
    const matchesName = photo.name.toLowerCase().includes(nameFilter.toLowerCase());
    const matchesDate = !dateFilter || photo.uploadDate.startsWith(dateFilter);
    return matchesName && matchesDate;
  });

  return (
    <div className="photo-gallery-container">
      {/* Filtri con design moderno */}
      <div className="filters-section">
        <div className="filter-group">
          <div className="search-wrapper">
            <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Cerca per nome..."
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="date-wrapper">
            <svg className="date-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="date-input"
            />
          </div>

          {(nameFilter || dateFilter) && (
            <button
              onClick={() => {
                setNameFilter('');
                setDateFilter('');
              }}
              className="clear-filters"
            >
              Cancella filtri
            </button>
          )}
        </div>

        <div className="sync-info">
          <div className="results-count">
            {filteredPhotos.length} {filteredPhotos.length === 1 ? 'foto' : 'foto'} trovate
            {imageErrors.size > 0 && (
              <span className="error-count">
                • {imageErrors.size} errore{imageErrors.size !== 1 ? 'i' : ''}
              </span>
            )}
          </div>
          {loading && (
            <div className="sync-status">
              <div className="sync-spinner"></div>
              <span>Sincronizzazione automatica...</span>
            </div>
          )}
        </div>
        
        {watchFolder && (
          <div className="folder-info">
            <svg className="folder-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <span>📂 Connesso a Google Drive</span>
            <a href={watchFolder} target="_blank" rel="noopener noreferrer" style={{ marginLeft: '0.5rem', color: '#3b82f6', textDecoration: 'none' }}>
              Apri cartella →
            </a>
          </div>
        )}

        {imageErrors.size > 0 && (
          <div className="error-info">
            <svg className="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span>Alcune immagini non sono riuscite a caricarsi da Google Drive</span>
            <button 
              onClick={retryImageLoading}
              className="retry-button"
            >
              Riprova caricamento
            </button>
          </div>
        )}
      </div>

      {/* Galleria con animazioni */}
      <div className="gallery-grid">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Sincronizzazione automatica in corso...</p>
          </div>
        ) : filteredPhotos.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
              {photos.length === 0 ? '📂' : '🔍'}
            </div>
            <h3>
              {photos.length === 0 ? 'Sincronizzazione automatica' : 'Nessun risultato'}
            </h3>
            <p>
              {photos.length === 0 
                ? 'Le foto vengono caricate automaticamente da Google Drive'
                : 'Prova a modificare i filtri di ricerca'
              }
            </p>
            {photos.length === 0 && (
              <div className="auto-sync-info">
                <div className="loading-spinner" style={{ margin: '1rem auto' }}></div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '1rem' }}>
                  Nessun intervento richiesto - tutto automatico
                </p>
              </div>
            )}
          </div>
        ) : (
          filteredPhotos.map((photo, index) => (
            <div 
              key={photo.id} 
              className="photo-card"
              onClick={() => setSelectedPhoto(photo)}
            >
              <div className="photo-wrapper">
                {photo.driveData ? (
                  renderDriveImage(photo, {
                    fill: true,
                    sizes: "(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw",
                    className: "photo-image",
                    style: { objectFit: 'cover' },
                    priority: index === 0,
                    isModal: false
                  })
                ) : (
                  <div className="drive-placeholder">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{width: '48px', height: '48px'}}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    <span>Google Drive</span>
                  </div>
                )}
              </div>
              <div className="photo-overlay">
                <div className="photo-info">
                  <h3 className="photo-name">{photo.name}</h3>
                  <div className="photo-meta">
                    <span className="photo-date">{formatDate(photo.uploadDate)}</span>
                    <span className="photo-size">{formatFileSize(photo.size)}</span>
                  </div>
                </div>
                <button className="photo-action">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal per visualizzare foto a schermo intero */}
      {selectedPhoto && (
        <div className="photo-modal" onClick={() => setSelectedPhoto(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="modal-close"
              onClick={() => setSelectedPhoto(null)}
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="modal-image-container">
              {selectedPhoto.driveData ? (
                renderDriveImage(selectedPhoto, {
                  width: 800,
                  height: 600,
                  style: { objectFit: 'contain', width: '100%', height: 'auto' },
                  isModal: true
                })
              ) : (
                <div className="modal-drive-placeholder">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{width: '96px', height: '96px', margin: '0 auto 1rem'}}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  <span>Google Drive Image</span>
                </div>
              )}
            </div>
            <div className="modal-info">
              <h2>{selectedPhoto.name}</h2>
              <p>{formatDate(selectedPhoto.uploadDate)} • {formatFileSize(selectedPhoto.size)}</p>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .photo-gallery-container {
          padding: 2rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        /* Placeholder per Google Drive */
        .drive-placeholder, .modal-drive-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #f8f9fa;
          color: #6c757d;
          font-size: 0.875rem;
          text-align: center;
        }

        .error-placeholder {
          background: #fef2f2;
          color: #ef4444;
        }

        .modal-drive-placeholder {
          padding: 4rem;
          font-size: 1.125rem;
        }

        /* Sezione filtri migliorata */
        .filters-section {
          margin-bottom: 2rem;
          background: white;
          padding: 1.5rem;
          border-radius: 1rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .filter-group {
          display: flex;
          gap: 1rem;
          align-items: center;
          flex-wrap: wrap;
        }

        .search-wrapper, .date-wrapper {
          position: relative;
          flex: 1;
          min-width: 200px;
        }

        .search-icon, .date-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          width: 1.25rem;
          height: 1.25rem;
          color: #6b7280;
        }

        .search-input, .date-input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 3rem;
          border: 2px solid #e5e7eb;
          border-radius: 0.75rem;
          font-size: 0.95rem;
          transition: all 0.2s;
          background: #f9fafb;
        }

        .search-input:focus, .date-input:focus {
          outline: none;
          border-color: #3b82f6;
          background: white;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .clear-filters {
          padding: 0.75rem 1.5rem;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 0.75rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .clear-filters:hover {
          background: #dc2626;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
        }

        .sync-info {
          margin-top: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .results-count {
          color: #6b7280;
          font-size: 0.875rem;
        }

        .error-count {
          color: #ef4444;
          font-weight: 500;
        }

        .sync-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #6b7280;
          font-size: 0.875rem;
        }

        .sync-spinner {
          width: 1rem;
          height: 1rem;
          border: 2px solid #e5e7eb;
          border-top-color: #10b981;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .folder-info {
          margin-top: 1rem;
          padding: 0.75rem 1rem;
          background: #f3f4f6;
          border-radius: 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
        }

        .folder-icon {
          width: 1.25rem;
          height: 1.25rem;
          color: #6b7280;
        }

        .error-info {
          margin-top: 1rem;
          padding: 0.75rem 1rem;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: #dc2626;
        }

        .error-icon {
          width: 1.25rem;
          height: 1.25rem;
          color: #ef4444;
        }

        .retry-button {
          margin-left: auto;
          padding: 0.25rem 0.75rem;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 0.375rem;
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .retry-button:hover {
          background: #dc2626;
        }

        /* Gallery Grid */
        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
        }

        .empty-state {
          grid-column: 1 / -1;
          text-align: center;
          padding: 4rem;
          color: #6b7280;
        }

        .empty-state h3 {
          margin: 0 0 0.5rem 0;
          color: #374151;
        }

        .auto-sync-info {
          margin-top: 2rem;
        }

        /* Card foto */
        .photo-card {
          position: relative;
          aspect-ratio: 1;
          border-radius: 1rem;
          overflow: hidden;
          cursor: pointer;
          background: #f3f4f6;
          transition: all 0.3s;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .photo-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
        }

        .photo-wrapper {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .photo-image {
          object-fit: cover;
        }

        .photo-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, transparent 50%);
          opacity: 0;
          transition: opacity 0.3s;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 1rem;
        }

        .photo-card:hover .photo-overlay {
          opacity: 1;
        }

        .photo-info {
          margin-top: auto;
          color: white;
        }

        .photo-name {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 0.25rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .photo-meta {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          opacity: 0.9;
        }

        .photo-action {
          position: absolute;
          top: 1rem;
          right: 1rem;
          width: 2.5rem;
          height: 2.5rem;
          background: rgba(255, 255, 255, 0.9);
          border: none;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          backdrop-filter: blur(10px);
        }

        .photo-action:hover {
          background: white;
          transform: scale(1.1);
        }

        .photo-action svg {
          width: 1.25rem;
          height: 1.25rem;
          color: #1f2937;
        }

        /* Loading state */
        .loading-container {
          grid-column: 1 / -1;
          text-align: center;
          padding: 4rem;
          color: #6b7280;
        }

        .loading-spinner {
          width: 3rem;
          height: 3rem;
          border: 3px solid #e5e7eb;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Modal */
        .photo-modal {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 50;
          animation: fadeIn 0.3s;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal-content {
          position: relative;
          max-width: 90vw;
          max-height: 90vh;
          background: white;
          border-radius: 1rem;
          overflow: hidden;
          animation: slideIn 0.3s;
        }

        @keyframes slideIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        .modal-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          width: 3rem;
          height: 3rem;
          background: white;
          border: none;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 10;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .modal-close:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .modal-close svg {
          width: 1.5rem;
          height: 1.5rem;
          color: #1f2937;
        }

        .modal-image-container {
          position: relative;
          min-height: 400px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-info {
          padding: 1.5rem;
          background: white;
          text-align: center;
        }

        .modal-info h2 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #1f2937;
        }

        .modal-info p {
          color: #6b7280;
          font-size: 0.875rem;
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .filter-group {
            flex-direction: column;
            align-items: stretch;
          }

          .search-wrapper, .date-wrapper {
            min-width: unset;
          }

          .sync-info {
            flex-direction: column;
            gap: 0.5rem;
            align-items: flex-start;
          }

          .gallery-grid {
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 1rem;
          }
        }
      `}</style>
    </div>
  );
}