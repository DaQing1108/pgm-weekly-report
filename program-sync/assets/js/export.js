/* ============================================================
   export.js — 週報匯出（DOCX + PDF）
   Program Sync 週報管理系統
   ============================================================ */

// CDN 載入快取
const _loaded = {};

async function _loadScript(id, url) {
  if (_loaded[id]) return;
  await new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = url;
    s.onload  = resolve;
    s.onerror = () => reject(new Error(`無法載入 ${id}`));
    document.head.appendChild(s);
  });
  _loaded[id] = true;
}

// ── DOCX 匯出 ─────────────────────────────────────────────────

/**
 * 將 Markdown 匯出為 DOCX
 * @param {string} markdownContent
 * @param {object} options
 * @param {string} [options.filename]      - 輸出檔名（不含副檔名）
 * @param {string} [options.title]         - 文件標題
 * @param {string} [options.weekLabel]     - 週次
 * @param {string} [options.author]        - 作者
 */
export async function toDocx(markdownContent, options = {}) {
  const {
    filename  = `PnD_Weekly_Report_${options.weekLabel || 'W??'}`,
    title     = 'VIA P&D Center Weekly Report',
    weekLabel = 'W??',
    author    = 'Program Sync',
  } = options;

  // 載入 docx + FileSaver
  await _loadScript('docx',      'https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.min.js');
  await _loadScript('filesaver', 'https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js');

  const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow,
          TableCell, BorderStyle, WidthType, AlignmentType, PageBreak } = window.docx;

  const children = [];

  // ── 封面頁 ──────────────────────────────────────────────────
  children.push(
    new Paragraph({
      text: 'VIA Technologies',
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      text: 'P&D Center Program Weekly Report',
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [new TextRun({ text: `週次：${weekLabel}`, bold: true })],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [new TextRun({ text: `彙整人：${author}` })],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [new PageBreak()],
    }),
  );

  // ── 解析 Markdown 並轉為 docx 段落 ──────────────────────────
  const lines = markdownContent.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 分隔線
    if (/^---+$/.test(line.trim())) {
      children.push(new Paragraph({ text: '' }));
      continue;
    }

    // 標題
    const hMatch = line.match(/^(#{1,4})\s+(.+)/);
    if (hMatch) {
      const level = hMatch[1].length;
      const text  = _stripEmoji(hMatch[2]);
      const headingMap = [null, HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3, HeadingLevel.HEADING_4];
      children.push(new Paragraph({ text, heading: headingMap[level] || HeadingLevel.HEADING_4 }));
      continue;
    }

    // 表格（收集連續的 | 行）
    if (line.trim().startsWith('|')) {
      const tableLines = [line];
      while (i + 1 < lines.length && lines[i + 1].trim().startsWith('|')) {
        i++;
        tableLines.push(lines[i]);
      }
      const table = _mdTableToDocx(tableLines, TableRow, TableCell, Table, TextRun, Paragraph, WidthType, BorderStyle);
      if (table) children.push(table, new Paragraph({ text: '' }));
      continue;
    }

    // 列表
    const liMatch = line.match(/^[-*]\s+(.+)/);
    if (liMatch) {
      const text = _stripMdFormat(_stripEmoji(liMatch[1]));
      children.push(new Paragraph({
        children: [new TextRun({ text: '• ' + text })],
        indent: { left: 360 },
      }));
      continue;
    }

    // 任務列表
    const taskMatch = line.match(/^\[[ x]\]\s+(.+)/i);
    if (taskMatch) {
      const done = line.startsWith('[x]') || line.startsWith('[X]');
      const text = _stripMdFormat(taskMatch[1]);
      children.push(new Paragraph({
        children: [new TextRun({ text: (done ? '☑ ' : '☐ ') + text })],
        indent: { left: 360 },
      }));
      continue;
    }

    // 粗體行（**xxx**）
    const boldLine = line.match(/^\*\*(.+)\*\*$/);
    if (boldLine) {
      children.push(new Paragraph({
        children: [new TextRun({ text: boldLine[1], bold: true })],
      }));
      continue;
    }

    // 引用
    const quoteMatch = line.match(/^>\s*(.+)/);
    if (quoteMatch) {
      children.push(new Paragraph({
        children: [new TextRun({ text: quoteMatch[1], italics: true, color: '666666' })],
        indent: { left: 720 },
      }));
      continue;
    }

    // 一般段落
    if (line.trim()) {
      const text = _stripMdFormat(_stripEmoji(line));
      children.push(new Paragraph({ children: _parseMdInline(text, TextRun) }));
    } else {
      children.push(new Paragraph({ text: '' }));
    }
  }

  const doc = new Document({
    creator: author,
    title,
    description: `P&D Center Weekly Report ${weekLabel}`,
    styles: {
      default: {
        document: {
          run: {
            font: 'Microsoft JhengHei',
            size: 24,
          },
        },
      },
    },
    sections: [{ children }],
  });

  const blob = await Packer.toBlob(doc);
  window.saveAs(blob, `${filename}.docx`);
}

// ── PDF 匯出 ──────────────────────────────────────────────────

/**
 * 將 Markdown 匯出為 PDF
 * @param {string} markdownContent
 * @param {object} options
 * @param {string} [options.filename]
 * @param {string} [options.weekLabel]
 */
