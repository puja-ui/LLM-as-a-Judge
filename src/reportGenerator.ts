import * as fs from 'fs/promises'
import * as path from 'path'

export type TestResult = {
  id: string
  category: string
  prompt: string
  subjectResponse: string
  scores: {
    accuracy: number
    relevance: number
    completeness: number
    tone: number
    criteria_compliance: number
    overall: number
    reasoning: string
    hallucination_detected: boolean
    flags: string[]
  }
  passed: boolean
}

export async function generateHTMLReport(
  results: TestResult[],
  outputDir: string = './reports'
): Promise<string> {
  await fs.mkdir(outputDir, { recursive: true })

  const total = results.length
  const passed = results.filter(r => r.passed).length
  const failed = total - passed
  const hallucinations = results.filter(r => r.scores.hallucination_detected).length
  const avgScore = (
    results.reduce((sum, r) => sum + r.scores.overall, 0) / total
  ).toFixed(1)

  const passRate = Math.round((passed / total) * 100)

  const scoreColor = (score: number) => {
    if (score >= 4) return '#0F6E56'
    if (score >= 3) return '#854F0B'
    return '#A32D2D'
  }

  const scoreBg = (score: number) => {
    if (score >= 4) return '#E1F5EE'
    if (score >= 3) return '#FAEEDA'
    return '#FCEBEB'
  }

  const testCards = results.map(result => {
    const s = result.scores
    const statusColor = result.passed ? '#0F6E56' : '#A32D2D'
    const statusBg = result.passed ? '#E1F5EE' : '#FCEBEB'
    const statusText = result.passed ? '✓ passed' : '✗ failed'
    const borderColor = result.passed ? '#E1F5EE' : '#F7C1C1'

    const hallBanner = s.hallucination_detected ? `
      <div style="display:flex;align-items:center;gap:6px;font-size:12px;
                  color:#A32D2D;background:#FCEBEB;border-radius:6px;
                  padding:6px 10px;margin-bottom:10px;">
        ⚠ Hallucination detected — ${s.flags[0] || 'unverified claim in response'}
      </div>` : ''

    const dimChip = (label: string, score: number) => `
      <div style="display:flex;flex-direction:column;align-items:center;
                  background:#F1EFE8;border-radius:6px;padding:6px 10px;min-width:70px;">
        <span style="font-size:10px;color:#888780;margin-bottom:2px;">${label}</span>
        <span style="font-size:15px;font-weight:500;color:${scoreColor(score)}">${score}</span>
      </div>`

    return `
    <div style="background:white;border:0.5px solid ${borderColor};
                border-radius:12px;padding:1rem 1.25rem;margin-bottom:10px;">
      <div style="display:flex;align-items:flex-start;
                  justify-content:space-between;margin-bottom:10px;gap:12px;">
        <div>
          <p style="font-size:11px;font-weight:500;color:#888780;margin:0 0 2px;">
            ${result.id} · ${result.category}
          </p>
          <p style="font-size:14px;font-weight:500;color:#2C2C2A;margin:0;">
            ${result.prompt}
          </p>
        </div>
        <span style="font-size:11px;font-weight:500;padding:3px 10px;
                     border-radius:20px;white-space:nowrap;flex-shrink:0;
                     background:${statusBg};color:${statusColor};">
          ${statusText}
        </span>
      </div>
      ${hallBanner}
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;">
        ${dimChip('accuracy', s.accuracy)}
        ${dimChip('relevance', s.relevance)}
        ${dimChip('completeness', s.completeness)}
        ${dimChip('tone', s.tone)}
        ${dimChip('compliance', s.criteria_compliance)}
        <div style="display:flex;flex-direction:column;align-items:center;
                    border:0.5px solid #D3D1C7;border-radius:6px;
                    padding:6px 10px;min-width:70px;">
          <span style="font-size:10px;color:#888780;margin-bottom:2px;">overall</span>
          <span style="font-size:15px;font-weight:500;
                       color:${scoreColor(s.overall)}">${s.overall}</span>
        </div>
      </div>
      <p style="font-size:12px;color:#5F5E5A;line-height:1.6;margin:0;
                padding:8px 12px;background:#F1EFE8;border-radius:6px;
                border-left:2px solid #D3D1C7;">
        ${s.reasoning}
      </p>
    </div>`
  }).join('')

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LLM Judge Report — TaskFlow</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
           background: #F1EFE8; padding: 2rem 1rem; min-height: 100vh; }
    .container { max-width: 760px; margin: 0 auto; }
    .card { background: white; border-radius: 12px; 
            border: 0.5px solid #D3D1C7; padding: 1.5rem; margin-bottom: 1rem; }
    .bar-track { flex: 1; height: 6px; background: #F1EFE8; 
                 border-radius: 3px; overflow: hidden; }
  </style>
</head>
<body>
<div class="container">

  <div class="card">
    <h1 style="font-size:20px;font-weight:500;color:#2C2C2A;margin:0 0 4px;">
      LLM quality evaluation report
    </h1>
    <p style="font-size:13px;color:#5F5E5A;margin:0 0 12px;">
      TaskFlow customer support bot · subject: openai/gpt-oss-120b (via OpenRouter) · 
      judge: Gemini 1.5 Flash
    </p>
    <div style="display:flex;gap:1rem;flex-wrap:wrap;font-size:12px;color:#888780;">
      <span>📅 ${new Date().toLocaleDateString('en-IN', { 
        day: 'numeric', month: 'long', year: 'numeric' 
      })}</span>
      <span>🧪 ${total} test cases</span>
      <span>⏱ ${new Date().toLocaleTimeString('en-IN')}</span>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));
              gap:12px;margin-bottom:1rem;">
    <div class="card" style="padding:1rem;">
      <p style="font-size:12px;color:#5F5E5A;margin:0 0 4px;">Overall result</p>
      <p style="font-size:24px;font-weight:500;color:${passed === total ? '#0F6E56' : '#854F0B'};margin:0;">
        ${passed} / ${total}
      </p>
      <p style="font-size:11px;color:#888780;margin:2px 0 0;">tests passed</p>
    </div>
    <div class="card" style="padding:1rem;">
      <p style="font-size:12px;color:#5F5E5A;margin:0 0 4px;">Pass rate</p>
      <p style="font-size:24px;font-weight:500;color:${passRate >= 80 ? '#0F6E56' : '#854F0B'};margin:0;">
        ${passRate}%
      </p>
      <p style="font-size:11px;color:#888780;margin:2px 0 0;">threshold: 60%</p>
    </div>
    <div class="card" style="padding:1rem;">
      <p style="font-size:12px;color:#5F5E5A;margin:0 0 4px;">Avg quality score</p>
      <p style="font-size:24px;font-weight:500;color:#0F6E56;margin:0;">${avgScore} / 5</p>
      <p style="font-size:11px;color:#888780;margin:2px 0 0;">across all dimensions</p>
    </div>
    <div class="card" style="padding:1rem;">
      <p style="font-size:12px;color:#5F5E5A;margin:0 0 4px;">Hallucinations</p>
      <p style="font-size:24px;font-weight:500;color:${hallucinations > 0 ? '#A32D2D' : '#0F6E56'};margin:0;">
        ${hallucinations}
      </p>
      <p style="font-size:11px;color:#888780;margin:2px 0 0;">detected and flagged</p>
    </div>
  </div>

  <div class="card" style="margin-bottom:1rem;">
    <p style="font-size:11px;font-weight:500;color:#888780;text-transform:uppercase;
              letter-spacing:0.05em;margin:0 0 12px;">Score breakdown by dimension</p>
    ${['accuracy', 'relevance', 'completeness', 'tone', 'criteria_compliance'].map(dim => {
      const avg = results.reduce((s, r) => s + (r.scores as any)[dim], 0) / total
      const pct = (avg / 5) * 100
      const color = avg >= 4 ? '#1D9E75' : avg >= 3 ? '#BA7517' : '#E24B4A'
      return `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <span style="font-size:12px;color:#5F5E5A;width:130px;flex-shrink:0;">
          ${dim.replace('_', ' ')}
        </span>
        <div class="bar-track">
          <div style="width:${pct}%;height:100%;background:${color};border-radius:3px;"></div>
        </div>
        <span style="font-size:12px;font-weight:500;color:#2C2C2A;width:28px;text-align:right;">
          ${avg.toFixed(1)}
        </span>
      </div>`
    }).join('')}
  </div>

  <p style="font-size:11px;font-weight:500;color:#888780;text-transform:uppercase;
            letter-spacing:0.05em;margin:0 0 0.75rem;">Test case results</p>

  ${testCards}

  <div class="card">
    <p style="font-size:13px;font-weight:500;color:#2C2C2A;margin:0 0 8px;">
      What this means in plain English
    </p>
    <p style="font-size:13px;color:#5F5E5A;line-height:1.7;margin:0 0 8px;">
      The AI answered ${passed} out of ${total} questions at an acceptable quality level. 
      ${hallucinations} response${hallucinations !== 1 ? 's' : ''} contained hallucinated 
      information — claims not present in the product knowledge base — which were correctly 
      detected and flagged by the judge model.
    </p>
  </div>

</div>
</body>
</html>`

  const filename = `report_${Date.now()}.html`
  const filepath = path.join(outputDir, filename)
  await fs.writeFile(filepath, html)
  return filepath
}