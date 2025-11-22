# swa-github-workflows

本リポジトリは Azure Static Web Apps (SWA) のロール同期を行う GitHub Action（[swa-github-role-sync](https://github.com/nuitsjp/swa-github-role-sync)）と、招待 Discussion を整理する補助 Action（[swa-github-discussion-cleanup](https://github.com/nuitsjp/swa-github-discussion-cleanup)）を開発・テストするためのハーネスです。両 Action はサブモジュールとして同梱され、本リポジトリ側で CI/CD、検証ワークフロー、サンプルサイトを提供します。

> **重要**
> サブモジュールは GitHub Marketplace 公開要件により `/.github/workflows` を持てないため、本リポジトリが開発者向けワークフローを肩代わりしています。ここで定義しているワークフローは再利用を目的とせず、Action を改良・検証するためのものです。

## 目的

- [swa-github-role-sync](https://github.com/nuitsjp/swa-github-role-sync) と [swa-github-discussion-cleanup](https://github.com/nuitsjp/swa-github-discussion-cleanup) の開発・検証に必要な CI/CD を別リポジトリで維持する。
- ロール同期結果を手元で確認できる SWA サンプルサイトと、/.auth/me を確認するための最小セットを提供する。
- パッケージ化やリリースフロー、依存監査など Marketplace 公開前の品質ゲートを自動化する。

## リポジトリ構成

| パス | 説明 |
| --- | --- |
| `.github/workflows/` | 開発・検証用 GitHub Actions ワークフロー群（CI、リリース補助、サイトデプロイなど） |
| `actions/role-sync/` | [nuitsjp/swa-github-role-sync](https://github.com/nuitsjp/swa-github-role-sync) サブモジュール（ロール同期 Action 本体） |
| `actions/discussion-cleanup/` | [`nuitsjp/swa-github-discussion-cleanup`](https://github.com/nuitsjp/swa-github-discussion-cleanup) サブモジュール（招待 Discussion 掃除 Action） |
| `site/` | SWA へデプロイする検証サイトと `staticwebapp.config.json` |
| `.vscode/` | 推奨エディタ設定（スペルチェック辞書） |

## 前提条件

### GitHub

- Discussion を有効化したリポジトリで運用します。`Announcements` など招待掲示用カテゴリを作成してください。
- 以下のシークレットを Organization またはリポジトリに登録します。
  - `AZURE_CLIENT_ID` / `AZURE_TENANT_ID` / `AZURE_SUBSCRIPTION_ID`：OIDC で `azure/login` を実行するサービス プリンシパル。
  - `AZURE_STATIC_WEB_APPS_API_TOKEN`：`Azure/static-web-apps-deploy@v1` で検証サイトを更新するためのトークン。
  - `ACTIONS_RELEASE_TOKEN`：`repo`、`discussions`、`read:org`を含むPAT。`nuitsjp/swa-github-role-sync`と`nuitsjp/swa-github-discussion-cleanup`の両方に書き込み権限を付けたトークンを1つ発行し、本リポジトリのシークレットとして登録します。ローカル検証ワークフローでは未設定時に`GITHUB_TOKEN`をフォールバックしますが、リリースでは必須です。
- ワークフロー全体で `discussions: write`、`id-token: write`、`contents: read` 権限が必要です。`Settings > Actions > General` で既定権限を確認してください。

### Azure

- 対象 SWA は Standard プラン以上で、GitHub 認証プロバイダーを有効化していること。
- サービス プリンシパルは対象リソース グループに対して `Contributor` 以上の権限を持っている必要があります。
- 招待メールに記載されるドメイン（例：`https://<app-name>.azurestaticapps.net`）を把握し、必要に応じて Action のテンプレート入力を調整してください。

## 提供する開発用ワークフロー

- `role-sync-npm-ci.yml`：`actions/role-sync` のフォーマット、Lint、テスト、Rollup ビルド、ライセンスチェック、CodeQL、依存監査をまとめて実行します。
- `role-sync-release.yml`：手動トリガーで SemVer タグを作成し、[`nuitsjp/swa-github-role-sync`](https://github.com/nuitsjp/swa-github-role-sync) リポジトリにタグとリリースノートを公開します。
- `role-sync-self-local.yml`：サブモジュール版の Action を直接呼び出し、ロール同期と招待 Discussion 掃除を検証するジョブです。
- `role-sync-self-released.yml`：公開済み [`nuitsjp/swa-github-role-sync@v1`](https://github.com/nuitsjp/swa-github-role-sync/tree/v1) を使った検証ジョブ。ローカル版との差分テストに利用します。
- `role-sync-deploy-site.yml`：`site/` を SWA にデプロイし、/.auth/me でロール割り当てを確認するためのサイトを公開します。
- `role-sync-delete-discussions.yml`：開発中に残った招待 Discussion を手動／一括で削除するためのワークフローです。

## 同梱アクション

- `actions/role-sync`：GitHub チーム権限（`admin` / `write`）を SWA のカスタムロールにマッピングし、`az staticwebapp users invite|update` で招待・更新します。結果は Discussion と `GITHUB_STEP_SUMMARY` に出力されます。
- `actions/discussion-cleanup`：招待 Discussion のタイトル テンプレートに基づき経過時間を判定し、期限切れまたは手動指定に応じて削除します。

## クイックスタート

1. リポジトリを取得して移動します。
    ```bash
    git clone https://github.com/nuitsjp/swa-github-workflows.git
    cd swa-github-workflows
    ```
2. サブモジュールを再帰的に初期化して取得します。
    ```bash
    git submodule update --init --recursive
    ```
3. 既存のサブモジュールを最新化します（ブランチやタグの検証時に実行）。
    ```bash
    git submodule update --remote --merge
    ```
4. GitHub Secrets を CLI でまとめて登録します（例：Organization スコープ）。`AZURE_*` と `AZURE_STATIC_WEB_APPS_API_TOKEN` は必須です。
    ```bash
    gh secret set AZURE_CLIENT_ID --body "<client-id>"
    gh secret set AZURE_TENANT_ID --body "<tenant-id>"
    gh secret set AZURE_SUBSCRIPTION_ID --body "<subscription-id>"
    gh secret set AZURE_STATIC_WEB_APPS_API_TOKEN --body "<swa-token>"
    gh secret set ACTIONS_RELEASE_TOKEN --body "<actions-release-pat>"
    ```
    `ACTIONS_RELEASE_TOKEN`は本リポジトリで管理するリリースワークフローが外部リポジトリ（`nuitsjp/swa-github-role-sync`/`nuitsjp/swa-github-discussion-cleanup`）へタグやリリースを公開する際に使用します。PATには両リポジトリへの`repo`と`discussions`権限を付与してください。ローカル検証ワークフロー（[`role-sync-self-local.yml`](.github/workflows/role-sync-self-local.yml)、[`role-sync-self-released.yml`](.github/workflows/role-sync-self-released.yml)）では未設定時に`GITHUB_TOKEN`が自動利用されますが、リリース作業を行う場合は必ず設定してください。
5. 必要に応じて `role-sync-self-*.yml` の環境変数（`SWA_NAME`、`SWA_RG`、`DISCUSSION_CATEGORY` など）を書き換え、変更をコミットします。
6. `Role Sync - Self Sync (Local Action)` を手動実行し、ロール同期と Discussion の挙動を確認します。
    ```bash
    gh workflow run "Role Sync - Self Sync (Local Action)" --ref main
    ```
7. `/site` を使って /.auth/me を確認したい場合は `Role Sync - Deploy Site` を実行し、SWA ドメインにアクセスしてロール割り当てを検証します。

## 開発メモ

- 定期運用にはリリース済み Action を利用する一方で、`role-sync-self-local.yml` で未リリースの変更を事前検証できます。
- 招待 Discussion の削除だけが目的なら `role-sync-delete-discussions.yml` を `immediate` で起動して一括削除してください。
- サブモジュール更新後は `git status` で差分を確認し、必要なら各サブモジュール側でテスト（`npm ci`, `npm run verify` など）を実行してください。

## ライセンス

本リポジトリはサブモジュールの成果物を束ねています。[swa-github-role-sync](https://github.com/nuitsjp/swa-github-role-sync) と [swa-github-discussion-cleanup](https://github.com/nuitsjp/swa-github-discussion-cleanup) はどちらも MIT License で提供されているため、詳細は各サブモジュールの `LICENSE` を参照してください。
