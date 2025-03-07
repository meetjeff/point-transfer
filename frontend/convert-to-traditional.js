const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

// 簡繁體轉換庫
const OpenCC = require('opencc-js');
const converter = OpenCC.Converter({ from: 'cn', to: 'tw' });

// 需要掃描的文件類型
const fileExtensions = ['.js', '.vue', '.json', '.html', '.css', '.md', '.txt'];

// 要排除的目錄
const excludeDirs = ['node_modules', '.git', 'dist', 'build'];

// 遞歸掃描目錄
async function scanDirectory(directory) {
  try {
    const files = await readdir(directory);

    for (const file of files) {
      const filePath = path.join(directory, file);
      const stats = await stat(filePath);

      // 排除特定目錄
      if (stats.isDirectory()) {
        if (!excludeDirs.includes(file)) {
          await scanDirectory(filePath);
        }
        continue;
      }

      // 只處理指定擴展名的文件
      const ext = path.extname(file);
      if (fileExtensions.includes(ext)) {
        await convertFile(filePath);
      }
    }
  } catch (error) {
    console.error(`掃描目錄 ${directory} 出錯:`, error);
  }
}

// 轉換文件內容
async function convertFile(filePath) {
  try {
    // 讀取文件內容
    const content = await readFile(filePath, 'utf-8');

    // 檢查文件是否包含中文字符
    const hasChinese = /[\u4e00-\u9fa5]/.test(content);

    if (hasChinese) {
      // 轉換為繁體
      const converted = converter(content);

      // 寫入轉換後的內容
      await writeFile(filePath, converted, 'utf-8');
      console.log(`✅ 已轉換: ${filePath}`);
    }
  } catch (error) {
    console.error(`轉換文件 ${filePath} 出錯:`, error);
  }
}

// 入口函數
async function main() {
  const rootDir = path.resolve(__dirname);
  console.log(`開始轉換，工作目錄: ${rootDir}`);

  await scanDirectory(rootDir);

  console.log('轉換完成!');
}

// 執行轉換
main().catch(console.error);
