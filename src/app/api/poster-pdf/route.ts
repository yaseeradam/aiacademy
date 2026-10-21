import { NextRequest, NextResponse } from 'next/server';
import PDFDocument from 'pdfkit';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageBase64, title } = body;

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return NextResponse.json(
        { error: 'Missing imageBase64 in request body' },
        { status: 400 }
      );
    }

    const cleanB64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    const imgBuffer = Buffer.from(cleanB64, 'base64');

    // Landscape A4: 841.89 x 595.28 pt
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margin: 0,
      info: {
        Title: title || 'AI Academy - Students of the Month',
        Author: 'AI Integrated Academy Argungu',
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    const pageW = doc.page.width;
    const pageH = doc.page.height;

    // Dark sleek background
    doc.rect(0, 0, pageW, pageH).fill('#060e1a');

    // Fit image inside usable bounds with 18pt margins
    const margin = 18;
    const usableW = pageW - 2 * margin;
    const usableH = pageH - 2 * margin;

    doc.image(imgBuffer, margin, margin, {
      fit: [usableW, usableH],
      align: 'center',
      valign: 'center',
    });

    doc.end();

    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    const safeTitle = (title || 'Students_of_the_Month_Poster')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 50);
    const filename = `${safeTitle}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error: any) {
    console.error('Error generating poster PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate poster PDF', details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
