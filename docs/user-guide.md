# ユーザーガイド

Azure Static Web Apps (SWA) のロール同期と招待 Discussion 掃除を GitHub Actions で行うための手順を、CLI ベースでまとめました。ワークフロー例は必要最低限の入力だけを指定しています。テンプレートやロール名を変える場合は「追加設定」を参照してください。

## 前提条件

- 対象 SWA が Standard 以上で、GitHub 認証プロバイダーを有効化済み。
- 対象リポジトリで Discussions を有効化し、招待通知を投稿するカテゴリーを用意しておく（例: `Announcements`）。
- GitHub App を作成済み（`Administration: read`, `Discussions: read & write`、必要に応じて `Members: read`）。App ID と private key を控えておく。
- 実行するワークフローが `contents: read` / `discussions: write` / `id-token: write` 権限を持つよう `permissions` を設定できること。

### Secrets を CLI で登録

GitHub App で取得した ID / private key と Azure OIDC の値を登録します。

```powershell
gh secret set ROLE_SYNC_APP_ID --body "123456"
gh secret set ROLE_SYNC_APP_PRIVATE_KEY < role-sync-app.private-key.pem
gh secret set AZURE_CLIENT_ID --body "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
gh secret set AZURE_TENANT_ID --body "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
gh secret set AZURE_SUBSCRIPTION_ID --body "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

Organization Secret にする場合は `--org <ORG>` を付け、必要なら公開範囲を `--repos` で絞ってください。

### GitHub App の作成メモ（UI 操作）

1. GitHub の「Developer settings > GitHub Apps」から「New GitHub App」を作成。
2. **Repository permissions** で `Administration (Read-only)` と `Discussions (Read & write)` を付与。Organization メンバー情報を使う場合は **Organization permissions** で `Members (Read-only)` を付与。
3. 対象 Organization / リポジトリに App をインストールし、App ID と Private key (`.pem`) を取得して Secrets に登録。

## セットアップ手順

### 1. ロール同期ワークフローを追加

`.github/workflows/role-sync.yml` を作成します。`swa-name`・`swa-resource-group`・`discussion-category-name` を環境に合わせて変更してください。

```yaml
name: Sync SWA roles

on:
  workflow_dispatch:
  schedule:
    - cron: '0 3 * * 1'

jobs:
  sync:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      discussions: write
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: azure/login@v2
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
      - name: Sync SWA role assignments
        uses: nuitsjp/swa-github-role-sync@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          swa-name: my-swa-app
          swa-resource-group: my-swa-rg
          discussion-category-name: Announcements
```

CLI で手動実行する場合:

```powershell
gh workflow run role-sync.yml --ref main
gh run watch --exit-status
```

### 2. 招待 Discussion の掃除ワークフローを追加（任意）

`cleanup-mode` を `immediate` にすると手動実行時に即時削除されます。定期実行時は `expiration` を維持するのが安全です。

```yaml
name: Cleanup invite discussions
on:
  schedule:
    - cron: '0 4 * * 1'
  workflow_dispatch:

jobs:
  cleanup:
    runs-on: ubuntu-latest
    permissions:
      discussions: write
    steps:
      - uses: nuitsjp/swa-github-discussion-cleanup@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          discussion-category-name: Announcements
          expiration-hours: 168
          cleanup-mode: ${{ github.event_name == 'workflow_dispatch' && 'immediate' || 'expiration' }}
```

CLI で手動実行する場合:

```powershell
gh workflow run cleanup-invite-discussions.yml --ref main
gh run watch --exit-status
```

### 3. 結果を確認

- `GITHUB_STEP_SUMMARY` に招待件数・更新件数が表示されます。GitHub Web UI か `gh run view --log` で確認できます。
- 招待 Discussion が指定カテゴリーに作成され、本文に招待 URL が含まれます。
- 掃除ワークフローは削除した件数を出力します。

## 追加設定

- **別リポジトリの権限で同期する**  
  `target-repo` に `owner/repo` を指定し、`github-token` に対象リポジトリへアクセスできる PAT を渡します。
- **ロール名・テンプレートを変更する**  
  - GitHub `admin` に付与するロール: `role-for-admin`（既定: `github-admin`）  
  - GitHub `write`/`maintain` に付与するロール: `role-for-write`（既定: `github-writer`）  
  - テンプレートは `{login}` `{role}` `{inviteUrl}` `{swaName}` `{repo}` `{date}` などのプレースホルダーを利用可能。Discussion 掃除側も同じテンプレートを設定してください。
- **招待リンクの有効期限**  
  `invitation-expiration-hours`（既定 168 時間）を変更すると、掃除ワークフローの `expiration-hours` も合わせる必要があります。
- **カスタムドメインを使う**  
  `swa-domain` に `https://example.com` のようなドメインを指定すると招待 URL がそのドメインで生成されます。

## トラブルシューティング

- `Discussion category "..." not found`：カテゴリー名の誤り、または Discussions が無効です。設定を確認してください。
- `Resource not accessible by integration`：`github-token` の権限不足です。`permissions` ブロックとトークンスコープを確認してください。
- 招待が 0 件で終了する：既に同期済みの場合は何も変更せず終了します。`role-prefix` が異なると差分対象外になる点に注意してください。