export async function toPdf(markdownContent, options = {}) {
  const {
    filename  = `PnD_Weekly_Report_${options.weekLabel || 'W??'}`,
    weekLabel = 'W??',
  } = options;

  // 載入 marked（Markdown 轉 HTML）
  await _loadScript('marked',   'https://cdn.jsdelivr.net/npm/marked@9.0.0/marked.min.js');
  await _loadScript('html2canvas', 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
  await _loadScript('jspdf',    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');

  // 建立隱藏渲染容器
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed; left: -9999px; top: 0;
    width: 794px; padding: 40px 60px;
    background: #fff; font-family: 'Microsoft JhengHei', sans-serif;
    font-size: 13px; line-height: 1.8; color: #1a1a18;
    box-sizing: border-box;
  `;

  // 加入 Markdown 樣式
  container.innerHTML = `
    <style>
      h1 { font-size: 22px; margin-bottom: 12px; color: #1a1a18; }
      h2 { font-size: 17px; margin-top: 24px; margin-bottom: 8px; border-bottom: 1px solid #ddd; padding-bottom: 4px; color: #1a1a18; }
      h3 { font-size: 14px; margin-top: 16px; margin-bottom: 6px; color: #333; }
      p  { margin-bottom: 8px; }
      ul, ol { padding-left: 20px; margin-bottom: 8px; }
      li { margin-bottom: 3px; }
      table { border-collapse: collapse; width: 100%; margin-bottom: 12px; font-size: 11px; }
      th { background: #f5f4f0; border: 1px solid #ddd; padding: 4px 8px; text-align: left; font-weight: 600; }
      td { border: 1px solid #ddd; padding: 4px 8px; }
      blockquote { border-left: 3px solid #378add; padding-left: 12px; color: #666; font-style: italic; }
      hr { border: none; border-top: 1px solid #ddd; margin: 16px 0; }
      code { background: #f5f4f0; padding: 1px 4px; border-radius: 3px; font-size: 11px; }
    </style>
    <div class="content">${window.marked.parse(markdownContent)}</div>
  `;

  document.body.appendChild(container);

  try {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const pageWidth  = 210;
    const pageHeight = 297;
    const margin     = 15;
    const contentW   = pageWidth - margin * 2;

    // 將容器分段截圖
    const totalHeight = container.scrollHeight;
    const pxPerPage   = Math.floor((pageHeight - margin * 2) / 25.4 * 96); // ~pixels per A4 page

    let offsetY = 0;
    let pageNum = 1;

    while (offsetY < totalHeight) {
      const clipHeight = Math.min(pxPerPage, totalHeight - offsetY);

      container.style.clip = `rect(${offsetY}px, 9999px, ${offsetY + clipHeight}px, 0)`;
      container.style.marginTop = `-${offsetY}px`;

      const canvas = await window.html2canvas(container, {
        y: offsetY,
        height: clipHeight,
        width: 794,
        scale: 1.5,
        useCORS: true,
        logging: false,
        windowWidth: 794,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.92);
      const imgH    = (clipHeight / 794) * contentW;

      if (pageNum > 1) pdf.addPage();
      pdf.addImage(imgData, 'JPEG', margin, margin, contentW, imgH);

      offsetY += clipHeight;
      pageNum++;
    }

    // 頁碼
    const totalPages = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(9);
      pdf.setTextColor(150);
      pdf.text(`P&D Center Weekly Report ${weekLabel}`, margin, pageHeight - 8);
      pdf.text(`${i} / ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
    }

    pdf.save(`${filename}.pdf`);
  } finally {
    container.remove();
  }
}

// ── Markdown 工具函式 ─────────────────────────────────────────

function _stripEmoji(text) {
  // 保留文字，移除 emoji（docx 中 emoji 可能無法顯示）
  return text.replace(/[\u{1F000}-\u{1FFFF}]/gu, '').replace(/[🟢🟡🔴✅⚠️📌🔄⏳🚫]/g, '').trim();
}

function _stripMdFormat(text) {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/`([^`]+)`/g, '$1');
}

function _parseMdInline(text, TextRun) {
  const runs = [];
  const boldRe = /\*\*(.+?)\*\*/g;
  let last = 0, m;

  while ((m = boldRe.exec(text)) !== null) {
    if (m.index > last) {
      runs.push(new TextRun({ text: text.slice(last, m.index) }));
    }
    runs.push(new TextRun({ text: m[1], bold: true }));
    last = m.index + m[0].length;
  }

  if (last < text.length) {
    runs.push(new TextRun({ text: text.slice(last) }));
  }

  return runs.length ? runs : [new TextRun({ text })];
}

function _mdTableToDocx(lines, TableRow, TableCell, Table, TextRun, Paragraph, WidthType, BorderStyle) {
  // 過濾掉分隔行 |---|---|
  const dataLines = lines.filter(l => !/^\|[\s\-|:]+\|$/.test(l.trim()));
  if (dataLines.length < 1) return null;

  const rows = dataLines.map((line, rowIdx) => {
    const cells = line.split('|').filter((_, i, a) => i > 0 && i < a.length - 1);
    return new TableRow({
      children: cells.map(cell => new TableCell({
        children: [new Paragraph({
          children: [new TextRun({
            text: _stripMdFormat(_stripEmoji(cell.trim())),
            bold: rowIdx === 0,
            size: 20,
          })],
        })],
        shading: rowIdx === 0 ? { fill: 'F5F4F0' } : undefined,
      })),
    });
  });

  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}
