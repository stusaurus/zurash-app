# トリケンの家｜玄関ドア4種類 v0.3

**状態：改良試作品。正式採用・ゲームへの差し替えは未実施。**

修復前1枚、修復後3枚。すべて同じ原画から切り抜いた正面画角、320×400 RGBA PNG。足元 y=370、中央 x=160 に統一。

| 種類 | 予定ファイル | GitHub画像本体 |
| --- | --- | --- |
| before | prototypes/door_before_03.png | 未登録 |
| natural | prototypes/door_natural_03.png | 未登録 |
| iceblue | prototypes/door_iceblue_03.png | 未登録 |
| crystal | prototypes/door_crystal_03.png | 未登録 |

元のZIP：zurash_front_doors_refined_v03.zip（ChatGPT会話で生成した素材）。このPRには台帳と取込プログラムのみ登録済みで、PNG本体はまだ含まれない。

## バイナリ取込方法
WorkなどZIPにアクセスできる環境で、リポジトリのルートからコマンドを実行する。

1. python scripts/import_door_prototypes.py /path/to/zurash_front_doors_refined_v03.zip --dry-run
2. 4ファイルのSHA256とサイズが一致することを確認。
3. --dry-run を外して実行、画像とmanifestの更新をこの専用ブランチにコミット。

正式採用する前に、現在の外観と玄関の両側で位置・パース・透過境界・解像度をチェックする。
PR #5の正式SVGドアは採用承認までそのまま残す。
