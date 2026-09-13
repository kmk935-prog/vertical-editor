const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

/**
 * テキストの整形処理
 * @param {string} text 
 * @returns {string} HTML化された段落群
 */
function formatText(text) {
  return text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => {
      // 記号で始まらない行の先頭に全角スペース（字下げ）を挿入
      const hasIndent = /^[「『（【〈《“"『]/.test(line);
      const indentedLine = hasIndent ? line : ` ${line}`;
      return `<p>${indentedLine}</p>`;
    })
    .join('');
}

/**
 * PDF生成処理
 */
async function generateVerticalPDF(options) {
  const { inputText, fontFamily, outputPath } = options;
  const formattedHTML = formatText(inputText);

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Shippori+Mincho&family=Zen+Kaku+Gothic+New&display=swap');

        @page {
          size: A4 portrait;
          margin: 20mm;
        }

        body {
          /* 縦書き指定（右から左へ） */
          writing-mode: vertical-rl;
          -webkit-writing-mode: vertical-rl;
          font-family: ${fontFamily};
          font-size: 14pt;
          line-height: 1.8;
          letter-spacing: 0.05em;
          width: 100%;
          height: 100vh;
          margin: 0;
          text-align: justify; /* 両端揃え */
        }

        p {
          margin: 0 0.5em 0 0; /* 縦書きの場合、margin-left/rightが改行幅になります */
          text-indent: 0; /* JS側で全角スペースを補正済み */
        }
      </style>
    </head>
    <body>
      ${formattedHTML}
    </body>
    </html>
  `;

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true
  });

  await browser.close();
  console.log(`PDFが出力されました: ${outputPath}`);
}

// --- 実行コード例 ---
const sampleText = `
吾輩は猫である。名前はまだ無い。
どこで生れたか頓と見当がつかぬ。何でも暗いじめじめした所でニャーニャー泣いていた事だけは記憶している。
「ニャー、ニャー」
吾輩はここで初めて人間というものを見た。しかもあとで聞くとそれは書生という人間中で一番獰悪な種族であったそうだ。
`;

generateVerticalPDF({
  inputText: sampleText,
  // フォント選択（Google Fonts等からCSS名で指定可能）
  // 例: 'Shippori Mincho', serif （明朝体）
  // 例: 'Zen Kaku Gothic New', sans-serif （ゴシック体）
  fontFamily: "'Shippori Mincho', serif",
  outputPath: path.join(__dirname, 'output.pdf')
});