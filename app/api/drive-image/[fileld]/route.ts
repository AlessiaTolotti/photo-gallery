import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

function getGoogleDriveService() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });

  return google.drive({ version: 'v3', auth });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params;
    
    console.log(`📸 Scaricando immagine Drive: ${fileId}`);
    
    const drive = getGoogleDriveService();
    
    // Scarica l'immagine da Google Drive
    const response = await drive.files.get({
      fileId,
      alt: 'media', // Importante: scarica i dati binari
    }, {
      responseType: 'stream' // Ritorna uno stream
    });

    // Ottieni il tipo MIME del file
    const fileInfo = await drive.files.get({
      fileId,
      fields: 'mimeType, name'
    });

    const mimeType = fileInfo.data.mimeType || 'image/jpeg';
    
    // Leggi lo stream e convertilo in buffer
    const chunks: Uint8Array[] = [];
    const stream = response.data;
    
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    
    const buffer = Buffer.concat(chunks);
    
    console.log(`✅ Immagine scaricata: ${buffer.length} bytes`);

    // Ritorna l'immagine con i giusti headers
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=86400', // Cache per 24 ore
        'Content-Length': buffer.length.toString(),
      },
    });

  } catch (err) {
    console.error('❌ Errore download immagine Drive:', err);
    
    // In caso di errore, ritorna un'immagine placeholder
    const placeholderSvg = `
      <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <text x="50%" y="50%" text-anchor="middle" dy="0.3em" font-family="Arial" font-size="16" fill="#6b7280">
          Immagine non disponibile
        </text>
      </svg>
    `;
    
    return new NextResponse(placeholderSvg, {
      headers: {
        'Content-Type': 'image/svg+xml',
      },
      status: 404,
    });
  }
}