import sys
import os
import base64
from io import BytesIO
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

def main():
    if len(sys.argv) < 3:
        print("Usage: python generate_poster_pdf.py <input_base64_or_png_file> <output_pdf_file>")
        sys.exit(1)

    input_path = sys.argv[1]
    output_pdf = sys.argv[2]

    # Read image
    if input_path.endswith('.png') or input_path.endswith('.jpg'):
        with open(input_path, 'rb') as f:
            img_bytes = f.read()
    else:
        # File containing raw base64 string
        with open(input_path, 'r', encoding='utf-8') as f:
            b64_str = f.read().strip()
            if ',' in b64_str:
                b64_str = b64_str.split(',', 1)[1]
            img_bytes = base64.b64decode(b64_str)

    img_reader = ImageReader(BytesIO(img_bytes))
    img_w, img_h = img_reader.getSize()

    # Landscape A4 size: 841.89 x 595.27 pt
    page_w, page_h = landscape(A4)

    # Budget margins: 18 pt (0.25 in)
    margin = 18.0
    usable_w = page_w - (2 * margin)
    usable_h = page_h - (2 * margin)

    # Calculate scale to fit nicely on A4 landscape while preserving aspect ratio
    aspect = float(img_w) / float(img_h)
    
    draw_w = usable_w
    draw_h = draw_w / aspect

    if draw_h > usable_h:
        draw_h = usable_h
        draw_w = draw_h * aspect

    # Center on page
    x = margin + (usable_w - draw_w) / 2.0
    y = margin + (usable_h - draw_h) / 2.0

    c = canvas.Canvas(output_pdf, pagesize=landscape(A4))
    c.setTitle("AI Academy - Students of the Month Poster")
    c.setAuthor("AI Integrated Academy Argungu")
    c.setSubject("Official Student Awards Plaque")

    # Dark background fill behind the poster margins for a sleek frame presentation
    c.setFillColor(colors.HexColor("#060e1a"))
    c.rect(0, 0, page_w, page_h, fill=1, stroke=0)

    # Draw the high-resolution poster image
    c.drawImage(img_reader, x, y, width=draw_w, height=draw_h)

    c.showPage()
    c.save()
    print("SUCCESS")

if __name__ == '__main__':
    main()
