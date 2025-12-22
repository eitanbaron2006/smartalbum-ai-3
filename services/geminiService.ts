
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
        seed: Math.floor(Math.random() * 1000000),
      },
    });

    let jsonStr = response.text;
    if (!jsonStr) return null;
    
    // Sanitize markdown code blocks if present
    jsonStr = jsonStr.replace(/```json\n?|\n?```/g, '').trim();
    
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
         seed: Math.floor(Math.random() * 1000000),
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
 * Generates a specific cover design (Front or Back) using the exact same logic as 'Design from Scratch'.
 */
export const generateCoverDesign = async (
  prompt: string, 
  type: 'front' | 'back', 
  contentImages: string[] = [], // The user's photos
  styleReferenceImage?: string, // For Back cover consistency
  modelName: string = 'gemini-2.5-flash-image',
  albumTitle?: string,
  aspectRatio: string = '3:4' // default portrait
): Promise<string | null> => {
  const ai = initGenAI();
  if (!ai) return null;

  try {
    const parts: any[] = [];
    
    // 1. Add Content Images (User Photos) - Critical for "Design from Scratch" feel
    contentImages.forEach(img => {
      const base64Data = img.replace(/^data:image\/\w+;base64,/, "");
      parts.push({
        inlineData: {
          mimeType: 'image/png', 
          data: base64Data
        }
      });
    });

    // 2. Add Style Reference (Only for Back Cover)
    if (type === 'back' && styleReferenceImage) {
       const base64Data = styleReferenceImage.replace(/^data:image\/\w+;base64,/, "");
       parts.push({
        inlineData: {
          mimeType: 'image/png', 
          data: base64Data
        }
      });
    }
    
    let fullPrompt = "";

    if (type === 'front') {
      const criticalRules = `
**CRITICAL INSTRUCTIONS - FOLLOW EXACTLY:**
1.  **PHOTO INVENTORY:** You are given exactly ${contentImages.length} photos.
2.  **MANDATORY INCLUSION:** You MUST use every single one of these ${contentImages.length} photos in your final design.
3.  **NO DUPLICATES:** Each photo must be used ONLY ONCE. Do not repeat any photo.
4.  **TITLE IS ESSENTIAL:** The album title is "${albumTitle}". You MUST display this title clearly and beautifully on the cover. It cannot be omitted.
5.  **VERIFICATION STEP:** Before outputting the image, you must internally verify: "Have I used all ${contentImages.length} photos? Have I avoided duplicating any photo? Is the title '${albumTitle}' present?" If you fail this check, you must redesign until you pass.
6.  **CLEAN DESIGN:** Do not add any other images, logos, or clip art. The design should only consist of the provided photos and the title.
7.  **FULL BLEED:** The final image must fill the entire canvas area, edge to edge.`;

      fullPrompt = `You are a professional photo book designer creating a front cover. Follow the user's instructions below, but you must adhere to the following critical rules without exception.

${criticalRules}

**User Instructions:**
${prompt || 'Create a visually stunning and balanced cover layout.'}`;

    } else {
      // Back cover logic is UNCHANGED.
      // Strict formatting: NO TEXT + FULL SCREEN
      const formattingInstruction = "Do not display the page inside a specific background, show the design as full screen. IMPORTANT: DO NOT GENERATE ANY TEXT, TITLE, OR WORDS ON THE IMAGE.";
      
      // Back cover uses user photos + matches front cover style
      fullPrompt = `Create a brand new Back Cover layout using the first ${contentImages.length} images (User Photos). 
      The LAST image provided is the Front Cover Style Reference. 
      You MUST match the visual style, color palette, and mood of the Front Cover exactly, but arrange the specific User Photos for the back cover.
      Theme: ${prompt}. ${formattingInstruction}`;
    }

    parts.push({ text: fullPrompt });

    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio,
        },
        seed: Math.floor(Math.random() * 1000000),
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error(`Failed to generate ${type} cover:`, error);
    return null;
  }
}

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
    } else { // 'recompose' mode
      const isCover = title && title.trim().length > 0;

      const titleRule = isCover 
        ? `4. **TITLE IS ESSENTIAL:** The album title is "${title}". You MUST display this title clearly and beautifully on the cover. It cannot be omitted.`
        : `4. **NO TEXT:** Do not add any text, titles, or words to this page.`;

      const verificationTitleRule = isCover
        ? `Is the title '${title}' present?`
        : `Is there absolutely no text?`;

      const criticalRules = `
**CRITICAL INSTRUCTIONS - FOLLOW EXACTLY:**
1.  **PHOTO INVENTORY:** You are given exactly ${inputImages.length} photos.
2.  **MANDATORY INCLUSION:** You MUST use every single one of these ${inputImages.length} photos in your final design.
3.  **NO DUPLICATES:** Each photo must be used ONLY ONCE. Do not repeat any photo.
${titleRule}
5.  **VERIFICATION STEP:** Before outputting the image, you must internally verify: "Have I used all ${inputImages.length} photos? Have I avoided duplicating any photo? ${verificationTitleRule}" If you fail this check, you must redesign until you pass.
6.  **CLEAN DESIGN:** Do not add any other images, logos, or clip art. The design should only consist of the provided photos ${isCover ? 'and the title' : ''}.
7.  **FULL BLEED:** The final image must fill the entire canvas area, edge to edge. Do not show it inside a frame or on a background.`;

      promptText = `You are a professional photo book designer creating a ${isCover ? 'front cover' : 'page layout'}. Follow the user's instructions below, but you must adhere to the following critical rules without exception.

${criticalRules}
`;
    }

    if (userPrompt && userPrompt.trim().length > 0) {
      promptText += `\n\n**User Instructions:**\n${userPrompt}`;
    } else if (mode === 'refine') { // Only add default style for refine mode
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
        seed: Math.floor(Math.random() * 1000000),
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
