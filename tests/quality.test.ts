import { describe, expect, test } from "vitest";
import tests from "../data/testCases.json";
import { SubjectApp } from "../src/subjectApp";
import { getSubjectPromt, getJudgePrompt } from "../utils/promptBuilder";
import { JudgeApp } from "../src/judge";
import { delay } from "../utils/helpers";
import { generateHTMLReport, TestResult } from "../src/reportGenerator";

import * as fs from "fs/promises";
import * as dotenv from "dotenv";
dotenv.config();

describe("TypeScript Vitest Setup", () => {
  const subjectApp = new SubjectApp();
  const judgeApp = new JudgeApp();

  test("Judge subject model", async () => {
    // collect results during the loop
    const results: TestResult[] = [];
    const outputFile = "./LAAGoutput.txt";
    await fs.writeFile(outputFile, "### LLM-as-a-Judge Test Results\n\n");

    for (const test of tests) {
      console.log(`\n📝 Evaluating Test Case: ${test.id}`);
      const response = await subjectApp.getSubjectResponse(
        await getSubjectPromt(test)
      );
      console.log(`\n💬 Subject Response fetched`);
      await delay(2000);
      const judgeResponse = await judgeApp.getJudgeResponse(
        await getJudgePrompt(response!, test)
      );
      console.log(`\n🧑‍⚖️ Judge Evaluation fetched`);
      const logEntry = `
    Test ID: ${test.id} - ${test.prompt}
    
    **Subject Response:**
    ${response ? response.match(/.{1,200}/g)?.join("\n\t\t") : "no response"}

    **Judge Evaluation:**
    ${judgeResponse.match(/.{1,200}/g).join("\n\t\t")}

    --------------------------------------

    `;

      await fs.appendFile(outputFile, logEntry);

      // inside the loop after judge evaluation:
      results.push({
        id: test.id,
        category: test.category,
        prompt: test.prompt,
        subjectResponse: response!,
        scores: JSON.parse(judgeResponse),
        passed:
          JSON.parse(judgeResponse).overall >= 3 &&
          !JSON.parse(judgeResponse).hallucination_detected,
      });

      console.log(`\n✅ Saved results for ${test.id}. Cooling down...`);

      // INCREASED DELAY: The 'Pro' model only allows ~2 requests per minute on the free tier.
      // Waiting 35 seconds ensures we stay comfortably under that limit!
      await delay(50000);
    }

    // after the loop:
    const reportPath = await generateHTMLReport(results);
    console.log(`\n📊 Report generated: ${reportPath}`);

    console.log("🎉 All evaluations completed successfully!");
  });
}, 90000000);
