/**
 * Summary Card Export & Sharing Service (T062)
 * Handles exporting 1-page high-density summary cards as formatted text, printable HTML, or native share sheets.
 */
import { Share, Platform } from 'react-native';
import { SummaryCard } from '../types';

export const exportService = {
  /**
   * Formats the summary card into clean, readable Markdown text
   */
  formatAsMarkdown(paperTitle: string, authors: string[] | undefined, card: SummaryCard): string {
    const authorsText = authors && authors.length > 0 ? `By: ${authors.join(', ')}\n` : '';
    let text = `📄 PAPERPOD EXECUTIVE SUMMARY CARD\n`;
    text += `=====================================\n`;
    text += `TITLE: ${paperTitle}\n`;
    if (authorsText) text += `${authorsText}`;
    text += `\n🎯 CORE THESIS:\n${card.core_thesis}\n\n`;

    if (card.quantitative_results && card.quantitative_results.length > 0) {
      text += `📊 QUANTITATIVE BENCHMARKS:\n`;
      text += `-------------------------------------\n`;
      card.quantitative_results.forEach((q, idx) => {
        text += `${idx + 1}. ${q.metric}\n`;
        text += `   • Baseline:     ${q.baseline}\n`;
        text += `   • Paper Result: ${q.paper_result}\n`;
        text += `   • Improvement:  ${q.improvement}\n\n`;
      });
    }

    if (card.limitations && card.limitations.length > 0) {
      text += `⚠️ ACKNOWLEDGED LIMITATIONS:\n`;
      text += `-------------------------------------\n`;
      card.limitations.forEach((lim, idx) => {
        text += `• ${lim}\n`;
      });
      text += `\n`;
    }

    if (card.future_work && card.future_work.length > 0) {
      text += `🔮 FUTURE WORK & EXTENSIONS:\n`;
      text += `-------------------------------------\n`;
      card.future_work.forEach((fw, idx) => {
        text += `• ${fw}\n`;
      });
      text += `\n`;
    }

    text += `=====================================\n`;
    text += `Generated with PaperPod AI Companion · https://paperpod.ai\n`;
    return text;
  },

  /**
   * Triggers native OS share sheet to share summary card with colleagues
   */
  async shareSummaryCard(paperTitle: string, authors: string[] | undefined, card: SummaryCard): Promise<boolean> {
    try {
      const message = this.formatAsMarkdown(paperTitle, authors, card);
      const result = await Share.share({
        title: `Summary Card: ${paperTitle}`,
        message,
      });

      if (result.action === Share.sharedAction) {
        return true;
      }
      return false;
    } catch (e) {
      console.warn('[ExportService] Share error:', e);
      return false;
    }
  },

  /**
   * Generates a high-density, printable HTML document styled for 1-page PDF export
   */
  generatePrintableHtml(paperTitle: string, authors: string[] | undefined, card: SummaryCard): string {
    const authorsHtml = authors && authors.length > 0 ? `<div class="authors">Authors: ${authors.join(', ')}</div>` : '';
    
    const rowsHtml = (card.quantitative_results || [])
      .map(
        (q) => `
        <tr>
          <td class="metric-cell"><strong>${q.metric}</strong></td>
          <td class="baseline-cell">${q.baseline}</td>
          <td class="result-cell"><strong>${q.paper_result}</strong></td>
          <td class="delta-cell"><span class="badge">${q.improvement}</span></td>
        </tr>`
      )
      .join('');

    const limitationsHtml = (card.limitations || [])
      .map((l) => `<li>${l}</li>`)
      .join('');

    const futureWorkHtml = (card.future_work || [])
      .map((f) => `<li>${f}</li>`)
      .join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${paperTitle} - Executive Summary Card</title>
  <style>
    @page { size: A4 portrait; margin: 18mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1a1a1a;
      background: #ffffff;
      line-height: 1.5;
      font-size: 13px;
      margin: 0;
      padding: 24px;
    }
    .header {
      border-bottom: 2px solid #D97736;
      padding-bottom: 12px;
      margin-bottom: 18px;
    }
    .badge-top {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 1.5px;
      color: #D97736;
      text-transform: uppercase;
    }
    h1 {
      font-size: 20px;
      margin: 4px 0 6px 0;
      color: #111;
      font-weight: 700;
    }
    .authors {
      font-size: 12px;
      color: #666;
    }
    .section {
      margin-bottom: 16px;
    }
    .section-title {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1px;
      color: #D97736;
      text-transform: uppercase;
      margin-bottom: 6px;
      border-bottom: 1px solid #eee;
      padding-bottom: 3px;
    }
    .thesis-box {
      background: #faf7f5;
      border-left: 3px solid #D97736;
      padding: 10px 14px;
      font-size: 13.5px;
      line-height: 1.55;
      color: #222;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 6px;
      font-size: 12px;
    }
    th {
      background: #f3f4f6;
      text-align: left;
      padding: 8px 10px;
      font-size: 10.5px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #ddd;
    }
    td {
      padding: 8px 10px;
      border-bottom: 1px solid #eee;
    }
    .result-cell {
      color: #111827;
    }
    .badge {
      display: inline-block;
      background: rgba(217, 119, 54, 0.12);
      color: #C86A32;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 11px;
    }
    ul {
      margin: 0;
      padding-left: 18px;
    }
    li {
      margin-bottom: 5px;
      color: #374151;
    }
    .footer {
      margin-top: 24px;
      border-top: 1px solid #eee;
      padding-top: 8px;
      font-size: 10px;
      color: #9ca3af;
      display: flex;
      justify-content: space-between;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="badge-top">PaperPod Research Executive Summary</div>
    <h1>${paperTitle}</h1>
    ${authorsHtml}
  </div>

  <div class="section">
    <div class="section-title">Core Thesis & Novelty</div>
    <div class="thesis-box">${card.core_thesis}</div>
  </div>

  <div class="section">
    <div class="section-title">Quantitative Benchmarks vs Baselines</div>
    <table>
      <thead>
        <tr>
          <th>Evaluation Metric</th>
          <th>Prior Baseline</th>
          <th>Paper Result</th>
          <th>Gain / Delta</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  </div>

  <div style="display: flex; gap: 20px;">
    <div class="section" style="flex: 1;">
      <div class="section-title">Acknowledged Limitations</div>
      <ul>
        ${limitationsHtml}
      </ul>
    </div>
    <div class="section" style="flex: 1;">
      <div class="section-title">Future Work & Extensions</div>
      <ul>
        ${futureWorkHtml}
      </ul>
    </div>
  </div>

  <div class="footer">
    <span>Synthesized via Gemini 3.1 Flash Lite · PaperPod AI</span>
    <span>https://paperpod.ai</span>
  </div>
</body>
</html>`;
  },
};
