# Release

## Summary
GitHub Actions (`.github/workflows/release.yml`) を使ってリリースする。
`package.json` を変更する push が `main` に入ると workflow が起動し、
バージョンが実際に変わっているかを確認したうえで typecheck / lint / test / build を実行する。
その後 `release` Environment の Required reviewer(`@user6m`)による承認を経て、
タグ作成・`npm publish`・GitHub Release の作成までを自動で行う。

`main` への push(通常は PR のマージ)は Write 権限を持つ人なら誰でも行えるが、
実際に npm へ publish されるのは `@user6m` が承認した場合のみ。

## Steps
1. `package.json` のバージョンを更新
  - ex: `v1.0.0` -> `v1.0.1`
2. リリースコミットを作成
  - ex: `chore: release v1.0.1`
3. PR を作成し `main` にマージする(直接 push でも可)
4. GitHub Actions の `Release` workflow が起動するので、`publish` ジョブの承認待ちを確認する
5. `@user6m` が承認すると、タグ作成・`npm publish`・GitHub Release の作成が自動で行われる

## 事前準備(リポジトリ設定側で一度だけ必要)
- リポジトリ Settings → Environments で `release` という Environment を作成し、
  Required reviewers に `@user6m` を設定する
- リポジトリ Settings → Secrets and variables → Actions で `NPM_TOKEN` (npm の Automation トークン) を登録する