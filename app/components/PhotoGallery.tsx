'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';

interface Photo {
  id: string;
  name: string;
  filename: string;
  uploadDate: string;
  size: number;
}

export default function PhotoGallery() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [nameFilter, setNameFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carica le foto
  const loadPhotos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (nameFilter) params.append('name', nameFilter);
      if (dateFilter) params.append('date', dateFilter);

      const response = await fetch(`/api/photos?${params}`);
      const data = await response.json();
      setPhotos(data);
    } catch (error) {
      console.error('Errore nel caricamento delle foto:', error);
    } finally {
      setLoading(false);
    }
  }, [nameFilter, dateFilter]);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  // Gestisce l'upload
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/photos', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        await loadPhotos();
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (error) {
      console.error('Errore nell\'upload:', error);
    } finally {
      setUploading(false);
    }
  };

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

        <div className="results-count">
          {photos.length} {photos.length === 1 ? 'foto' : 'foto'} trovate
        </div>
      </div>

      {/* Galleria con animazioni */}
      <div className="gallery-grid">
        {/* Box upload stilizzato */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          className={`upload-box ${uploading ? 'uploading' : ''}`}
        >
          <div className="upload-content">
            {uploading ? (
              <>
                <div className="upload-spinner"></div>
                <p className="upload-text">Caricamento in corso...</p>
              </>
            ) : (
              <>
                <svg className="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="upload-text">Aggiungi foto</p>
                <p className="upload-subtext">Clicca o trascina qui</p>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
          />
        </div>

        {/* Foto con effetti hover migliorati */}
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Caricamento foto...</p>
          </div>
        ) : (
          photos.map((photo, index) => (
            <div 
              key={photo.id} 
              className="photo-card"
              onClick={() => setSelectedPhoto(photo)}
            >
              <div className="photo-wrapper">
                <Image
                  src={`/uploads/${photo.filename}`}
                  alt={photo.name}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  className="photo-image"
                  style={{ objectFit: 'cover' }}
                  priority={index === 0}
                />
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
            <Image
              src={`/uploads/${selectedPhoto.filename}`}
              alt={selectedPhoto.name}
              width={1200}
              height={800}
              className="modal-image"
              style={{ objectFit: 'contain', width: '100%', height: 'auto' }}
            />
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

        /* Sezione filtri */
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

        .results-count {
          margin-top: 1rem;
          color: #6b7280;
          font-size: 0.875rem;
        }

        /* Griglia galleria */
        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
        }

        /* Box upload */
        .upload-box {
          aspect-ratio: 1;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s;
          position: relative;
          overflow: hidden;
        }

        .upload-box::before {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(255, 255, 255, 0.1);
          transform: translateX(-100%);
          transition: transform 0.6s;
        }

        .upload-box:hover::before {
          transform: translateX(0);
        }

        .upload-box:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(102, 126, 234, 0.4);
        }

        .upload-box.uploading {
          cursor: not-allowed;
          opacity: 0.8;
        }

        .upload-content {
          text-align: center;
          color: white;
          z-index: 1;
          position: relative;
        }

        .upload-icon {
          width: 3rem;
          height: 3rem;
          margin: 0 auto 1rem;
          stroke-width: 1.5;
        }

        .upload-text {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .upload-subtext {
          font-size: 0.875rem;
          opacity: 0.9;
        }

        .upload-spinner {
          width: 3rem;
          height: 3rem;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
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

        .modal-image {
          display: block;
          max-height: 80vh;
          width: auto;
          height: auto;
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