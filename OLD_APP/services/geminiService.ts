
import { GoogleGenAI, Type } from "@google/genai";
import { GridStyle } from "../types";

const initGenAI = (apiKey?: string) => {
  const key = apiKey || process.env.API_KEY;
  if (!key) {
    console.warn("API_KEY not found");
    return null;
  }
  return new GoogleGenAI({ apiKey: key });
};

/**
 * Asks Gemini to generate a CSS Grid layout for a specific number of photos.
 */
export const generateCreativeLayout = async (numPhotos: number): Promise<GridStyle | null> => {
  const ai = initGenAI();
  if (!ai) return null;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Create a creative, non-uniform CSS Grid layout for a container holding exactly ${numPhotos} photos. 
      The layout should fill a rectangular container. 
      Do not just make a simple row or column. Make some photos span multiple rows or columns if possible (bento box style or collage).
      
      Return a JSON object with:
      - gridTemplateColumns (e.g., '1fr 2fr 1fr')
      - gridTemplateRows (e.g., 'auto auto')
      - gridTemplateAreas (a string suitable for CSS grid-template-areas, e.g. '"img0 img0" "img1 img2"')
      
      Important: Use area names 'img0', 'img1', ... up to 'img${numPhotos - 1}'.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            gridTemplateColumns: { type: Type.STRING },
            gridTemplateRows: { type: Type.STRING },
            gridTemplateAreas: { type: Type.STRING },
          },
          required: ["gridTemplateColumns", "gridTemplateRows", "gridTemplateAreas"],
        },
      },
    });

    const jsonStr = response.text;
    if (!jsonStr) return null;
    
    const data = JSON.parse(jsonStr);
    return {
      gridTemplateColumns: data.gridTemplateColumns,
      gridTemplateRows: data.gridTemplateRows,
      gridTemplateAreas: data.gridTemplateAreas,
      isAiGenerated: true,
    };
  } catch (error) {
    console.error("Failed to generate layout with Gemini:", error);
    return null;
  }
};

/**
 * Generates a seamless background texture using Nano Banana, optionally with a reference image.
 */
export const generateBackgroundTexture = async (prompt: string, referenceImage?: string): Promise<string | null> => {
  const ai = initGenAI();
  if (!ai) return null;

  try {
    const parts: any[] = [];

    // If reference image exists, add it first
    if (referenceImage) {
       const base64Data = referenceImage.replace(/^data:image\/\w+;base64,/, "");
       parts.push({
         inlineData: {
           mimeType: 'image/png',
           data: base64Data
         }
       });
    }

    let refinedPrompt = "";
    if (referenceImage) {
      refinedPrompt = `Generate a high quality, seamless background texture inspired by the style, colors, and patterns of the attached reference image, but specifically following this description: ${prompt}. subtle pattern, wallpaper style, suitable for a photo album background. No text, no people, abstract or material texture only.`;
    } else {
      refinedPrompt = `A high quality, seamless background texture of: ${prompt}. subtle pattern, wallpaper style, suitable for a photo album background. No text, no people, abstract or material texture only.`;
    }

    parts.push({ text: refinedPrompt });
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: parts
      },
      config: {
         // flash-image doesn't support advanced aspect ratios configs usually, but returns square/1:1 by default
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Failed to generate background texture:", error);
    return null;
  }
};

/**
 * Uses Gemini (Flash or Pro) to design a book page/cover.
 * Supports 'refine' (edit existing layout) and 'recompose' (create new layout from raw photos).
 */
export const generateAiPageDesign = async (
  inputImages: string[], // Array of base64 strings. Refine = [screenshot], Recompose = [photo1, photo2...]
  title: string, 
  modelName: string,
  userPrompt?: string,
  mode: 'refine' | 'recompose' = 'refine'
): Promise<string | null> => {
  // We must use the key from process.env.API_KEY which is injected after user selection via window.aistudio
  const ai = initGenAI(); 
  if (!ai) return null;

  try {
    // Construct the parts array (text prompt + images)
    const parts: any[] = [];

    // Add all images to the request
    inputImages.forEach(img => {
      const base64Data = img.replace(/^data:image\/\w+;base64,/, "");
      parts.push({
        inlineData: {
          mimeType: 'image/png', // Assuming PNG/JPEG, Gemini handles standard types
          data: base64Data
        }
      });
    });

    let promptText = "";

    if (mode === 'refine') {
      promptText = `Refine this photo album page. Maintain the general composition and layout structure shown in the image, but enhance the aesthetics, lighting, and style.`;
    } else {
      promptText = `Create a brand new photo album page layout using these ${inputImages.length} specific photos. Arrange them creatively on a single page. You have full creative freedom to crop, resize, and position them to create a balanced and professional design.`;
    }
    
    // Add context
    if (title && title.trim().length > 0) {
      promptText += ` The context is a photo album titled "${title}".`;
    }

    if (userPrompt && userPrompt.trim().length > 0) {
      promptText += `\n\nUSER INSTRUCTIONS: ${userPrompt}\n\nStrictly follow the user instructions.`;
    } else {
      promptText += `\n\nThe style should be cinematic, elegant, and high-resolution. Make it look like a printed high-end photobook.`;
    }

    // Add text part
    parts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: modelName, // 'gemini-2.5-flash-image' or 'gemini-3-pro-image-preview'
      contents: {
        parts: parts
      },
      config: {
        // Image generation specific config if needed
      }
    });

    // Extract image from response
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Failed to generate AI page design with model ${modelName}:`, error);
    return null;
  }
};
