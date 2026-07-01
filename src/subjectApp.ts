import { CONFIG } from "../utils/constants";
import OpenAI from "openai";

export class SubjectApp {
  private openRouterClient: OpenAI;

  constructor() {
    this.openRouterClient = new OpenAI({
      baseURL: CONFIG.openRouterBaseUrl,
      apiKey: CONFIG.openaiApiKey,
    });
  };

  async getSubjectResponse(prompt: string) : Promise<string | undefined | null> {
    try {
      // Attempt 1: Primary Model (e.g., OpenAI gpt-3.5-turbo)
      console.log("Attempting generation with Primary Model...");
      
      const response = await this.openRouterClient.chat.completions.create({
        model: CONFIG.gptOss120Model,
        messages: [{ role: "user", content: prompt }],
      });
      
      return response.choices[0]?.message?.content || "";
  
    } catch (error: any) {
      // Check if the error is specifically a Rate Limit (HTTP 429)
      if (error?.status === 429 || error?.response?.status === 429) {
        console.warn("⚠️ Rate limit hit on Primary Model. Falling back to Secondary...");
  
        try {
          // Attempt 2: Secondary Model 
          const response = await this.openRouterClient.chat.completions.create({
            model: CONFIG.gptOss20Model,
            messages: [{ role: "user", content: prompt }],
          });
          
          return response.choices[0]?.message?.content || "";
          
        } catch (fallbackError) {
          // If the fallback also fails, log it and throw
          console.error("❌ Fallback model also failed.");
          throw fallbackError;
        }
      }
  
      // If the primary error was NOT a rate limit (e.g., bad API key, network drop), 
      // throw it immediately so you can debug the real issue.
      throw error;
    }









  //   const subjectResponse = await this.openRouterClient.chat.completions.create({
  //     model: CONFIG.gptOss120Model,
  //     messages: [
  //       {
  //         role: "user",
  //         content: prompt,
  //       },
  //     ],
  //     temperature: 0.7,
  //   });
  //   return subjectResponse.choices[0]?.message?.content;
  };
};

