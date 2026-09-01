# Release

## Summary
GitHub Actions (`.github/workflows/release.yml`) を使ってリリースする。
`v*` 形式のタグが push されると workflow が起動し、typecheck / lint / test / build を実行したのち、
`release` Environment の Required reviewer(`@user6m`)による承認を経て `npm publish` と GitHub Release の作成を行う。

タグの push 自体は Write 権限を持つ人なら誰でも行えるが、実際に npm へ publish されるのは
`@user6m` が承認した場合のみ。

## Steps
1. `package.json` のバージョンを更新
  - ex: `v1.0.0` -> `v1.0.1`
2. リリースコミットを作成
  - ex: `chore: release v1.0.1`
3. リリースコミットをタグ付け
  - ex: `git tag -as v1.0.1 -m "release v1.0.1"`
4. タグを remote に push
  - ex: `git push origin v1.0.1`
5. GitHub Actions の `Release` workflow が起動するので、`publish` ジョブの承認待ちを確認する
6. `@user6m` が承認すると、`npm publish` と GitHub Release の作成が自動で行われる

## 事前準備(リポジトリ設定側で一度だけ必要)
- リポジトリ Settings → Environments で `release` という Environment を作成し、
  Required reviewers に `@user6m` を設定する
- リポジトリ Settings → Secrets and variables → Actions で `NPM_TOKEN` (npm の Automation トークン) を登録する