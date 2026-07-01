import { CONFIG } from "../utils/constants";
import { callWithRetry } from "../utils/helpers";
import { GoogleGenAI } from "@google/genai";

export class JudgeApp {
  private googleGenAIClient: GoogleGenAI;

  constructor() {
    this.googleGenAIClient = new GoogleGenAI({
      apiKey: CONFIG.geminiApiKey,
    })
  };

  getJudgeResponse = async (judgePromt: string) => {
    const judgeResponse = await callWithRetry(() =>
      this.googleGenAIClient.models.generateContent({
        model: "gemini-3.1-flash-lite", // Judge Model (Smart, heavy reasoning)
        contents: judgePromt,
        config: {
          responseMimeType: "application/json",
        },
      })
    );
    return judgeResponse.text;
  };
};

