# ズラッシュ！｜ZURASH! アプリ版

**壁をずらし、氷の上を滑り、星を集めるオリジナルゲーム。**

このリポジトリ `stusaurus/zurash-app` は**ステージ攻略型Webアプリ**の開発対象です。ボードゲームの研究・盤面比較は別リポジトリ `stusaurus/zurash-game` で扱います。ここにある従来の2人対戦ルールエンジンは、アプリ内の独立CPU対戦にも再利用しています。

> **公開状況:** 現在の第1章・第2章の統合開発はDraft PR #15で進行中です。mainへのマージと無料Web版の本番公開は、ユーザーの承認前に行いません。CI成功は人間試遊やiPhone実機Safariの確認を代替しません。

## ゲームの入り口

| ページ | 内容 |
| --- | --- |
| `adventure.html` | 第1章「トリケンの家」／ステージ1〜50と修復 |
| `chapter-two.html` | 第2章「氷の向こうへ」／ステージ51〜70 |
| `duel-boss.html` | CPUとの独立対戦・3難易度（おまけ） |
| `chapter-two-review.html` | 第54・57・59・70面の比較試遊・感想記録 |
| `index.html` | 初期の2人/CPU対戦UI。統一デザインと新しいホーム導線は後続のデザインフェーズで整理 |

第2章の通常進行は第1章50面のクリア後に解放されます。未解放でも、開発中に限り `chapter-two.html?trial=1` から先行試遊できます。

第2章では通常冒険の初クリアごとに結晶を1個取得し、55・60・65・70面で4つの道しるべに灯りが戻ります。家の「氷海の冒険の思い出」へ記録を表示します。自由試遊の進行・報酬は通常冒険と分離しています。

第60・70面クリア後は任意でCPUライバルに挑戦できます。**CPUの勝敗を本編のクリア条件とせず、CPU対戦で結晶や星を増やしません。**

## ローカル起動

実行時の外部ライブラリは不要です。ES Modules・Web Worker・fetchを使うため、ファイルを直接開かずHTTPで配信してください。

```sh
python3 -m http.server 8080
# http://localhost:8080/adventure.html
# http://localhost:8080/chapter-two.html?trial=1
```

Node.js 22を使った開発・QA:

```sh
npm ci
npm test
npm run check
npm run chapter:verify
npm run puzzle:verify
npx playwright install --with-deps chromium webkit
npx playwright test -c playwright.chapter.config.js
```

第2章の配布版は `node scripts/build-chapter-two-preview.js` で隔離パッケージにでき、専用のPlaywright設定 `playwright.preview-bundle.config.js` でテストします。

## ソースとデータ

- `src/puzzle/`: ステージエンジン、合法手、ヒント、ランク、進行・結晶・保存、CPUイベントへの往復
- `data/campaign.json`、`data/chapters/chapter-01/`: 第1章50面のキャンペーン・章構成・解データ
- `data/chapters/chapter-02/adventure-v1.json`: 第2章20面の確定した研究版ステージデータ
- `src/adventure.js` と `src/house-*.js`: 第1章の家づくり・修復・画面
- `src/chapter-fun-lab.js`: 第2章の試遊・クリア・再開・レビューUI
- `src/engine.js`、`src/ai.js`: 既存対戦ルール・合法手・CPU探索
- `src/boss-duel.js`、`src/boss-cpu-worker.js`: 第2章の独立CPU対戦と非同期思考
- `assets/`: 承認済みキャラクター・UI・家のシーン素材

## セーブと品質上の注意

- 第1章、第2章通常冒険、第2章自由試遊のセーブは別々に保持します。
- 破損した第2章セーブは自動上書きせず、明示的な復旧時にバックアップを作ります。
- 容量不足などで保存できなかった結晶は獲得済みとして表示しません。画面内の**再保存**と**未保存JSONの書き出し**を利用できます。
- 別タブで変更された保存データは無断上書きしません。未保存の状態で画面を閉じるとデータが失われる場合があります。
- Chromium/WebKitの自動操作試験を実施していますが、iPhone実機Safariの指操作と、人間による難易度・面白さの評価は別途必要です。

## GitHub Pages：公開前の安全ゲート

正式なURLは公開後に確認する必要があります。想定リポジトリは `stusaurus/zurash-app` です（研究用 `zurash-game` ではありません）。

`scripts/build-public-site.js` は、HTML/CSSに加えて**第1章と第2章の全データ、入れ子のJavaScript、CPU Worker、家の画像素材**を含む静的サイトを `dist/` に構築します。

```sh
node --test tests/public-site-bundle.test.js
node scripts/build-public-site.js dist
```

`.github/workflows/pages.yml` はPR時に配布物を検証し、**mainへの承認済みマージ後にのみ**デプロイする設定です。PR上の静的パッケージ検証は、本番公開を実行しません。

## 残るリリース条件

1. 同一コミットで全CI（第1章、第2章、CPU、公開配布物、ゲーム品質）が成功すること。
2. iPhone実機でステージ操作・拡大盤面・Undo・CPU応答・セーブ復旧を試遊すること。
3. 第54・57・59・70面の候補を人間が比較し、面白さ・難易度を評価すること。
4. **ゲームシステムが安定してから、画面デザインを統一・再制作すること。**
5. 本番マージ・公開はユーザーの明示的承認を得ること。
