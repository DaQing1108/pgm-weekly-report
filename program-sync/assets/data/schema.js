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

// Q-12 修正：PROJECTS_CATALOG 為 dead code（全站無任何 import 使用），已移除。
// 專案資料由 seed.js 直接寫入 store，不需要 catalog 常數。

export const STATUS_OPTIONS = [
  { value: 'on-track',  label: '✅ On Track',  color: 'var(--color-success)' },
  { value: 'at-risk',   label: '⚠️ At Risk',   color: 'var(--color-warning)' },
  { value: 'behind',    label: '🔴 Behind',    color: 'var(--color-danger)'  },
  { value: 'paused',    label: '⏸️ 暫緩',      color: 'var(--color-text-secondary)' },
  { value: 'completed', label: '🏁 已完成',    color: 'var(--color-text-tertiary)' },
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

export const REVIEWERS = [
  { id: 'alex',    name: 'Alex',    title: 'Engineering Manager' },
  { id: 'michael', name: 'Michael', title: 'Product Director'    },
  { id: 'dream',   name: 'Dream',   title: 'Design Lead'         },
];
