const fs = require('fs');
const path = require('path');
const https = require('https');

// Load environment variables from .env in the project root
function loadEnv() {
  const envPath = path.join(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        process.env[key] = value;
      }
    }
  }
}

loadEnv();

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DATABASE_ID = process.env.NOTION_DATABASE_ID;

if (!NOTION_TOKEN || NOTION_TOKEN === '你的token') {
  console.error('\x1b[31mError: NOTION_TOKEN is not configured in .env file.\x1b[0m');
  process.exit(1);
}
if (!DATABASE_ID) {
  console.error('\x1b[31mError: NOTION_DATABASE_ID is not configured in .env file.\x1b[0m');
  process.exit(1);
}

// Custom HTTPS request helper to interact with Notion API without dependencies
function notionApiRequest(method, endpoint, body = null) {
  const options = {
    hostname: 'api.notion.com',
    port: 443,
    path: endpoint,
    method: method,
    headers: {
      'Authorization': `Bearer ${NOTION_TOKEN}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`Notion API Error (${res.statusCode}): ${parsed.message || data}`));
          }
        } catch (e) {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
          } else {
            reject(new Error(`Notion HTTP Error (${res.statusCode}): ${data}`));
          }
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

// Inline Markdown style parser to Notion rich_text format
function parseRichText(text) {
  const results = [];
  const pattern = /(\*\*([^\*]+)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\))/g;
  let match;
  let lastIndex = 0;

  while ((match = pattern.exec(text)) !== null) {
    const matchIndex = match.index;
    if (matchIndex > lastIndex) {
      results.push({
        type: 'text',
        text: { content: text.substring(lastIndex, matchIndex) }
      });
    }

    if (match[1].startsWith('**')) {
      results.push({
        type: 'text',
        text: { content: match[2] },
        annotations: { bold: true }
      });
    } else if (match[1].startsWith('`')) {
      results.push({
        type: 'text',
        text: { content: match[3] },
        annotations: { code: true }
      });
    } else if (match[1].startsWith('[')) {
      const url = match[5];
      if (url.startsWith('file://')) {
        results.push({
          type: 'text',
          text: { content: match[4] },
          annotations: { code: true }
        });
      } else {
        results.push({
          type: 'text',
          text: {
            content: match[4],
            link: { url: url }
          }
        });
      }
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    results.push({
      type: 'text',
      text: { content: text.substring(lastIndex) }
    });
  }

  return results.length > 0 ? results : [{ type: 'text', text: { content: text } }];
}

// Convert entire Markdown text into fully formatted Notion blocks
function markdownToNotionBlocks(mdContent) {
  const lines = mdContent.split(/\r?\n/);
  const blocks = [];
  
  let inCodeBlock = false;
  let codeLanguage = 'plain text';
  let codeLines = [];
  
  let inCallout = false;
  let calloutEmoji = '💡';
  let calloutLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // 1. Handle Code Blocks
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        blocks.push({
          object: 'block',
          type: 'code',
          code: {
            rich_text: [{ type: 'text', text: { content: codeLines.join('\n') } }],
            language: codeLanguage
          }
        });
        inCodeBlock = false;
        codeLines = [];
      } else {
        inCodeBlock = true;
        codeLanguage = trimmed.slice(3).trim().toLowerCase() || 'plain text';
        if (codeLanguage === 'js') codeLanguage = 'javascript';
        else if (codeLanguage === 'css') codeLanguage = 'css';
        else if (codeLanguage === 'html') codeLanguage = 'html';
        else if (codeLanguage === 'json') codeLanguage = 'json';
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    // 2. Handle Callout Blocks
    if (trimmed.startsWith('>')) {
      let calloutText = trimmed.slice(1).trim();
      if (calloutText.startsWith('[!')) {
        inCallout = true;
        const typeMatch = calloutText.match(/\[!([^\]]+)\]/);
        const type = typeMatch ? typeMatch[1] : 'NOTE';
        if (['IMPORTANT', 'WARNING', 'CAUTION'].includes(type)) {
          calloutEmoji = '⚠️';
        } else {
          calloutEmoji = '💡';
        }
        continue;
      }
      
      if (inCallout) {
        if (calloutText.startsWith('- ') || calloutText.startsWith('* ')) {
          calloutText = calloutText.slice(2);
        }
        calloutLines.push(calloutText);
        continue;
      }
    } else {
      if (inCallout) {
        blocks.push({
          object: 'block',
          type: 'callout',
          callout: {
            rich_text: parseRichText(calloutLines.join('\n')),
            icon: { type: 'emoji', emoji: calloutEmoji }
          }
        });
        inCallout = false;
        calloutLines = [];
      }
    }

    // 3. Handle Dividers
    if (trimmed === '---') {
      blocks.push({
        object: 'block',
        type: 'divider',
        divider: {}
      });
      continue;
    }

    // 4. Handle Headings
    if (trimmed.startsWith('# ')) {
      blocks.push({
        object: 'block',
        type: 'heading_1',
        heading_1: {
          rich_text: parseRichText(trimmed.slice(2))
        }
      });
      continue;
    }
    if (trimmed.startsWith('## ')) {
      blocks.push({
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: parseRichText(trimmed.slice(3))
        }
      });
      continue;
    }
    if (trimmed.startsWith('### ')) {
      blocks.push({
        object: 'block',
        type: 'heading_3',
        heading_3: {
          rich_text: parseRichText(trimmed.slice(4))
        }
      });
      continue;
    }
    if (trimmed.startsWith('#### ')) {
      blocks.push({
        object: 'block',
        type: 'heading_3',
        heading_3: {
          rich_text: parseRichText(trimmed.slice(5))
        }
      });
      continue;
    }

    // 5. Handle Bulleted Lists
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      blocks.push({
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: parseRichText(trimmed.slice(2))
        }
      });
      continue;
    }

    // 6. Handle Paragraphs & Spacers
    if (trimmed === '') {
      const lastBlock = blocks[blocks.length - 1];
      if (lastBlock && lastBlock.type !== 'divider' && lastBlock.type !== 'paragraph') {
        blocks.push({
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: []
          }
        });
      }
    } else {
      blocks.push({
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: parseRichText(trimmed)
        }
      });
    }
  }

  if (inCallout && calloutLines.length > 0) {
    blocks.push({
      object: 'block',
      type: 'callout',
      callout: {
        rich_text: parseRichText(calloutLines.join('\n')),
        icon: { type: 'emoji', emoji: calloutEmoji }
      }
    });
  }

  return blocks;
}

