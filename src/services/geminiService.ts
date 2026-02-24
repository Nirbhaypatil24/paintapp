import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.GEMINI_API_KEY;

/**
 * Resizes a base64 image to a maximum dimension while maintaining aspect ratio.
 * This is critical for mobile performance and staying within Gemini API payload limits.
 */
async function resizeImage(base64Str: string, maxDimension: number = 1024): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxDimension) {
          height *= maxDimension / width;
          width = maxDimension;
        }
      } else {
        if (height > maxDimension) {
          width *= maxDimension / height;
          height = maxDimension;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
  });
}

export async function transformToWatercolor(base64Image: string): Promise<string> {
  if (!API_KEY) {
    throw new Error("Gemini API Key is missing. Please configure it in the Secrets panel.");
  }

  // Optimize image for AI processing
  const optimizedImage = await resizeImage(base64Image);
  const imageData = optimizedImage.split(',')[1];

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          {
            inlineData: {
              data: imageData,
              mimeType: "image/jpeg",
            },
          },
          {
            text: "Transform this photo into a museum-quality watercolor painting. Use professional techniques: wet-on-wet blending, visible paper texture (cold press), delicate pencil under-sketching, and vibrant pigment bleeds. Maintain the exact composition and lighting of the original photo. The final result must look like a physical painting on high-quality 300gsm watercolor paper.",
          },
        ],
      },
    });

    let transformedUrl = "";
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        transformedUrl = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!transformedUrl) {
      throw new Error("The artist encountered an error. Please try another shot.");
    }

    return transformedUrl;
  } catch (error: any) {
    console.error("Watercolor transformation error:", error);
    if (error.message?.includes("Safety")) {
      throw new Error("This image couldn't be processed due to safety guidelines.");
    }
    throw new Error("Network error. Please check your connection and try again.");
  }
}
