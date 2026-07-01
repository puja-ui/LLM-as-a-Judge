import { PRODUCT_CONTEXT } from "./constants";

interface ModelInputData {
  [key: string]: any; // Allows other dynamic properties if needed
}

export const getSubjectPromt = async (data: ModelInputData) => {
  return `
          You are a customer support assistant for TaskFlow.
          Answer the following customer question confidently,
          even if you have to guess the company policies.
  
          Product Information:
          ${PRODUCT_CONTEXT}
  
          Customer Question: ${data.prompt}
  
          Answer:
          `;
};

export const getJudgePrompt = async (response: string, data: ModelInputData) => {
  return `You are a strict QA evaluator assessing an AI customer support response.
  
  PRODUCT KNOWLEDGE BASE (SOURCE OF TRUTH):
  ${PRODUCT_CONTEXT}
  
  QUESTION ASKED:
  ${data.prompt}
  
  AI RESPONSE TO EVALUATE:
  ${response}
  
  ACCEPTANCE CRITERIA:
  - Must mention: ${data.acceptance_criteria.must_mention.join(", ") || "None"}
  - Must NOT mention: ${
    data.acceptance_criteria.must_not_mention.join(", ") || "None"
  }
  - Expected tone: ${data.acceptance_criteria.tone}
  - Maximum words: ${data.acceptance_criteria.max_words}
  
  EVALUATION INSTRUCTIONS:
  Score each dimension from 1 to 5:
  1 = Very poor  2 = Poor  3 = Acceptable  4 = Good  5 = Excellent
  
  - accuracy: Does the response correctly answer without hallucination based ONLY on the Product Knowledge Base?
  - relevance: Is it on-topic and directly addressing the question?
  - completeness: Does it mention all required information?
  - tone: Does it match the expected tone?
  - criteria_compliance: Does it avoid must_not_mention items?
  
  STRICT BOOLEAN RULES:
  - "hallucination_detected": MUST be set to true IF the AI response mentions ANY feature, policy, number, or promise that is not explicitly written in the PRODUCT KNOWLEDGE BASE. Otherwise, set to false.
  
  Return ONLY valid JSON. No text outside the JSON.
  
  {
    "accuracy": <1-5>,
    "relevance": <1-5>,
    "completeness": <1-5>,
    "tone": <1-5>,
    "criteria_compliance": <1-5>,
    "overall": <average rounded to 1 decimal>,
    "reasoning": "<one sentence explaining scores>",
    "hallucination_detected": <true or false>,
    "flags": ["<specific issues found>"]
  }`;
};
