
import { 
  GoogleGenAI, 
  Chat, 
  GenerateContentResponse
} from "@google/genai";
import { MenuItem } from "../types";
import { getBotSettings } from "./menuRepository";

// Helper to get AI instance - handles dynamic key injection for paid features
const getAI = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/**
 * Chatbot Service (WhatsApp simulation)
 * Uses gemini-3-pro-preview for high quality reasoning over the menu
 */
let chatSession: Chat | null = null;

export const initChatSession = (menu: MenuItem[]) => {
  const ai = getAI();
  const botSettings = getBotSettings();
  
  // 1. Prepare Menu Context
  // We simplify the JSON to only what's necessary for the LLM to minimize tokens and confusion
  const menuContext = menu.map(m => ({ 
    id: m.id,
    name: m.name, 
    price: m.price, 
    category: m.category,
    available: m.available ? "In Stock" : "Sold Out"
  }));
  const menuStr = JSON.stringify(menuContext, null, 2);
  
  // 2. Construct the System Instruction (The Brain)
  const systemInstruction = `${botSettings.systemInstruction}
    
    *** DUAL CHANNEL WAITER PROTOCOL (Web & WhatsApp) ***
    You are Stanley, the digital waiter for Stanley's Restaurant. 
    You serve customers on our website chat AND help them switch to WhatsApp if they prefer.

    *** YOUR GOAL ***
    Take their order efficiently, just like a professional waiter.

    *** DATA COLLECTION (Mandatory for Orders) ***
    If the user wants to order, you must collect:
    1. Food Items (Be specific on quantity)
    2. Name
    3. Phone Number (Ask for Country Code)
    4. Delivery Address
    5. Payment Method ('Cash', 'Card', 'Online Link')

    *** STYLE ***
    - Short, punchy messages (WhatsApp style).
    - Use emojis 🍔 🥗.
    - If an item is "Sold Out", apologize and suggest a similar available item.
    - If they want to "switch to WhatsApp", encourage them to click the WhatsApp button in the header.

    *** MENU KNOWLEDGE ***
    ${menuStr}
  `;
  
  chatSession = ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: systemInstruction,
      temperature: botSettings.temperature,
    }
  });
};

export const sendMessageToBot = async (message: string): Promise<string> => {
  if (!chatSession) throw new Error("Chat not initialized");
  
  try {
      const response = await chatSession.sendMessage({ message });
      return response.text || "I'm having a little trouble reading the menu right now. Can you say that again?";
  } catch (error) {
      console.error("Chat Error:", error);
      // Graceful Fallback
      return "Oops! My connection to the kitchen is a bit spotty. Could you try refreshing or stating your order again simply?";
  }
};

/**
 * NLP Order Parsing
 * Uses gemini-2.5-flash to extract structured order data from chat text
 */
