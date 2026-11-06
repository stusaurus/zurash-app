# ズラッシュ！｜ZURASH! アプリ版

**壁をずらし、氷の上を滑り、星を集めるオリジナルゲーム。**

このリポジトリ `stusaurus/zurash-app` は**ステージ攻略型Webアプリ**の開発対象です。ボードゲームの研究・盤面比較は別リポジトリ `stusaurus/zurash-game` で扱います。ここにある従来の2人対戦ルールエンジンは、アプリ内の独立CPU対戦にも再利用しています。

> **ベータ版リリース状況（2026-11-06）:** 第1・第2章および共通UIは [PR #17](https://github.com/stusaurus/zurash-app/pull/17) から `main` に統合済みです。公開サイトへの反映状況は [GitHub Pagesワークフロー](https://github.com/stusaurus/zurash-app/actions/workflows/pages.yml) の `deploy` ジョブで確認してください。実機iPhone Safariと人間による面白さの評価は未完了です。

## ゲームの入り口

| ページ | 内容 |
| --- | --- |
| `adventure.html` | 第1章「トリケンの家」／ステージ1〜50と修復 |
| `chapter-two.html` | 第2章「氷の向こうへ」／ステージ51〜70 |
| `duel-boss.html` | CPUとの独立対戦・3難易度（おまけ） |
| `chapter-two-review.html` | 第54・57・59・70面の比較試遊・感想記録 |
| `index.html` | 既存の2人/CPU対戦UI。第1章への入口リンクを設置済み。新しいホーム導線の再設計はベータ後に継続 |

第2章の通常進行は第1章50面のクリア後に解放されます。未解放でも、報酬に反映されない独立試遊として `chapter-two.html?trial=1` を利用できます。

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

## GitHub Pages：ベータ版のデプロイと確認

公開URLは [GitHub Pagesのデプロイ結果](https://github.com/stusaurus/zurash-app/actions/workflows/pages.yml) を正として確認してください（研究用リポジトリ `zurash-game` と区別してください）。

`scripts/build-public-site.js` は、HTML/CSSに加えて**第1章と第2章の全データ、入れ子のJavaScript、CPU Worker、家の画像素材**を含む静的サイトを `dist/` に構築します。

```sh
node --test tests/public-site-bundle.test.js
node scripts/build-public-site.js dist
```

`.github/workflows/pages.yml` はPR時に配布物を検証し、`main` へのpush時に本番へデプロイします。成功時には公開済みHTML・データ・画像をビルド成果物と照合します。PR上の静的パッケージ検証だけでは、本番公開を意味しません。

## ベータ版での確認事項と既知の制限

- 第1章50面、第2章20面、CPU対戦、ゲーム品質、スマホUI等の統合コミット `46ac76b3` は最新の10ワークフローに成功し、デザインブランチでは483件のブラウザテストが成功しています。
- 本番反映の成否は `main` のPages `deploy` ジョブと公開後の実ファイル照合で判断します。CI成功だけで公開済みと見なしません。
- iPhone実機Safariでの指操作（拡大盤面・Undo・CPU応答・セーブ復旧）は未確認です。320px/390pxの自動ブラウザ試験で代替しません。
- 第54・57・59・70面の人間による難易度・面白さの比較は継続課題です。
- `index.html` は従来の対戦画面を残しています。今後のデザイン再制作では、冒険中心のホーム導線や文字量を見直します。
- ベータ公開後もセーブデータ互換性と既存の画像アセットを維持し、変更はPR・CI・公開後検証で管理します。ロールバック対象の公開前 `main` は `040bb3fbeb95684c7d7c9edba45e8b8845a85a8d` です。

2026-11-06にプロジェクトオーナーから開発・`main`へのマージと公開判断が委任されています。重大な品質不良がある場合は、マージ・公開を保留する運用です。
