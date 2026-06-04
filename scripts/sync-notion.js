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
        // Remove quotes if present
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        process.env[key] = value;
      }
    }
  }
}

loadEnv();

const NOTION_TOKEN = process.env.NOTION_TOKEN || process.env.ADMIN_TOKEN;
const PAGE_ID = process.env.NOTION_PAGE_ID;

if (!PAGE_ID) {
  console.error('\x1b[31mError: NOTION_PAGE_ID is not configured in .env file.\x1b[0m');
  process.exit(1);
}

if (!NOTION_TOKEN || NOTION_TOKEN === '你的token') {
  console.error('\x1b[31mError: NOTION_TOKEN or ADMIN_TOKEN is not set or is still a placeholder in .env file.\x1b[0m');
  console.error('Please configure your .env file with your integration token:');
  console.error('  NOTION_TOKEN=secret_yourIntegrationTokenHere\n');
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
        const safeLink = /^https?:\/\//i.test(url) ? { url } : undefined;
        results.push({
          type: 'text',
          text: {
            content: match[4],
            ...(safeLink ? { link: safeLink } : {})
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

async function syncToNotion() {
  console.log(`\n\x1b[36m🚀 Starting fully formatted Notion sync for page [${PAGE_ID}]...\x1b[0m`);

  // 1. Read implementation plan Markdown file
  const planPath = path.join(__dirname, '../docs/組織架構與人員名單.md'); // default check
  const localPlanPath = path.join(__dirname, '../implementation_plan.md');
  
  let mdContent = '';
  let activePlanName = '';

  if (fs.existsSync(localPlanPath)) {
    mdContent = fs.readFileSync(localPlanPath, 'utf8');
    activePlanName = 'implementation_plan.md';
  } else if (fs.existsSync(planPath)) {
    mdContent = fs.readFileSync(planPath, 'utf8');
    activePlanName = 'docs/組織架構與人員名單.md';
  } else {
    console.error('\x1b[31mError: No valid Markdown plan files found in standard locations.\x1b[0m');
    process.exit(1);
  }

  console.log(`\x1b[32m✔ Loaded plan file: ${activePlanName}\x1b[0m`);

  // 2. Parse Markdown to Notion blocks
  const blocks = markdownToNotionBlocks(mdContent);
  console.log(`\x1b[32m✔ Successfully parsed Markdown into ${blocks.length} Notion blocks.\x1b[0m`);

  try {
    // 3. Retrieve and delete old block children
    console.log('🧹 Fetching and deleting old blocks from the page...');
    const oldBlocksData = await notionApiRequest('GET', `/v1/blocks/${PAGE_ID}/children?page_size=100`);
    const oldBlockIds = oldBlocksData.results.map(block => block.id);
    
    if (oldBlockIds.length > 0) {
      console.log(`🧹 Found ${oldBlockIds.length} existing blocks. Deleting them...`);
      for (const id of oldBlockIds) {
        await notionApiRequest('DELETE', `/v1/blocks/${id}`);
      }
      console.log('🧹 Old blocks cleared successfully.');
    } else {
      console.log('🧹 Page is already blank.');
    }

    // 4. Batch append new blocks
    console.log(`📤 Appending ${blocks.length} new fully-formatted blocks in batches...`);
    const batchSize = 80; // Safer batch size under Notion's 100 block limit
    for (let i = 0; i < blocks.length; i += batchSize) {
      const chunk = blocks.slice(i, i + batchSize);
      console.log(`📤 Uploading batch ${Math.floor(i / batchSize) + 1} (${chunk.length} blocks)...`);
      await notionApiRequest('PATCH', `/v1/blocks/${PAGE_ID}/children`, { children: chunk });
    }

    console.log('\n\x1b[32;1m🎉 Notion Sync Completed Successfully!\x1b[0m');
    console.log(`🔗 Access the fully formatted page here: https://www.notion.so/${PAGE_ID.replace(/-/g, '')}\n`);
  } catch (error) {
    console.error('\n\x1b[31m❌ Error syncing to Notion:\x1b[0m', error.message);
    process.exit(1);
  }
}

syncToNotion();
