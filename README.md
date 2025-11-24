# swa-github-workflows

Azure Static Web Apps (SWA) のロール同期と招待 Discussion 掃除を行う 2 つの GitHub Actions をまとめたハーネスです。利用者は本リポジトリの README と `docs/` だけを見れば、サブモジュール側のドキュメントなしで使い始められます。

- `nuitsjp/swa-github-role-sync`：GitHub リポジトリの `admin` / `write` 権限を SWA カスタムロールへ同期し、招待リンクを Discussion で通知
- `nuitsjp/swa-github-discussion-cleanup`：期限切れになった招待 Discussion を削除

## クイックスタート（Actions を使う）

1. **前提を満たす**  
   - SWA が Standard 以上で GitHub 認証を有効化済み  
   - リポジトリで Discussions を有効化し、招待用カテゴリー（例: `Announcements`）を用意  
   - GitHub App（`Administration: read`, `Discussions: read&write`, 必要に応じて `Members: read`）を作成し、`ROLE_SYNC_APP_ID` と `ROLE_SYNC_APP_PRIVATE_KEY` をシークレットに登録  
   - Azure OIDC 用に `AZURE_CLIENT_ID` / `AZURE_TENANT_ID` / `AZURE_SUBSCRIPTION_ID` をシークレット化
2. **シークレットを CLI で登録**
   ```powershell
   gh secret set ROLE_SYNC_APP_ID --body "123456"
   gh secret set ROLE_SYNC_APP_PRIVATE_KEY < role-sync-app.private-key.pem
   gh secret set AZURE_CLIENT_ID --body "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
   gh secret set AZURE_TENANT_ID --body "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
   gh secret set AZURE_SUBSCRIPTION_ID --body "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
   ```
3. **ロール同期ワークフローを追加**（必要に応じて `swa-name` / `swa-resource-group` / `discussion-category-name` を変更）
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
4. **招待 Discussion の掃除を追加（任意）**
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

詳細な CLI 手順やトラブルシューティングは `docs/user-guide.md` を参照してください。

## リポジトリ構成

| パス | 説明 |
| --- | --- |
| `actions/role-sync/` | ロール同期 Action のサブモジュール |
| `actions/discussion-cleanup/` | Discussion 掃除 Action のサブモジュール |
| `site/` | SWA にデプロイする検証用サイトと `staticwebapp.config.json` |
| `.github/workflows/` | CI、リリース補助、自己検証用ワークフロー |
| `docs/` | 利用者ガイド、開発者ガイド、設計資料 |

## 開発・検証の入り口

- ローカルでの検証やリリース手順は `docs/developer-guide.md` を参照
- アーキテクチャやフローの概要は `docs/design.md` を参照

## ライセンス

MIT License。サブモジュールのライセンスも MIT です。
