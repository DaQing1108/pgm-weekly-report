/* ============================================================
   schema.js — 靜態參考資料：Teams、Members、Projects Catalog
   Program Sync 週報管理系統
   ============================================================ */

export const TEAMS = [
  { id: 'media-agent',  name: 'Media Agent',    lead: 'Steve Liu',   color: '#4caf6e' },
  { id: 'learnmode',    name: 'LearnMode',       lead: 'TC Peng',     color: '#378add' },
  { id: 'chuangzaoli',  name: '創造栗',           lead: 'Tonny Shen',  color: '#e4a23c' },
  { id: 'tv-solution',  name: 'TV Solution',     lead: 'Tom Liu',     color: '#9c6fcc' },
  { id: 'healthcare',   name: 'BU2 Healthcare',  lead: 'Tonny Shen',  color: '#d94f4f' },
  { id: 'org-mgmt',    name: '組織管理',          lead: '',            color: '#6b7280' },
];

export const MEMBERS = [
  { id: 'steve-liu',    name: 'Steve Liu',    team: 'media-agent',  role: 'Team Lead',    avatar: 'SL' },
  { id: 'tc-peng',      name: 'TC Peng',      team: 'learnmode',    role: 'Team Lead',    avatar: 'TC' },
  { id: 'tonny-shen',   name: 'Tonny Shen',   team: 'chuangzaoli',  role: 'Team Lead',    avatar: 'TS' },
  { id: 'tom-liu',      name: 'Tom Liu',      team: 'tv-solution',  role: 'Team Lead',    avatar: 'TL' },
  { id: 'alex-chen',    name: 'Alex Chen',    team: 'media-agent',  role: 'Engineer',     avatar: 'AC' },
  { id: 'michael-wu',   name: 'Michael Wu',   team: 'learnmode',    role: 'Engineer',     avatar: 'MW' },
  { id: 'dream-lin',    name: 'Dream Lin',    team: 'chuangzaoli',  role: 'Designer',     avatar: 'DL' },
  { id: 'jenny-huang',  name: 'Jenny Huang',  team: 'tv-solution',  role: 'QA Engineer',  avatar: 'JH' },
  { id: 'kevin-chang',  name: 'Kevin Chang',  team: 'media-agent',  role: 'PM',           avatar: 'KC' },
  { id: 'lily-tsai',    name: 'Lily Tsai',    team: 'healthcare',   role: 'Engineer',     avatar: 'LT' },
  { id: 'ryan-hsu',     name: 'Ryan Hsu',     team: 'healthcare',   role: 'BA',           avatar: 'RH' },
];

export const PROJECTS_CATALOG = [
  {
    id: 'proj-media-001',
    name: 'AI Content Pipeline',
    team: 'media-agent',
    category: 'Platform',
    description: '基於 AI 的媒體內容自動化處理流水線，整合多模態模型進行內容分析與生成。',
    targetDate: '2026-06-30',
    priority: 'high',
  },
  {
    id: 'proj-media-002',
    name: 'Smart Recommendation Engine',
    team: 'media-agent',
    category: 'AI/ML',
    description: '個人化內容推薦引擎，整合用戶行為資料與協同過濾演算法。',
    targetDate: '2026-09-30',
    priority: 'medium',
  },
  {
    id: 'proj-learn-001',
    name: 'LearnMode v2.0',
    team: 'learnmode',
    category: 'Product',
    description: '智慧學習模式平台 v2.0，新增自適應課程路徑與知識圖譜功能。',
    targetDate: '2026-07-15',
    priority: 'high',
  },
  {
    id: 'proj-learn-003',
    name: 'B2小車V3',
    team: 'learnmode',
    category: 'Product',
    description: 'B2小車第三代產品開發，目前開發暫緩。',
    targetDate: '2026-12-31',
    priority: 'medium',
  },
  {
    id: 'proj-learn-002',
    name: 'Classroom Analytics Dashboard',
    team: 'learnmode',
    category: 'Analytics',
    description: '教室學習數據分析儀表板，提供即時學習表現可視化。',
    targetDate: '2026-05-31',
    priority: 'medium',
  },
  {
    id: 'proj-czl-001',
    name: '創造栗 App v3',
    team: 'chuangzaoli',
    category: 'Mobile',
    description: '創意學習應用 v3，加入 AR 教具功能與社群協作模式。',
    targetDate: '2026-08-31',
    priority: 'high',
  },
  {
    id: 'proj-czl-002',
    name: 'Content Creator Studio',
    team: 'chuangzaoli',
    category: 'Tool',
    description: '內容創作者工作室，提供課程素材設計與發布工具。',
    targetDate: '2026-06-30',
    priority: 'medium',
  },
  {
    id: 'proj-tv-001',
    name: 'Smart TV Integration SDK',
    team: 'tv-solution',
    category: 'SDK',
    description: '智慧電視整合 SDK，支援多家電視廠商的學習應用部署。',
    targetDate: '2026-05-15',
    priority: 'high',
  },
  {
    id: 'proj-tv-002',
    name: 'STB Learning Platform',
    team: 'tv-solution',
    category: 'Platform',
    description: '機上盒學習平台，針對東南亞市場的低頻寬環境優化。',
    targetDate: '2026-10-31',
    priority: 'medium',
  },
  {
    id: 'proj-hc-001',
    name: 'Healthcare AI Assistant',
    team: 'healthcare',
    category: 'AI/ML',
    description: '醫療 AI 助手，協助醫護人員進行病歷分析與診療建議。',
    targetDate: '2026-12-31',
    priority: 'high',
  },
  {
    id: 'proj-hc-002',
    name: 'Patient Monitoring System',
    team: 'healthcare',
    category: 'IoT',
    description: '病患遠端監測系統，整合 IoT 感測器與即時警報機制。',
    targetDate: '2026-09-30',
    priority: 'high',
  },
  {
    id: 'proj-platform-001',
    name: 'P&D Center DevOps Pipeline',
    team: 'media-agent',
    category: 'Infrastructure',
    description: '全中心共用 CI/CD 平台，整合測試、部署自動化與監控。',
    targetDate: '2026-04-30',
    priority: 'medium',
  },
];

