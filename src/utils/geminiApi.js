import { GoogleGenAI } from '@google/genai';

// Note: In a production app, the API key should be kept securely on a backend server.
const ai = new GoogleGenAI({ apiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY || 'dummy_key' });

export async function generateWorkout(goal) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: `Generate a short workout plan for the goal: ${goal}. Format it simply.`,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating workout:", error);
    return "Error generating workout.";
  }
}
