// api/generate-images.ts

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createCanvas, loadImage, CanvasRenderingContext2D, CanvasTextAlign } from 'canvas';

// --- Type Definitions ---
interface AnimalData {
  lobo: number;
  aguia: number;
  tubarao: number;
  gato: number;
}

interface BrainData {
  pensante: number;
  atuante: number;
  razao: number;
  emocao: number;
}

// --- Image Processing Logic ---

const drawTextWithShadow = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  font: string,
  fillStyle: string,
  textAlign: CanvasTextAlign,
  textBaseline: CanvasTextBaseline
) => {
  ctx.font = font;
  ctx.fillStyle = fillStyle;
  ctx.textAlign = textAlign;
  ctx.textBaseline = textBaseline;

  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  ctx.fillText(text, x, y);

  // Reset shadow for next drawing
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
};

const generateAnimalImage = async (baseImageUrl: string, data: AnimalData): Promise<string> => {
    try {
        const img = await loadImage(baseImageUrl);
        const canvas = createCanvas(img.width, img.height);
        const ctx = canvas.getContext('2d');

        ctx.drawImage(img, 0, 0);

        const animalEntries = Object.entries(data) as [keyof AnimalData, number][];

        let highestAnimalName: keyof AnimalData | null = null;
        let maxPercentage = -1;

        for (const [name, percentage] of animalEntries) {
            if (percentage > maxPercentage) {
                maxPercentage = percentage;
                highestAnimalName = name;
            }
        }

        const fontName = 'sans-serif'; // Use a generic font family available on servers
        const normalFontSize = 36;
        const highestFontSize = 40;
        const normalColor = '#FFFFFF';
        const highestColor = '#FFED00';

        const positions: { [key: string]: { x: number; y: number } } = {
          lobo:    { x: 120, y: 280 },
          aguia:   { x: 420, y: 280 },
          tubarao: { x: 120, y: 630 },
          gato:    { x: 420, y: 630 },
        };

        for (const [name, percentage] of animalEntries) {
          const isHighest = name === highestAnimalName;
          const fontSize = isHighest ? highestFontSize : normalFontSize;
          const color = isHighest ? highestColor : normalColor;
          const font = `bold ${fontSize}px ${fontName}`;
          const text = `${percentage}%`;
          const { x, y } = positions[name as keyof AnimalData];

          drawTextWithShadow(ctx, text, x, y, font, color, 'right', 'middle');
        }

        return canvas.toDataURL('image/png');
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        throw new Error(`Error during animal image processing: ${errorMessage}`);
    }
};

const generateBrainImage = async (baseImageUrl: string, data: BrainData): Promise<string> => {
    try {
        const img = await loadImage(baseImageUrl);
        const canvas = createCanvas(img.width, img.height);
        const ctx = canvas.getContext('2d');
  
        ctx.drawImage(img, 0, 0);
        
        const fontName = 'sans-serif'; // Use a generic font family
        const fontSize = 44;
        const color = '#FFFFFF';
        const font = `bold ${fontSize}px ${fontName}`;

        const positions: { [key: string]: { x: number; y: number; align: CanvasTextAlign } } = {
            pensante: { x: 320, y: 240, align: 'center' },
            atuante:  { x: 320, y: 780, align: 'center' },
            razao:    { x: 48, y: 450, align: 'left'   },
            emocao:   { x: 600, y: 450, align: 'right'  },
        };
  
        const brainEntries = Object.entries(data) as [keyof BrainData, number][];

        for (const [name, percentage] of brainEntries) {
            const pos = positions[name];
            if(pos) {
                drawTextWithShadow(ctx, `${percentage}%`, pos.x, pos.y, font, color, pos.align, 'middle');
            }
        }
  
        return canvas.toDataURL('image/png');
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        throw new Error(`Error during brain image processing: ${errorMessage}`);
    }
};

const BASE_IMAGE_BRAIN_URL = 'https://i.postimg.cc/LXMYjwtX/Inserir-um-t-tulo-6.png';
const BASE_IMAGE_ANIMALS_URL = 'https://i.postimg.cc/0N1sjN2W/Inserir-um-t-tulo-7.png';


// --- Vercel Serverless Function Handler ---

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // We only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { animalData, brainData } = req.body;

    // Basic validation
    if (!animalData || !brainData) {
      return res.status(400).json({ error: 'Request body must contain "animalData" and "brainData" objects.' });
    }
    
    const [animalImage, brainImage] = await Promise.all([
      generateAnimalImage(BASE_IMAGE_ANIMALS_URL, animalData),
      generateBrainImage(BASE_IMAGE_BRAIN_URL, brainData),
    ]);

    res.status(200).json({
      animalImage,
      brainImage,
    });
  } catch (error) {
    console.error('Image generation failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    res.status(500).json({ error: 'Failed to generate images.', details: errorMessage });
  }
}