export const parseOrderFromChat = async (conversationHistory: string, menu: MenuItem[]) => {
    const ai = getAI();
    const menuContext = menu.map(m => `${m.id}: ${m.name} ($${m.price})`).join('\n');
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Given the menu and conversation, extract the final order details.
        
        Menu:
        ${menuContext}

        Conversation:
        ${conversationHistory}

        Return a JSON object with:
        - items: array of { id, quantity, name, price } (Match exact menu items)
        - customerName: string (or null if not found)
        - deliveryAddress: string (or null if not found)
        - phoneNumber: string (Try to ensure it has a country code, or null if not found)
        - paymentMethod: "cash" | "card" | "online_link" | null
        
        If no clear order is present, return items as empty array.`,
        config: {
            responseMimeType: "application/json"
        }
    });

    return JSON.parse(response.text);
};

/**
 * Menu Description Generation
 * Uses gemini-2.5-flash for fast creative writing
 */
export const generateMenuDescription = async (name: string, category: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `You are a gourmet food copywriter. Write a short, mouth-watering, and sophisticated description (max 20 words) for a menu item.
    
    Item Name: ${name}
    Category: ${category}
    
    Description:`,
  });
  return response.text.trim();
};

/**
 * Image Analysis (Admin/Marketing)
 * Uses gemini-3-pro-preview
 */
export const analyzeFoodImage = async (base64Image: string, mimeType: string, prompt: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType } },
        { text: prompt }
      ]
    }
  });
  return response.text;
};

/**
 * Search Grounding (Market Research)
 * Uses gemini-2.5-flash with googleSearch
 */
export const searchFoodTrends = async (query: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: query,
    config: {
      tools: [{ googleSearch: {} }]
    }
  });
  
  const text = response.text;
  const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((c: any) => c.web?.uri).filter(Boolean) || [];
  
  return { text, sources };
};

/**
 * Maps Grounding (Location Info)
 * Uses gemini-2.5-flash with googleMaps
 */
export const findNearbySuppliers = async (query: string, lat: number, lng: number) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: query,
    config: {
      tools: [{ googleMaps: {} }],
      toolConfig: {
        retrievalConfig: {
          latLng: { latitude: lat, longitude: lng }
        }
      }
    }
  });
  return response.text; // Usually contains markdown with map links
};

/**
 * Image Generation (Nano Banana Pro)
 * Uses gemini-3-pro-image-preview
 * Requires User API Key selection
 */
export const generateMarketingImage = async (prompt: string, size: '1K' | '2K' | '4K', aspectRatio: string) => {
  // Ensure fresh key for paid feature
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY }); 
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: { parts: [{ text: prompt }] },
    config: {
      imageConfig: {
        imageSize: size,
        aspectRatio: aspectRatio
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};

/**
 * Logo Generation
 * Uses gemini-3-pro-image-preview for high quality vector logos
 */
export const generateRestaurantLogo = async (brandName: string, style: string) => {
  // Ensure fresh key for paid feature
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Design a high-quality, professional vector logo for a restaurant named "${brandName}". 
  Style: ${style}. 
  The logo should be versatile, suitable for a website header and social media profile. 
  Use a clean, solid background. 
  Focus on food, dining, or abstract culinary shapes. 
  Ensure text is legible if included.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: { parts: [{ text: prompt }] },
    config: {
      imageConfig: {
        imageSize: '1K',
        aspectRatio: '1:1'
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};


/**
 * Image Editing (Nano Banana)
 * Uses gemini-2.5-flash-image
 */
export const editFoodImage = async (base64Image: string, mimeType: string, prompt: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType } },
        { text: prompt }
      ]
    }
  });
  
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};

/**
 * Video Generation (Veo)
 * Uses veo-3.1-fast-generate-preview
 * Requires User API Key selection
 */
export const generateFoodVideo = async (prompt: string, aspectRatio: '16:9' | '9:16', imageBase64?: string, mimeType?: string) => {
   // Ensure fresh key for paid feature
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  let operation;
  
  if (imageBase64 && mimeType) {
    operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      image: {
        imageBytes: imageBase64,
        mimeType: mimeType
      },
      prompt: prompt, 
      config: {
        numberOfVideos: 1,
        resolution: '720p', // Fast model limit usually
        aspectRatio: aspectRatio
      }
    });
  } else {
    operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: aspectRatio
      }
    });
  }

  // Polling
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    operation = await ai.operations.getVideosOperation({ operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) throw new Error("Video generation failed");

  // Fetch with key
  const res = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  const blob = await res.blob();
  return URL.createObjectURL(blob);
};


/**
 * Audio Utils for Live API
 */
export const pcmToWav = (pcmData: Int16Array, sampleRate: number) => {
    const buffer = new ArrayBuffer(44 + pcmData.length * 2);
    const view = new DataView(buffer);
  
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
  
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + pcmData.length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, pcmData.length * 2, true);
  
    for (let i = 0; i < pcmData.length; i++) {
      view.setInt16(44 + i * 2, pcmData[i], true);
    }
  
    return new Blob([view], { type: 'audio/wav' });
  };
  
  // Decoding Helper
  export async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  }
  
  // Encoding Helper
  export function encodeAudio(bytes: Uint8Array) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
