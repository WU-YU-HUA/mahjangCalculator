# 🀄 台灣麻將 16 張牌效計算器 (Taiwan Mahjong Calculator)

這是一個輕量、極速的「台灣十六張麻將」牌效與進張計算工具。
無論是在電腦前還是牌桌上，都能透過直覺的介面，快速算出當下最佳的打牌建議。

🔗 **[點此直接使用線上版 (Live Demo)](https://WU-YU-HUA.github.io/mahjangCalculator/)**

---

## ✨ 核心特色 (Features)

* **精準牌效引擎：** 支援標準台灣 16 張麻將算法，快速計算「幾進聽 (向聽數)」、「進張種類」與「總進張數」。
* **最佳打牌建議：** 輸入 17 張牌時，系統會自動列出所有可打出的牌，並依據「進聽數 > 進張種類 > 總進張數」進行多層次智慧排序。
* **行動端極致體驗 (Mobile First)：**
  * 專為手機單手操作設計的 **4x4 完美正方形網格鍵盤**，防誤觸且符合人體工學。
* **次佳解收合設計：** 預設僅展開「最佳打法」，其餘次佳解自動收合，保持畫面清爽。
* **自動存檔 (Local Storage)：** 隨時記錄目前的手牌狀態，即使不小心重整網頁或關閉分頁，下次打開依然能無縫接軌。

---

## 🛠️ 技術堆疊 (Tech Stack)
* **核心語言：** HTML5, CSS3, ES6 Vanilla JavaScript
* **演算法：** 基於經典向聽數演算法（回溯拆牌 + 快取查表優化）自 Python 移植並改寫。
* **部署方式：** GitHub Pages (CI/CD 自動化部署)

---

## 🚀 如何在本地端執行 (Local Development)

因為是純靜態網頁，完全不需要安裝 Node.js 或任何打包工具 (Webpack/Vite)。

1. 將專案 Clone 到本機：
   ```bash
   git clone [https://github.com/WU-YU-HUA/mahjangCalculator.git](https://github.com/WU-YU-HUA/mahjangCalculator.git)