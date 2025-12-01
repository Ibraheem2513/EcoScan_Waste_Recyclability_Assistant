import { GoogleGenAI, Type } from "@google/genai";
import { WasteAnalysis, RecyclingPlace } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = "gemini-2.5-flash";
const IMAGE_MODEL_NAME = "gemini-2.5-flash-image";

const SYSTEM_INSTRUCTION = `
You are an expert environmentalist and recycling guide. 
Your goal is to analyze images of waste items and determine if they are recyclable.
Provide clear, actionable instructions on how to prepare the item for recycling or disposal.
Crucially, provide creative DIY or upcycling ideas on how the user can reuse this item at home instead of throwing it away.
For the creative ideas, provide a short title and a one-sentence description for each.
Be concise but informative.
`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    itemName: {
      type: Type.STRING,
      description: "A short, descriptive name of the item identified in the image.",
    },
    status: {
      type: Type.STRING,
      enum: ["YES", "NO", "MAYBE", "UNKNOWN"],
      description: "Recyclability status. YES for recyclable, NO for trash, MAYBE for special handling/check local rules.",
    },
    category: {
      type: Type.STRING,
      description: "The material category (e.g., Plastic #1, Cardboard, E-Waste, Organic).",
    },
    explanation: {
      type: Type.STRING,
      description: "A brief explanation of why it is or isn't recyclable.",
    },
    instructions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Step-by-step instructions (e.g., 'Rinse thoroughly', 'Remove cap', 'Flatten').",
    },
    alternatives: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Suggestions for reusable alternatives if applicable.",
    },
    creativeIdeas: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Short catchy title for the DIY project" },
          description: { type: Type.STRING, description: "Brief description of how to reuse the item" }
        },
        required: ["title", "description"]
      },
      description: "List of 3 creative DIY ideas or practical ways to reuse this item.",
    },
    confidenceScore: {
      type: Type.NUMBER,
      description: "Confidence score between 0 and 100.",
    },
  },
  required: ["itemName", "status", "category", "explanation", "instructions", "creativeIdeas", "confidenceScore"],
};

export const analyzeWasteImage = async (base64Image: string, mimeType: string): Promise<WasteAnalysis> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          {
            text: "Analyze this image. What item is this? Is it recyclable? How should I dispose of it correctly? Give me creative ideas to reuse it.",
          },
        ],
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0.5,
      },
    });

    let text = response.text;
    if (!text) {
      throw new Error("No response text received from Gemini.");
    }

    // Sanitize text if it includes markdown code blocks (common with some models)
    text = text.replace(/```json|```/g, '').trim();

    try {
      const data = JSON.parse(text) as WasteAnalysis;
      return data;
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError, "Raw text:", text);
      throw new Error("Failed to parse recycling data. Please try again.");
    }

  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    // Ensure we throw a descriptive string, not an object
    const msg = error instanceof Error ? error.message : "Failed to connect to AI service.";
    throw new Error(msg);
  }
};

export const generateIdeaImage = async (itemName: string, ideaTitle: string, ideaDescription: string): Promise<string | null> => {
  try {
    const prompt = `A realistic, high-quality photo of a DIY project: ${itemName} being reused as ${ideaTitle}. ${ideaDescription}. Bright lighting, clean composition, home decor style.`;
    
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL_NAME,
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        // Nano banana models do not support responseMimeType or tools
      }
    });

    // Iterate through parts to find the image
    if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
       for (const part of response.candidates[0].content.parts) {
         if (part.inlineData && part.inlineData.data) {
           return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
         }
       }
    }
    
    return null;
  } catch (error) {
    console.error("Image Generation Error:", error);
    return null; // Fail silently for image gen to not break the app
  }
};

export const findNearbyRecyclingCenters = async (latitude: number, longitude: number, query: string): Promise<RecyclingPlace[]> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Find nearby locations for: "${query}". Return a list of places.`,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: latitude,
              longitude: longitude
            }
          }
        },
      },
    });

    // Extract grounding chunks from the response
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const places: RecyclingPlace[] = [];

    if (chunks) {
      for (const chunk of chunks) {
        // Check for Maps grounding data
        const mapData = (chunk as any).maps;
        if (mapData && mapData.title && mapData.uri) {
            places.push({
                name: mapData.title,
                uri: mapData.uri,
                // Some versions might provide address in snippet or placeAnswerSources
                address: mapData.placeAnswerSources?.[0]?.formattedAddress
            });
        }
        // Fallback or additional check for standard grounding if provided
        else if ((chunk as any).web?.uri && (chunk as any).web?.title) {
           places.push({
             name: (chunk as any).web.title,
             uri: (chunk as any).web.uri
           });
        }
      }
    }
    
    // Filter duplicates based on URI
    const uniquePlaces = places.filter((place, index, self) => 
        index === self.findIndex((t) => (
            t.uri === place.uri
        ))
    );

    return uniquePlaces;
  } catch (error) {
    console.error("Google Maps Error:", error);
    return [];
  }
};