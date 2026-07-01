# LLM-as-a-Judge
Test if your AI is trustworthy 😎

Automated quality evaluation framework for AI-powered customer support applications.

Tests OpenAI OSS models (via OpenRouter) against structured acceptance criteria using Gemini as an independent judge — detecting hallucinations, measuring response quality across five dimensions, and generating a self-contained HTML report after every run.

---

## The problem this solves

AI models deployed in customer-facing roles often fabricate confident-sounding information that isn't in their knowledge base. Traditional unit tests can't catch this — you can't write `expect(response).not.toContainHallucination()`. This framework uses a second, independent AI model to evaluate the first one programmatically, the same way a senior QA engineer would review a junior's work.

---

## Architecture

```
Test Cases (JSON)
      ↓
Subject App — OpenAI OSS model via OpenRouter
(answers customer questions about TaskFlow)
      ↓
LLM Judge — Gemini 1.5 Flash
(evaluates the answer against acceptance criteria)
      ↓
Structured Scores (JSON)
      ↓
HTML Report + Pass / Fail result
```

---

## Why two different model families?

Using Gemini to judge an OpenAI model is a deliberate architectural decision — not a coincidence.

A model evaluating its own outputs shares the same training biases and the same blind spots. If GPT hallucinates a feature confidently, a GPT judge might accept it confidently too. An independent model family produces more objective evaluation scores.

This mirrors how real QA works — you don't ask the developer to review their own code.

---

## What it evaluates

Each response is scored 1–5 across five dimensions:

| Dimension | What it checks |
|---|---|
| Accuracy | Is the response factually correct against the knowledge base? |
| Relevance | Does it directly address the question asked? |
| Completeness | Does it mention everything required by the acceptance criteria? |
| Tone | Does it match the expected tone (friendly, reassuring, professional)? |
| Criteria compliance | Does it avoid mentioning anything explicitly prohibited? |

Additionally, `hallucination_detected` is a strict boolean — set to `true` if the response mentions any feature, policy, number, or promise not explicitly present in the product knowledge base. A hallucination detection immediately fails the test regardless of other scores.

---

## Models

| Role | Model | Provider | Why |
|---|---|---|---|
| Subject (large) | `openai/gpt-oss-120b:free` | OpenRouter | Large OSS model — tests quality ceiling |
| Subject (small) | `openai/gpt-oss-20b:free` | OpenRouter | Smaller OSS model — tests hallucination rate at lower capacity |
| Judge | `gemini-1.5-flash` | Google AI | Independent family, strong reasoning, JSON output |

Running both subject models lets you compare how hallucination rate and response quality change with model size — a genuinely useful finding for teams deciding which model to deploy.

---

## Sample findings

> When prompted to answer questions where the knowledge base has limited information, `gpt-oss-120b` consistently fabricates confident-sounding details — integration setup steps, support timelines, security certifications — that don't exist in the product documentation. The judge correctly detects and flags all of these as hallucinations. `gpt-oss-20b` hallucinates at a similar rate but with less elaborate fabrication. Both models perform well when the knowledge base contains clear, direct answers.

---

## Stack

- **Language:** TypeScript / Node.js, Vitest
- **Subject models:** OpenAI OSS 120B and 20B via OpenRouter (free tier)
- **Judge model:** Gemini 1.5 Flash via Google AI Studio (free tier)
- **Report:** Auto-generated self-contained HTML — no server needed
- **CI:** GitHub Actions on every push to main and manual trigger (workflow_dispatch)

---

## Project structure

```
llm-judge/
├── src/
│   ├── subjectApp.ts          # calls OpenRouter models
│   ├── judge.ts               # calls Gemini for evaluation
│   └── reportGenerator.ts     # generates HTML report
├── utils/
│   ├── promptBuilder.ts       # subject and judge prompts
│   ├── constants.ts           # config, thresholds, product context
│   └── helpers.ts             # retry logic, delay
├── data/
│   └── testCases.json         # prompts + acceptance criteria
├── tests/
│   └── quality.test.ts        # resides all tests
├── reports/                   # auto-generated, gitignored
├── .github/
│   └── workflows/
│       └── llm-judge.yml
├── .env
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## Setup

### Prerequisites

- Node.js 20+
- A free OpenRouter account — [openrouter.ai](https://openrouter.ai)
- A free Google AI Studio account — [aistudio.google.com](https://aistudio.google.com)

### Installation

```bash
git clone https://github.com/yourusername/LLM-as-a-Judge
cd LLM-as-a-Judge
npm install
```

### Environment variables

Create `.env` and fill in your keys:

```
OPENROUTER_API_KEY=your_openrouter_key_here
GEMINI_API_KEY=your_gemini_key_here
```

Both keys are free — no billing required to run this project.

### Run

```bash
npm test
```

The evaluation runs through all test cases sequentially, logs progress to the terminal, and writes a timestamped HTML report to `reports/`.

---

## Adding test cases

Test cases live in `data/testCases.json`. Each entry defines the prompt, what the response must mention, what it must not mention, and the expected tone:

```json
{
  "id": "TC008",
  "category": "pricing",
  "prompt": "Do you offer a discount for nonprofits?",
  "acceptance_criteria": {
    "must_mention": [],
    "must_not_mention": ["yes", "discount", "50%"],
    "tone": "honest and helpful",
    "max_words": 80,
    "note": "No nonprofit discount exists — model should not hallucinate one"
  }
}
```

---

## CI pipeline

The GitHub Actions workflow runs on every push to `main` and also on manual triggers, evaluates all test cases using the cloud models, uploads the HTML report as a build artifact, and fails the build if hallucinations are detected.

To add secrets for CI: **GitHub repo → Settings → Secrets → Actions → New secret**

Add `OPENROUTER_API_KEY` and `GEMINI_API_KEY`.

---

## Key design decisions

**Why OpenRouter instead of direct OpenAI API?**
OpenRouter provides access to multiple open-source models on a single free endpoint without separate API arrangements for each model. It also lets you swap models by changing one string — useful for comparing model behaviour.

**Why separate subject prompt versions?**
The project tests two prompt strategies — one that restricts the model strictly to the knowledge base, and one that encourages confident answering even without grounding. Comparing judge scores across both strategies shows how much hallucination rate changes with prompt design alone.

**Why is hallucination a hard fail?**
In customer-facing AI, a hallucinated feature or policy isn't just a quality issue — it's a trust and legal liability issue. Treating it as an immediate fail regardless of other scores reflects how seriously production teams should treat it.

**Why generate HTML instead of using a tool like MLflow or LangSmith?**
Those tools require accounts, running servers, or paid plans. A self-contained HTML file can be shared by email, opened in any browser, attached to a PR, or hosted on GitHub Pages — zero dependencies.

---

## What's next

- Add performance testing — measure and assert response latency
- Regression mode — compare scores across model versions to detect quality drift
- Extend to RAG evaluation — test retrieval quality alongside generation quality
- Add a `watch` mode that re-runs evaluation when test cases change

## Example report
<img width="2842" height="4746" alt="image" src="https://github.com/user-attachments/assets/66d03b35-f6e8-4f66-8614-e6733ed32e2f" />
