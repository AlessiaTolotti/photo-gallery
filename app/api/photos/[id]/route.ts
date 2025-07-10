import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: { id: string };
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;
    
    // La tua logica per ottenere la foto per ID
    // Esempio:
    return NextResponse.json({
      id,
      message: `Photo ${id} details`
    });
    
  } catch (err) {
    console.error('Errore fetch photo:', err);
    return NextResponse.json(
      { error: 'Failed to fetch photo' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;
    
    // La tua logica per eliminare la foto
    return NextResponse.json({
      message: `Photo ${id} deleted successfully`
    });
    
  } catch (err) {
    console.error('Errore delete photo:', err);
    return NextResponse.json(
      { error: 'Failed to delete photo' },
      { status: 500 }
    );
  }
}