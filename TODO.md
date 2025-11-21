# TODO

## High Priority

- [ ] `swa-github-workflows` の Secrets に `ROLE_SYNC_REPO_TOKEN`（`repo`, `discussions`）と `AZURE_CLIENT_ID` / `AZURE_TENANT_ID` / `AZURE_SUBSCRIPTION_ID` を登録し、`role-sync-sync.yml` / `role-sync-sync-package.yml` / `role-sync-delete-discussions.yml` を `workflow_dispatch` で実行確認する。
- [ ] `.github/workflows/role-sync-*.yml` の `ROLE_SYNC_REPO` を可変化し、ステージング／本番など複数リポジトリに対して再利用できるよう入力や環境変数を設計する。
- [ ] `swa-github-role-sync` / `docs/*` に残っている `uses: nuitsjp/swa-github-role-sync/cleanup-discussions@...` の記述を新リポジトリ `swa-github-discussion-cleanup` 参照へ差し替える。
- [ ] `role-sync-release.yml` のイベント設計（タグ push 連動の要否、バージョン命名規約、PAT 管理）を決定し、必要に応じて workflow を拡張する。
- [ ] リリースチェックリスト／Secrets 確認を含む PR テンプレートを作成し、レビュー体制を README へ明記する。
- [ ] Secrets 運用ドキュメントを整備し、SWA 側トークンや `ROLE_SYNC_REPO_TOKEN` 更新手順を含めて README / wiki へ掲載する。

## Follow-up

- [ ] `swa-github-discussion-cleanup` のテスト／CI ワークフローを作成し、リリースタグ運用を定義する。
- [ ] `swa-github-role-sync` / `swa-github-discussion-cleanup` を GitHub Marketplace へ公開するかどうかを決定し、必要に応じてメタデータを調整する。
- [ ] Azure Static Web Apps 側の環境設定（App Settings, デプロイトークン）を IaC 化するか検討し、手動手順の属人化を解消する。
