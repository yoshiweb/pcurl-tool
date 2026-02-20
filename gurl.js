#!/usr/bin/env node

const { chromium } = require('playwright'); // firefox, webkit も可
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const targetUrl = process.argv[2];

if (!targetUrl) {
  console.error('Error: URL is required.');
  process.exit(1);
}

(async () => {
  console.log(`[Info] Launching browser... Target: ${targetUrl}`);

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // 画面サイズ設定
    await page.setViewportSize({ width: 1280, height: 1024 });

    console.log(`[Info] Loading page...`);

    // ページへ移動
    // waitUntil: 'networkidle' は「通信がなくなるまで待つ」という強力なオプション
    await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 60000 });

    // HTML取得
    const html = await page.content();

    // --- ファイル名生成 (URL全体を使用するロジックに変更) ---
    const urlObj = new URL(targetUrl);

    // URL全体（プロトコルを含む）をベースにする
    let safeName = urlObj.href;

    // クエリパラメータ（?以降）やハッシュ（#以降）を考慮して拡張子を除去するための正規表現
    // ドット、指定の拡張子、その後に「文字列の終わり」または「?」か「#」が続く部分にマッチさせます
    safeName = safeName.replace(/\.(html|htm|php|jsp|asp)(?=$|\?|#)/i, '');

    // コロン(:)、スラッシュ(/)、クエスチョン(?)、アンパサンド(&)、イコール(=)、ハッシュ(#)をアンダースコア(_)に置換
    safeName = safeName.replace(/[:\/?&=#]/g, '_');

    // 連続するアンダースコアを整理 & 末尾整理
    safeName = safeName.replace(/_+/g, '_').replace(/^_|_$/g, '');

    // 万が一空ならindex
    if (!safeName) safeName = 'index';

    // 現在日時の取得とフォーマット (yyyyMMdd-HHmmss.SSS)
    const now = new Date();
    const yyyy = now.getFullYear();
    const MM = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const HH = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const SSS = String(now.getMilliseconds()).padStart(3, '0');

    // ハイフンやドットを含めたタイムスタンプ文字列の生成
    const timestamp = `-${yyyy}${MM}${dd}-${HH}${mm}${ss}.${SSS}`;

    // 必ず .html を付与し、その直前にタイムスタンプを結合
    const filename = `${safeName}${timestamp}.html`;
    // -------------------------------------------------------

    fs.writeFileSync(filename, html);
    console.log(`[Success] Saved to: ${filename}`);

  } catch (error) {
    console.error(`[Error] ${error.message}`);
  } finally {
    await browser.close();
  }
})();