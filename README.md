# IZM Linux Dojo

ターミナルで Linux コマンドを学ぶ Web 学習サイトです。[IZM Python 道場](https://github.com/daixque/izm-python-dojo) と同じ静的サイト + YAML ビルド構成を採用しています。

## 特徴

- ブラウザ内シェルシミュレータ（仮想ファイルシステム + コマンドパーサー）
- xterm.js によるターミナル UI
- YAML でレッスンコンテンツを管理（ja/en 対応）
- GitHub Pages で静的配信

## ディレクトリ構成

```
lessons_data/{chapter}/{lesson}/   # レッスンソース（YAML）
templates/                         # Jinja2 テンプレート
docs/                              # ビルド出力（GitHub Pages ルート）
build.py                           # ビルドスクリプト
```

## セットアップ

```bash
pip install -r requirements.txt
python build.py
cd docs && python3 -m http.server 8080
```

ブラウザで http://localhost:8080 を開きます。

## ビルド

```bash
python build.py                              # 全レッスン
python build.py 01_dir_and_file/01_ls_cd     # 特定レッスン
python build.py 01_dir_and_file              # 章単位
python build.py --clean                      # クリーンビルド
```

## テスト

```bash
pip install pytest pytest-playwright
playwright install chromium
python test.py
```

## レッスン追加

1. `lessons_data/{chapter}/{lesson}/` に YAML を配置
2. `chapters_data/chapters.ja.yaml` に章定義を追加（新章の場合）
3. `python build.py` で HTML を生成

## ライセンス

MIT