export const STATUS_OPTIONS = [
  { value: 'on-track', label: '✅ On Track',  color: 'var(--color-success)' },
  { value: 'at-risk',  label: '⚠️ At Risk',   color: 'var(--color-warning)' },
  { value: 'behind',   label: '🔴 Behind',    color: 'var(--color-danger)'  },
  { value: 'paused',   label: '⏸️ 暫緩',      color: 'var(--color-text-secondary)' },
];

export const RISK_LEVELS = [
  { value: 'high',   label: 'High',   color: 'var(--color-danger)'  },
  { value: 'medium', label: 'Medium', color: 'var(--color-warning)' },
  { value: 'low',    label: 'Low',    color: 'var(--color-success)' },
];

export const ACTION_CATEGORIES = [
  { value: 'technical',  label: '技術',  icon: '⚙️' },
  { value: 'business',   label: '業務',  icon: '📋' },
  { value: 'resource',   label: '資源',  icon: '👥' },
];

export const ACTION_STATUSES = [
  { value: 'pending',     label: '待辦' },
  { value: 'in-progress', label: '進行中' },
  { value: 'done',        label: '完成' },
  { value: 'blocked',     label: '阻塞' },
];

export const REVIEW_STATUSES = [
  { value: 'draft',     label: 'Draft'     },
  { value: 'in-review', label: 'In Review' },
  { value: 'approved',  label: 'Approved'  },
  { value: 'rejected',  label: 'Rejected'  },
];

export const TONE_OPTIONS = [
  { value: 'formal',      label: '正式 (Formal)'         },
  { value: 'concise',     label: '簡潔 (Concise)'        },
  { value: 'executive',   label: '高管摘要 (Executive)'  },
  { value: 'technical',   label: '技術細節 (Technical)'  },
];

export const REPORT_SECTIONS = [
  { id: 'cover',     label: '封面',            defaultOn: true  },
  { id: 'summary',   label: 'Executive Summary', defaultOn: true  },
  { id: 'projects',  label: '專案進度',         defaultOn: true  },
  { id: 'teams',     label: '子組進度',         defaultOn: true  },
  { id: 'decisions', label: '決策與風險',       defaultOn: true  },
  { id: 'next',      label: '下週計畫',         defaultOn: true  },
  { id: 'risks',     label: 'Risk Register',   defaultOn: true  },
  { id: 'actions',   label: 'Action Items',    defaultOn: true  },
  { id: 'milestones',label: '里程碑',           defaultOn: false },
];

export const REVIEWERS = [
  { id: 'alex',    name: 'Alex',    title: 'Engineering Manager' },
  { id: 'michael', name: 'Michael', title: 'Product Director'    },
  { id: 'dream',   name: 'Dream',   title: 'Design Lead'         },
];
