# 第2章｜iPhone試遊向け独立パッケージ

実行コマンド: `node scripts/build-chapter-two-preview.js`

このスクリプトはリポジトリのHTML/CSS、ゲーム用 `src/assets/data` だけを `preview-dist/` にコピーする。
ソースコード・第1章の家・キャラクターを変更しない。通常の `index.html` は成果物内で `legacy-duel.html` として保存し、新しい試遊用トップページから
第51面順番プレイ、第60面自由試遊、54/57/59面の評価、トリケンの家へ進める。

GitHub Actions「Chapter two preview QA」はこのパッケージを生成し、
**Chromium/WebKit × 320/390px**で、完成パッケージを別HTTPサーバーで配信して実操作試験を行った後、
`chapter-two-static-preview` のartifactとして `preview-dist/` を保存する。ソースコミットSHAと全ファイルのSHA-256台帳付き。

**これはデプロイではない。** 既存のNetlify/ChatGPTサイトを勝手に上書きしない。
配信に使う際は、`preview-dist` フォルダ内の内容を、既存とは独立したNetlifyプレビューへ設置する。
Netlifyでは `_redirects` と `_headers` を使い、拡張子なしの
`/chapter-two` にも対応する。URLを発行・確認するまでは配信済みとは報告しない。

端末内の保存は**originごとに独立**する。新しいプレビューURLへ移ると旧URLのlocalStorageは自動移行しない。
第1章・第2章の既存セーブやプレイテスト感想を消す操作は含まない。

公開品質には、本人のiPhone Safariによる実操作と、54・57・59面の面白さ評価が別途必要。
