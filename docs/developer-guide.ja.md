# 開発者ガイド

リポジトリのセットアップ、テスト、リリース手順をまとめています。実装変更時はt-wadaスタイルのTDD（RED-GREEN-REFACTOR）を守り、`dist/`を手で編集しないでください。

## 開発環境の準備

1. リポジトリを取得し、サブモジュールを初期化します。
   ```bash
   git clone https://github.com/nuitsjp/swa-github-role-sync-ops.git
   cd swa-github-role-sync-ops
   git submodule update --init --recursive
   ```
2. Node.js 20.18.0以降を用意する（`.node-version`ファイルで指定）。必要なら`corepack enable`でpnpm/yarnを無効化しnpmを使います。
3. VS Code拡張（ESLint, Prettierなど）がある場合は自動整形を有効化しておくと差分が安定します。

### サブモジュールについて

本リポジトリは以下の2つのサブモジュールを含みます:

| サブモジュール | パス | リポジトリURL |
|--------------|------|--------------|
| swa-github-role-sync | `actions/role-sync` | https://github.com/nuitsjp/swa-github-role-sync |
| swa-github-discussion-cleanup | `actions/discussion-cleanup` | https://github.com/nuitsjp/swa-github-discussion-cleanup |

## リポジトリ構成

```
swa-github-role-sync-ops/
├── .github/
│   └── workflows/               # CI・リリース・運用ワークフロー
│       ├── npm-ci.yml               # 両Actionの CI（format, lint, test, dist検証）
│       ├── deploy-site.yml          # サンプルサイトのデプロイ
│       ├── role-sync-released.yml   # リリース版Actionによるロール同期
│       ├── role-sync-local.yml      # ローカルビルド版でロール同期（開発用）
│       ├── delete-discussions.yml   # 招待Discussionの削除
│       ├── release-role-sync.yml    # Role Sync Actionのリリース
│       ├── release-discussion-cleanup.yml  # Cleanup Actionのリリース
│       └── security-scans.yml       # セキュリティスキャン（CodeQL, ライセンス）
├── actions/
│   ├── role-sync/               # swa-github-role-sync (サブモジュール)
│   │   ├── src/                     # TypeScriptソース
│   │   ├── __tests__/               # Jestテスト
│   │   ├── dist/                    # ビルド成果物（追跡対象）
│   │   └── action.yml               # Action定義
│   └── discussion-cleanup/      # swa-github-discussion-cleanup (サブモジュール)
│       ├── src/                     # TypeScriptソース
│       ├── dist/                    # ビルド成果物（追跡対象）
│       └── action.yml               # Action定義
├── docs/
│   ├── developer-guide.ja.md    # 開発者ガイド（日本語）
│   └── developer-guide.md       # 開発者ガイド（英語）
├── site/                        # サンプルSWAサイト
│   ├── index.html
│   └── staticwebapp.config.json
└── package.json                 # npm workspaces設定
```

## ローカルでの検証

```bash
# 依存関係のインストール
npm ci --workspaces

# 全Actionの検証（format + lint + test + dist チェック）
npm run verify

# Role Sync Actionのみ検証
npm run verify:role-sync

# Discussion Cleanupのみビルド
npm run verify:discussion-cleanup
```

## Role Sync Actionの開発

```bash
cd actions/role-sync
npm ci
npm run verify   # format + lint + test + distチェック
npm run package  # distを更新（リリース前に必須）
```

### ローカル実行

`.env.example`をコピーして`.env`を作成し、必要な環境変数を設定することでローカル実行が可能です:

```bash
cp .env.example .env
# .envファイルを編集してINPUT_*変数を設定
npm run local-action
```

- 変更前にテストを先に書き、RED-GREEN-REFACTORを一サイクルずつ回します。
- `dist/`は`npm run package`で上書きし、手編集しないでください。
- テンプレートや入力値を増やした場合は`action.yml`とREADME（本リポジトリ側）を揃えます。

## Discussion Cleanup Actionの開発

```bash
cd actions/discussion-cleanup
npm ci
npm run package  # rollup build + dist更新
```

- 現状テストは未整備のため、小さな純粋関数を意識して実装し、将来のテスト追加に備えます。
- 入力変更があれば`action.yml`と本リポジトリのドキュメントも更新します。

## テスト駆動開発

このリポジトリではt-wadaスタイルのTDD（RED-GREEN-REFACTOR）を採用しています:

1. 失敗するテストを書く（RED）
2. テストを通す最小限のコードを書く（GREEN）
3. コードをリファクタリングする（REFACTOR）

