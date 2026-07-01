import * as dotenv from 'dotenv'
dotenv.config()

export const CONFIG = {
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  gptOss120Model: 'openai/gpt-oss-120b:free',
  gptOss20Model: 'openai/gpt-oss-20b:free',
  judgeModel: 'gemini-1.5-flash',
  openRouterBaseUrl: 'https://openrouter.ai/api/v1',
//   qualityThreshold: 3,
//   excellenceThreshold: 4,
}

export const PRODUCT_CONTEXT = `
TaskFlow is a project management SaaS tool.
Key features:
- Task creation, assignment, and tracking
- Team collaboration with comments and mentions
- Integrations with Slack, GitHub, and Jira
- Free plan: up to 5 users, 10 projects
- Pro plan: unlimited users and projects at $12/user/month
- 14-day free trial, no credit card required
- 24/7 email support, business hours live chat on Pro plan
- Data stored on AWS with AES-256 encryption
- GDPR compliant
`