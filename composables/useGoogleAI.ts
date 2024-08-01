// composables/useGoogleAI.ts

import { GoogleGenerativeAI, GenerativeModel} from "@google/generative-ai";
import type { GenerateContentResult } from "@google/generative-ai";

export const useGoogleAI = () => {
  const config = useRuntimeConfig();
  const API_KEY = config.public.googleAiApiKey;

  const genAI = new GoogleGenerativeAI(API_KEY);
  const model: GenerativeModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const generateContent = async (prompt: string): Promise<string> => {
    try {
      const result: GenerateContentResult = await model.generateContent(prompt);
      const response = await result.response;
      
      if (!response.candidates || response.candidates.length === 0) {
        throw new Error('No candidates in the response');
      }

      const generatedText = response.candidates[0]?.content?.parts?.[0]?.text;
      
      if (typeof generatedText !== 'string') {
        throw new Error('Unexpected response format');
      }

      console.log(generatedText);
      return generatedText;
    } catch (error) {
      console.error("Error generating content:", error);
      throw error;
    }
  };

  return {
    generateContent,
  };
};