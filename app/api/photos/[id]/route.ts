import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
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