async function saveToNotion() {
  const notePath = path.join(__dirname, '../knowledge_note.md');
  
  if (!fs.existsSync(notePath)) {
    console.error('\x1b[31mError: knowledge_note.md not found in workspace root.\x1b[0m');
    process.exit(1);
  }

  const mdContent = fs.readFileSync(notePath, 'utf8');
  const lines = mdContent.split(/\r?\n/);
  
  let title = '未命名經驗筆記';
  let date = new Date().toISOString().split('T')[0];
  let tags = ['Claude'];
  let status = 'Done';
  let source = 'Claude chat';
  let blufText = '對話結構化經驗總結';
  let bodyStartIndex = 0;

  // Extract Metadata from headers
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('# Title:')) {
      title = line.replace('# Title:', '').trim();
    } else if (line.startsWith('# ') && i === 0) {
      title = line.replace('# ', '').trim();
    } else if (line.startsWith('- Date:')) {
      date = line.replace('- Date:', '').trim();
    } else if (line.startsWith('- Tags:')) {
      tags = line.replace('- Tags:', '').split(',').map(t => t.trim());
    } else if (line.startsWith('- Status:')) {
      status = line.replace('- Status:', '').trim();
    } else if (line.startsWith('- Source:')) {
      source = line.replace('- Source:', '').trim();
    } else if (line.startsWith('- BLUF:')) {
      blufText = line.replace('- BLUF:', '').trim();
    } else if (line.startsWith('## ') || line.startsWith('1. BLUF')) {
      bodyStartIndex = i;
      break;
    }
  }

  console.log(`\n\x1b[36m🚀 Parsing experience note...\x1b[0m`);
  console.log(`📌 Title:  ${title}`);
  console.log(`📅 Date:   ${date}`);
  console.log(`🏷️ Tags:   ${tags.join(', ')}`);
  console.log(`📊 Status: ${status}`);
  console.log(`💡 BLUF:   ${blufText}`);

  const bodyContent = lines.slice(bodyStartIndex).join('\n');
  const blocks = markdownToNotionBlocks(bodyContent);
  console.log(`✔ Successfully parsed note into ${blocks.length} Notion blocks.`);

  // Notion database structure Properties mapping
  const payload = {
    parent: {
      type: 'database_id',
      database_id: DATABASE_ID
    },
    properties: {
      Title: {
        title: [
          { text: { content: title } }
        ]
      },
      Date: {
        date: { start: date }
      },
      Source: {
        select: { name: source }
      },
      Status: {
        status: { name: status }
      },
      Tags: {
        multi_select: tags.map(tag => ({ name: tag }))
      },
      BLUF: {
        rich_text: [
          { text: { content: blufText.substring(0, 2000) } } // Cap rich text limit
        ]
      },
      Content: {
        rich_text: [
          { text: { content: blufText.substring(0, 2000) } }
        ]
      }
    },
    children: blocks.slice(0, 100) // Notion pages limit initially up to 100 blocks
  };

  try {
    console.log('📤 Sending page creation request to Notion API...');
    const result = await notionApiRequest('POST', '/v1/pages', payload);
    const newPageId = result.id;
    
    // If blocks size > 100, upload remaining in batches
    if (blocks.length > 100) {
      console.log(`📤 Appending remaining ${blocks.length - 100} blocks to new page...`);
      const remainingBlocks = blocks.slice(100);
      const batchSize = 80;
      for (let i = 0; i < remainingBlocks.length; i += batchSize) {
        const chunk = remainingBlocks.slice(i, i + batchSize);
        await notionApiRequest('PATCH', `/v1/blocks/${newPageId}/children`, { children: chunk });
      }
    }

    console.log('\n\x1b[32;1m🎉 Notion Page Created and Synced Successfully!\x1b[0m');
    console.log(`🔗 Access your new experience note here: https://www.notion.so/${newPageId.replace(/-/g, '')}\n`);
  } catch (error) {
    console.error('\n\x1b[31m❌ Error saving page to Notion:\x1b[0m', error.message);
    process.exit(1);
  }
}

saveToNotion();
