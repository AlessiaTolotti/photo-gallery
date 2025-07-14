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

  // Sincronizza con la cartella esterna
  const syncWithFolder = async () => {
    setLoading(true);
    try {
      console.log('🔄 Tentativo sincronizzazione Google Drive...');
      const response = await fetch('/api/photos/drive-sync');
      const data = await response.json();
      
      console.log('📁 Risposta drive-sync:', data);
      console.log('📸 Numero foto ricevute:', data.photos?.length || 0);
      
      if (data.folderUrl) {
        setWatchFolder(data.folderUrl);
        console.log('📂 Folder URL impostato:', data.folderUrl);
      }
      
      if (data.photos && data.photos.length > 0) {
        setPhotos(data.photos);
        console.log('✅ Foto impostate nello stato:', data.photos.length);
        // Debug delle prime foto
        data.photos.slice(0, 2).forEach((photo: Photo, index: number) => {
          console.log(`📸 Foto ${index + 1}:`, {
            name: photo.name,
            id: photo.id,
            hasFileId: !!photo.driveData?.fileId,
            hasThumbnail: !!photo.driveData?.thumbnailLink,
            thumbnailLink: photo.driveData?.thumbnailLink
          });
        });
      } else {
        console.log('❌ Nessuna foto ricevuta da drive-sync');
        setPhotos([]);
      }
      
      if (data.message) {
        console.log('💬 Messaggio:', data.message);
      }
    } catch (error) {
      console.error('❌ Errore nella sincronizzazione Drive:', error);
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
    
    // Auto-sincronizzazione ogni 30 secondi
    const interval = setInterval(() => {
      syncWithFolder();
    }, 30000);
    
    return () => clearInterval(interval);
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

  // Componente DriveImage inline per evitare problemi di import
  const renderDriveImage = (photo: Photo, imageProps: {
    fill?: boolean;
    width?: number;
    height?: number;
    sizes?: string;
    className?: string;
    style?: React.CSSProperties;
    priority?: boolean;
  }) => {
    console.log('🖼️ Rendering image for:', photo.name);
    console.log('📁 DriveData:', photo.driveData);
    
    const getImageUrl = () => {
      // Se abbiamo un thumbnail, usalo (è più veloce)
      if (photo.driveData?.thumbnailLink) {
        const thumbUrl = photo.driveData.thumbnailLink.replace('s220', 's400');
        console.log('👀 Using thumbnail URL:', thumbUrl);
        return thumbUrl;
      }
      
      // Altrimenti usa la nostra API proxy
      if (photo.driveData?.fileId) {
        const apiUrl = `/api/drive-image/${photo.driveData.fileId}`;
        console.log('🔗 Using API proxy URL:', apiUrl);
        return apiUrl;
      }
      
      // Fallback
      console.log('❌ No image source, using placeholder');
      return '/placeholder-image.jpg';
    };

    const imageUrl = getImageUrl();
    console.log('📸 Final image URL:', imageUrl);

    return (
      <Image
        src={imageUrl}
        alt={photo.name}
        {...imageProps}
        onLoad={() => {
          console.log('✅ Image loaded successfully:', photo.name);
        }}
        onError={(e) => {
          console.error('❌ Image load error for:', photo.name, 'URL:', imageUrl);
          const target = e.target as HTMLImageElement;
          target.src = '/placeholder-image.jpg';
        }}
        unoptimized
      />
    );
  };

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
            {photos.length} {photos.length === 1 ? 'foto' : 'foto'} trovate
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
      </div>

      {/* Galleria con animazioni */}
      <div className="gallery-grid">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Sincronizzazione automatica in corso...</p>
          </div>
        ) : photos.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📂</div>
            <h3>Sincronizzazione automatica</h3>
            <p>Le foto vengono caricate automaticamente da Google Drive</p>
            <div className="auto-sync-info">
              <div className="loading-spinner" style={{ margin: '1rem auto' }}></div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '1rem' }}>
                Nessun intervento richiesto - tutto automatico
              </p>
            </div>
          </div>
        ) : (
          photos.map((photo, index) => (
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
                    priority: index === 0
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
            <div className="modal-drive-placeholder">
              {selectedPhoto.driveData ? (
                renderDriveImage(selectedPhoto, {
                  width: 800,
                  height: 600,
                  style: { objectFit: 'contain', width: '100%', height: 'auto' }
                })
              ) : (
                <div style={{ padding: '4rem', textAlign: 'center', fontSize: '1.125rem' }}>
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
      `}</style>
    </div>
  );
}