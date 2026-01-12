import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || ''; // Ensure this is available in your env

let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

export const getAIAnalysis = async (prompt: string, context?: string): Promise<string> => {
  if (!ai) {
    console.warn("Gemini API Key not found. Returning mock response.");
    return "AI Assistant unavailable. Please configure your API_KEY.";
  }

  try {
    const model = 'gemini-3-flash-preview';
    const fullPrompt = context 
      ? `Context: ${context}\n\nTask: ${prompt}`
      : prompt;

    const response = await ai.models.generateContent({
      model: model,
      contents: fullPrompt,
    });

    return response.text || "No response generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating analysis. Please try again.";
  }
};

export const generateMaintenanceChecklist = async (assetName: string, issue: string) => {
  return getAIAnalysis(
    `Generate a concise, step-by-step safety and repair checklist for a technician fixing the following issue: "${issue}" on a "${assetName}". Format as a markdown list.`,
    "You are an expert construction equipment maintenance supervisor."
  );
};
