# Brain Rot Games

よく見るけど実際には遊べない広告ゲーム風のミニゲームを、普通に遊べる形で実装していくためのリポジトリです。

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Routing

GitHub Pages 上では次のようなパスでゲームを切り替えます。

- `/brain-rot-games/` — ゲーム一覧
- `/brain-rot-games/gate-rush` — サンプルゲーム

ルーティングライブラリはまだ入れていません。`window.location.pathname` を直接読んで、`src/games/registry.tsx` の `id` と照合しています。

## Add a new game

1. `src/games/<category>/<GameName>.tsx` にゲームコンポーネントを追加する
2. `src/games/registry.tsx` に `id`, `title`, `description`, `component` を登録する
3. `/brain-rot-games/<id>` で開く

最初のサンプルとして `gate-rush` を入れています。これは広告でよく見る数字ゲート型ランナーゲームの最小実装です。

## Deploy

`main` に push されると `.github/workflows/deploy.yml` が走り、Vite の `dist` を GitHub Pages にデプロイします。

GitHub Pages の設定で Source が **GitHub Actions** になっていない場合は、Repository Settings → Pages で変更してください。
