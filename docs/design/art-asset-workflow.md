# 美術素材の登録・採用フロー

**保存先:** `stusaurus/zurash-app`。元の `zurash-game` は触らない。美術専用ブランチと Draft PR に保存し、main / 本番には直接反映しない。

## フォルダ構成
```text
assets/house/
  exterior/
    door/
      manifest.json
      prototypes/     # 未承認・仮切り抜き（バイナリは別途登録）
      approved/       # 目視・寸法・差し替え検証に合格した素材のみ
  entry/
  living/
  kitchen/
  bedroom/
  garden/
docs/design/
  house-art-bible.md
  art-asset-workflow.md
  house-art-registry.csv
```

## 1アイテム当たりの必要状態
修復前 ×1、修復後A/B/C ×3。別々の透過RGBA画像。さらに修復状態によって必要なら建設中の演出素材。各ファイルは固有ID、ステータス、配置基準、解像度、SHA-256をmanifestで管理する。

## デザイン/素材の承認
- **concept:** 世界観・構造の参考。完成画像はゲーム部材とは限らない。
- **prototype-cutout:** 切り出せているが、パース・アルファ端・光などの検証前。**ゲーム本番で使わない**。
- **production-approved:** 4状態の角度・大きさ・影・輪郭・画質・同位置差し替えの品質を実際のシーンで確認済み。
- **integrated:** 承認素材を使ったUI/アニメーションがiPhoneで検証済み。

ファイル変更は新バージョンを追加し、旧版を突然置き換えない。報告ではデザイン方向の承認と画像の品質承認を混同しない。

## 転送・検証
1. 作成元画像と切り抜き4枚を参照し、透過PNGを個別に登録する。
2. `sha256sum` 等で元ファイルとGit上のファイルの SHA-256 一致を確認する。
3. サイズ、透過、アンカー、外観・玄関の同位置表示を確認する。
4. `manifest.json` の `present_in_git` を **実際にバイナリを確認した後だけ** true にする。
5. 修復前/後3案、320/390px、iPhone Safari、保存・再開、既存ゲームを確認する。

## 今回の進捗
現在は玄関扉4種類の **台帳と仕様を先に作成**。元画像はチャットで作成された `zurash_front_doors_prototype_v01.zip`。バイナリのGit登録と画像採用は別の作業であり、`present_in_git:false` とする。画像ファイルが実際に登録されるまで「GitHubに4画像を保存済み」と報告しない。

このブランチは PR #5 のシーン構造を基点としている。50面の盤面データ、修復・支出・保存には変更を加えない。
