/* ============================================================
   schema.js — 靜態參考資料：Teams、Members、Projects Catalog
   Program Sync 週報管理系統
   ============================================================ */

export const TEAMS = [
  { id: 'media-agent',  name: 'Media Agent',  lead: 'Steve Liu',    color: '#4caf6e' },
  { id: 'learnmode',    name: 'LearnMode',     lead: 'TC Peng',      color: '#378add' },
  { id: 'chuangzaoli',  name: '創造栗',         lead: 'Tonny Shieh',  color: '#e4a23c' },
  { id: 'tv-solution',  name: 'TV Solution',   lead: 'Tom Liu',      color: '#9c6fcc' },
  { id: 'edu',          name: '教育線',          lead: 'StevensLee',   color: '#d94f4f' },
  { id: 'org-mgmt',     name: '組織管理',        lead: '',             color: '#6b7280' },
];

export const MEMBERS = [
  { id: 'dream-ku',      name: 'Dream Ku',      role: 'Develop Head',     avatar: 'DK' },
  { id: 'steve-liu',     name: 'Steve Liu',     role: 'Develop Head',     avatar: 'SL' },
  { id: 'jh-tseng',      name: 'JH Tseng',      role: 'Develop Head',     avatar: 'JH' },
  { id: 'tc-peng',       name: 'TC Peng',       role: 'Developer Leader', avatar: 'TC' },
  { id: 'michael-chien', name: 'Michael Chien', role: 'Product Head',     avatar: 'MC' },
  { id: 'alex-liao',     name: 'Alex Liao',     role: 'Pgm Manager',      avatar: 'AL' },
  { id: 'tonny-shieh',   name: 'Tonny Shieh',   role: 'Developer Leader', avatar: 'TS' },
  { id: 'tom-liu',       name: 'Tom Liu',       role: 'Developer Leader', avatar: 'TL' },
  { id: 'anna-guo',      name: 'Anna Guo',      role: 'Developer Leader', avatar: 'AG' },
  { id: 'swift-zhu',     name: 'Swift Zhu',     role: 'Developer Leader', avatar: 'SZ' },
  { id: 'stevenslee',    name: 'StevensLee',    role: 'Edu BU Head',      avatar: 'SE' },
  { id: 'stevenCH-hung', name: 'StevenCH Hung', role: 'Edu BD',           avatar: 'SC' },
  { id: 'eddy-lin',      name: 'Eddy Lin',      role: 'Edu BD',           avatar: 'EL' },
  { id: 'sean-peng',     name: 'Sean Peng',     role: 'Edu PM',           avatar: 'SP' },
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
