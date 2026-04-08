import asyncio
import json
import argparse
import os
from playwright.async_api import async_playwright

async def scrape_loop(loop_url):
    print(f"🔄 準備啟動獨立的自動化專屬瀏覽器...")
    
    # 💡 關鍵改變：我們不在動您原本的系統 Chrome 了！
    # 我們在您的專案資料夾內建一個專屬的「機器人登入檔」，這樣絕對不會發生卡鎖的 Bug！
    user_data_dir = os.path.join(os.getcwd(), "automation", "loop_profile")
    
    async with async_playwright() as p:
        try:
            print("🚀 正在啟動... (若這是全新環境，待會可能需要您手動登入一次微軟)")
            context = await p.chromium.launch_persistent_context(
                user_data_dir,
                headless=False,  # 打開視窗讓我們看著它跑
                args=["--start-maximized"]
            )
            print("✅ 成功啟動！")
        except Exception as e:
            print(f"❌ 啟動失敗。例外訊息: {e}")
            return

        page = context.pages[0] if context.pages else await context.new_page()
        
        print(f"🌍 導航至 Loop Workspace: {loop_url}")
        await page.goto(loop_url, wait_until="domcontentloaded")
        
        print("⏳ 【注意】如果您看到微軟登入畫面，請直接在該視窗完成登入 / MFA驗證！")
        print("⏳ 腳本將在此特別停留 60 秒給您慢慢登入與載入畫面...")
        await asyncio.sleep(60)
        
        try:
            print("👁️ 開始精準解析 Loop 表格結構...")
            
            # 使用我們剛才探測到的真實結構來抓取
            items = await page.evaluate('''() => {
                const rows = document.querySelectorAll('tr');
                const data = [];
                for (let i = 0; i < rows.length; i++) {
                    const tds = rows[i].querySelectorAll('td');
                    // 根據您真實的表格，TD 至少有 6 欄 (流水號, 日期, 分類, 內容, 狀態, 備註/連結)
                    if (tds.length >= 5) {
                        const contentText = tds[3]?.innerText?.trim() || '';
                        
                        // 略過純粹標題列或是空白列
                        if (!contentText || contentText === '內容' || contentText.includes('工作交接')) {
                            // 視情況保留，或在此過濾掉 Header
                        }
                        
                        // 統一狀態格式 (例如把「討論完成」轉為 closed，其餘預設 pending)
                        const rawStatus = tds[4]?.innerText?.trim() || '';
                        const parsedStatus = rawStatus.includes('完成') ? 'closed' : 'pending';
                        
                        data.push({
                            id: 'loop-' + Date.now() + '-' + i,
                            content: contentText,
                            owner: 'TBD', // Loop 欄位裡似乎沒有明確負責人，先帶入 TBD，系統可接手
                            status: parsedStatus,
                            category: tds[2]?.innerText?.trim() || '',
                            date: tds[1]?.innerText?.trim() || '',
                            source: 'Microsoft Loop'
                        });
                    }
                }
                return data;
            }''')
            
            output_file = "loop_extracted_actions.json"
            with open(output_file, "w", encoding="utf-8") as f:
                json.dump(items, f, ensure_ascii=False, indent=2)
            
            print(f"🎉 任務達成！成功萃取 {len(items)} 筆微軟資料，已精準轉換並儲存至 {output_file}")
            
        except Exception as e:
            print(f"❌ 萃取失敗: {e}")
            
        await page.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Microsoft Loop RPA Extractor')
    parser.add_argument('url', help='The URL of the Microsoft Loop page to scrape')
    args = parser.parse_args()
    
    asyncio.run(scrape_loop(args.url))