```bash
cd actions/role-sync
npm test         # テスト実行
npm run coverage # カバレッジ計測（badges/coverage.svgを更新）
```

## サンプルサイトの検証

SWAへのデプロイと`/.auth/me`の確認は`Deploy Site`ワークフローで行います。`site/`配下の変更でmainブランチにpushすると自動デプロイされます。手動実行も可能です。

## ワークフロー一覧

| ワークフロー | 説明 | トリガー |
|-------------|------|---------|
| `npm-ci.yml` | 両ActionのCI（format/lint/test/dist検証、依存関係監査） | PR, push (actions/配下), 手動 |
| `deploy-site.yml` | サンプルサイトをSWAへデプロイ | push (`site/`配下), 手動 |
| `role-sync-released.yml` | リリース版Actionでロール同期実行 | 毎週月曜3:00 UTC, 手動 |
| `role-sync-local.yml` | ローカルビルド版でロール同期（開発用） | 毎週月曜3:00 UTC, 手動 |
| `delete-discussions.yml` | 招待Discussionの削除（即時削除モード） | 手動 |
| `release-role-sync.yml` | Role Sync Actionのタグ作成・リリース | 手動 |
| `release-discussion-cleanup.yml` | Cleanup Actionのタグ作成・リリース | 手動 |
| `security-scans.yml` | CodeQL解析・ライセンスチェック | PR, push (src/配下), 毎週水曜7:31 UTC, 手動 |

## 必要なSecrets

| Secret名 | 用途 | 対象ワークフロー |
|----------|------|----------------|
| `AZURE_CLIENT_ID` | Azure OIDC認証 | role-sync-released, role-sync-local |
| `AZURE_TENANT_ID` | Azure OIDC認証 | role-sync-released, role-sync-local |
| `AZURE_SUBSCRIPTION_ID` | Azure OIDC認証 | role-sync-released, role-sync-local |
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | SWAデプロイトークン | deploy-site |
| `ACTIONS_RELEASE_TOKEN` | サブモジュールへのリリース権限（contents:write） | release-* |
| `ROLE_SYNC_APP_ID` | GitHub App ID | role-sync-released, role-sync-local |
| `ROLE_SYNC_APP_PRIVATE_KEY` | GitHub App秘密鍵 | role-sync-released, role-sync-local |
| `ROLE_SYNC_REPO_TOKEN` | サブモジュールへのpush権限（ライセンス更新用） | security-scans |

## コントリビュート

1. フォークしてブランチを作成
2. TDDでテストとコードを追加
3. `npm run verify`が通ることを確認
4. `dist/`を再生成（`npm run package`）してコミット
5. Pull Requestを作成

## リリース手順

両ActionはサブモジュールのためタグとGitHub Releaseは本リポジトリ側のワークフローから作成します。

1. **実装とビルド**
   - Role Sync: `npm run verify`でRED/GREENを確認し、`npm run package`の結果をコミット。
   - Discussion Cleanup: `npm run package`の結果をコミット。
2. **ワークフローを実行してタグ作成**
   - `Release Role Sync`もしくは`Release Discussion Cleanup`を手動実行。`version`未指定ならSemVerを自動インクリメント。
   - ローリングタグ（例`v1`）も自動で付け替えます（プレリリース除く）。
3. **結果確認**
   - Actionsのジョブサマリーでタグ・リリースURLを確認。
   - 初回公開時のみGitHub Release画面で「Publish this action to the GitHub Marketplace」にチェックが入っているか確認。
4. **READMEの更新**
   - 使用例のバージョン（`@v1` / フルタグ）を更新し、互換性に応じてメジャー運用方針を記載。

### リリース前チェックリスト

- [ ] `dist/`が最新化され、コミット済み。
- [ ] `ACTIONS_RELEASE_TOKEN`が両サブモジュールに`contents:write`できる。
- [ ] `Release Role Sync` / `Release Discussion Cleanup`を実行し、サマリーのリンクを確認した。
- [ ] Marketplace公開チェック（初回のみ）をUIで確認。
- [ ] READMEとdocsが新バージョンに追随している。

## ドキュメント運用

- ドキュメントはこのリポジトリに集約し、サブモジュール側には置かない運用です。内容変更時は`README.md`と`docs/`を更新し、必要ならサブモジュールへコピーしてください。
- 新しい入力や挙動を追加したらユーザーガイド・設計資料も更新して整合性を保ちます。
- 日本語ドキュメントでは、日本語と英数字・記号の間にスペースを入れないでください（例: `SWAカスタムロール`）。
