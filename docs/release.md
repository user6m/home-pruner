# Release

## Summary
現在は特定のリリース用のパッケージを用いずにリリースすることを想定。
開発者も増やすことは考えてないので、npm に publish できるのは `@user6m` のみ。

## Steps
1. `package.json` のバージョンを更新
  - ex: `v1.0.0` -> `v1.0.1`
2. リリースコミットを作成
  - ex: `chore: release v1.0.1`
3. リリースコミットをタグ付け
  - ex: `git tag -as v1.0.1 -m "releae v1.0.1"`
4. タグを remote に push
  - ex: `git push origin v1.0.1`
5. github GUI で release を作成
6. `npm publish` を実行