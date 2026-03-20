import { useEffect, useState } from 'react'
import { marked } from 'marked'

const styles = {
  root: { fontFamily: "'Noto Sans TC', 'PingFang TC', sans-serif", display: 'flex', height: '100vh', margin: 0, background: '#F7FAFC' },
  sidebar: { width: 240, background: '#1A365D', color: 'white', padding: '24px 0', flexShrink: 0, overflowY: 'auto' },
  sidebarTitle: { fontSize: 13, fontWeight: 700, letterSpacing: 1, padding: '0 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: 12 },
  sidebarItem: (active) => ({
    padding: '10px 20px', cursor: 'pointer', fontSize: 13,
    background: active ? 'rgba(255,255,255,0.15)' : 'transparent',
    borderLeft: active ? '3px solid #63B3ED' : '3px solid transparent',
    transition: 'background 0.15s',
  }),
  sidebarVersion: { fontSize: 12, fontWeight: 700, color: '#63B3ED' },
  sidebarDate: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  main: { flex: 1, overflowY: 'auto', padding: '32px 48px' },
  content: { maxWidth: 900, margin: '0 auto', background: 'white', borderRadius: 12, padding: '40px 48px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  empty: { color: '#718096', textAlign: 'center', marginTop: 80, fontSize: 15 },
}

const mdStyles = `
  .md-body h1 { font-size: 22px; color: #1A365D; margin-bottom: 8px; }
  .md-body h2 { font-size: 17px; color: #2B6CB0; margin: 28px 0 10px; border-bottom: 2px solid #EBF8FF; padding-bottom: 6px; }
  .md-body h3 { font-size: 14px; color: #2D3748; margin: 20px 0 8px; }
  .md-body h4 { font-size: 13px; color: #4A5568; margin: 16px 0 6px; }
  .md-body p { font-size: 13px; line-height: 1.75; color: #2D3748; margin-bottom: 10px; }
  .md-body table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 12px; }
  .md-body th { background: #EBF8FF; color: #2C5282; padding: 8px 10px; text-align: left; border: 1px solid #BEE3F8; }
  .md-body td { padding: 7px 10px; border: 1px solid #E2E8F0; vertical-align: top; }
  .md-body tr:nth-child(even) td { background: #F7FAFC; }
  .md-body ul, .md-body ol { padding-left: 20px; font-size: 13px; line-height: 1.75; color: #2D3748; }
  .md-body li { margin-bottom: 4px; }
  .md-body strong { color: #1A365D; }
  .md-body code { background: #EDF2F7; color: #2D3748; padding: 1px 5px; border-radius: 4px; font-size: 12px; }
  .md-body pre { background: #EBF8FF; color: #1A365D; border: 1px solid #BEE3F8; padding: 16px; border-radius: 8px; font-size: 12px; overflow-x: auto; line-height: 1.7; }
  .md-body pre code { background: transparent; padding: 0; color: inherit; }
  .md-body hr { border: none; border-top: 1px solid #E2E8F0; margin: 20px 0; }
  .md-body blockquote { border-left: 4px solid #BEE3F8; padding: 8px 16px; background: #EBF8FF; border-radius: 0 6px 6px 0; margin: 12px 0; }
`

export default function App() {
  const [reports, setReports] = useState([])
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState(null)

  const API = import.meta.env.VITE_API_URL || ''

  useEffect(() => {
    fetch(`${API}/api/reports`)
      .then(r => r.json())
      .then(d => {
        setReports(d.reports || [])
        if (d.reports && d.reports.length > 0) setSelected(d.reports[0])
      })
      .catch(() => setError('無法連線至 API，請確認 backend 已啟動（port 3001）'))
  }, [])

  return (
    <>
      <style>{mdStyles}</style>
      <div style={styles.root}>
        {/* Sidebar */}
        <div style={styles.sidebar}>
          <div style={styles.sidebarTitle}>VIA PgM 週報</div>
          {reports.map(r => (
            <div key={r.filename} style={styles.sidebarItem(selected?.filename === r.filename)}
              onClick={() => setSelected(r)}>
              <div style={styles.sidebarVersion}>{r.version}</div>
              <div style={styles.sidebarDate}>{r.period || r.date}</div>
            </div>
          ))}
        </div>

        {/* Main */}
        <div style={styles.main}>
          {error && <div style={{ color: '#E53E3E', padding: 20 }}>{error}</div>}
          {!error && !selected && <div style={styles.empty}>選擇左側週報版本以閱讀內容</div>}
          {selected && (
            <div style={styles.content}>
              {/* 下載按鈕 */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                <a
                  href={`${API}/api/reports/${selected.filename}/download`}
                  download={selected.filename}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                    background: '#2B6CB0', color: 'white', textDecoration: 'none',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.15)', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#1A365D'}
                  onMouseLeave={e => e.currentTarget.style.background = '#2B6CB0'}
                >
                  ↓ 下載 .md
                </a>
              </div>
              <div
                className="md-body"
                dangerouslySetInnerHTML={{ __html: marked.parse(selected.content.replace(/（v\d+）/g, '')) }}
              />
            </div>
          )}
        </div>
      </div>
    </>
  )
}
