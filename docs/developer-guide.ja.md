# 開発者ガイド

リポジトリのセットアップ、テスト、リリース手順をまとめています。実装変更時は t-wada スタイルの TDD（RED-GREEN-REFACTOR）を守り、`dist/` を手で編集しないでください。

## 開発環境の準備

1. リポジトリを取得し、サブモジュールを初期化します。
   ```powershell
   git clone https://github.com/nuitsjp/swa-github-role-sync-ops.git
   cd swa-github-role-sync-ops
   git submodule update --init --recursive
   ```
2. Node.js 20 以降を用意する（両 Action 共通）。必要なら `corepack enable` で pnpm/yarn を無効化し npm を使います。
3. VS Code 拡張（ESLint, Prettier など）がある場合は自動整形を有効化しておくと差分が安定します。

## リポジトリ構成

```
swa-github-role-sync-ops/
├── .github/
│   └── workflows/           # CI・リリース・運用ワークフロー
│       ├── npm-ci.yml           # 両 Action の CI（format, lint, test, dist 検証）
│       ├── deploy-site.yml      # サンプルサイトのデプロイ
│       ├── role-sync-released.yml   # リリース版 Action によるロール同期
│       ├── release-role-sync.yml    # Role Sync Action のリリース
│       └── release-discussion-cleanup.yml  # Cleanup Action のリリース
├── actions/
│   ├── role-sync/           # swa-github-role-sync (サブモジュール)
│   └── discussion-cleanup/  # swa-github-discussion-cleanup (サブモジュール)
├── docs/
│   ├── design.md            # 設計メモ
│   ├── user-guide.md        # ユーザーガイド
│   └── developer-guide.md   # 開発者ガイド
├── site/                    # サンプル SWA サイト
│   ├── index.html
│   └── staticwebapp.config.json
└── package.json             # npm workspaces 設定
```

## ローカルでの検証

```powershell
# 依存関係のインストール
npm ci --workspaces

# 全 Action の検証（format + lint + test + dist チェック）
npm run verify

# Role Sync Action のみ検証
npm run verify:role-sync

# Discussion Cleanup のみビルド
npm run verify:discussion-cleanup
```

## Role Sync Action の開発

```
cd actions/role-sync
npm ci
npm run verify   # format + lint + test + dist チェック
npm run package  # dist を更新（リリース前に必須）
```

- 変更前にテストを先に書き、RED-GREEN-REFACTOR を一サイクルずつ回します。
- `dist/` は `npm run package` で上書きし、手編集しないでください。
- テンプレートや入力値を増やした場合は `action.yml` と README（本リポジトリ側）を揃えます。

## Discussion Cleanup Action の開発

```
cd actions/discussion-cleanup
npm ci
npm run package  # rollup build + dist 更新
```

- 現状テストは未整備のため、小さな純粋関数を意識して実装し、将来のテスト追加に備えます。
- 入力変更があれば `action.yml` と本リポジトリのドキュメントも更新します。

## テスト駆動開発

このリポジトリでは t-wada スタイルの TDD（RED-GREEN-REFACTOR）を採用しています：

1. 失敗するテストを書く（RED）
2. テストを通す最小限のコードを書く（GREEN）
3. コードをリファクタリングする（REFACTOR）

```powershell
cd actions/role-sync
npm test         # テスト実行
npm run coverage # カバレッジ計測
```

## サンプルサイトの検証

SWA へのデプロイと /.auth/me の確認は `Role Sync - Deploy Site` ワークフローで行います。GitHub UI から手動実行し、ロール反映をブラウザで確認してください。

## ワークフロー一覧

| ワークフロー | 説明 | トリガー |
|-------------|------|---------|
| `npm-ci.yml` | 両 Action の CI（format/lint/test/dist 検証） | PR, push, 手動 |
| `deploy-site.yml` | サンプルサイトを SWA へデプロイ | push (`site/`), 手動 |
| `role-sync-released.yml` | リリース版 Action でロール同期実行 | 毎週月曜 3:00 UTC, 手動 |
| `role-sync-local.yml` | ローカルビルド版でロール同期（開発用） | 手動 |
| `delete-discussions.yml` | 招待 Discussion の削除 | 手動 |
| `release-role-sync.yml` | Role Sync Action のタグ作成・リリース | 手動 |
| `release-discussion-cleanup.yml` | Cleanup Action のタグ作成・リリース | 手動 |
| `security-scans.yml` | セキュリティスキャン | スケジュール |

## コントリビュート

1. フォークしてブランチを作成
2. TDD でテストとコードを追加
3. `npm run verify` が通ることを確認
4. `dist/` を再生成（`npm run package`）してコミット
5. Pull Request を作成

## リリース手順

両 Action はサブモジュールのため、タグ付けと GitHub Release 作成は本リポジトリ側のワークフローから行います。

1. **実装とビルド**
   - Role Sync: `npm run verify` で RED/GREEN を確認し、`npm run package` の結果をコミット。
   - Discussion Cleanup: `npm run package` の結果をコミット。
2. **ワークフローを実行してタグ作成**
   - `Release Role Sync` もしくは `Release Discussion Cleanup` を手動実行。`version` 未指定なら SemVer を自動インクリメント。
   - ローリングタグ（例 `v1`）も自動で付け替えます（プレリリース除く）。
3. **結果確認**
   - Actions のジョブサマリーでタグ・リリース URL を確認。
   - 初回公開時のみ GitHub Release 画面で「Publish this action to the GitHub Marketplace」にチェックが入っているか確認。
4. **README の更新**
   - 使用例のバージョン（`@v1` / フルタグ）を更新し、互換性に応じてメジャー運用方針を記載。

### リリース前チェックリスト

- [ ] `dist/` が最新化され、コミット済み。
- [ ] `ACTIONS_RELEASE_TOKEN` が両サブモジュールに `contents:write` できる。
- [ ] `Release Role Sync` / `Release Discussion Cleanup` を実行し、サマリーのリンクを確認した。
- [ ] Marketplace 公開チェック（初回のみ）を UI で確認。
- [ ] README と docs が新バージョンに追随している。

## ドキュメント運用

- ドキュメントはこのリポジトリに集約し、サブモジュール側には置かない運用です。内容変更時は `README.md` と `docs/` を更新し、必要ならサブモジュールへコピーしてください。
- 新しい入力や挙動を追加したらユーザーガイド・設計資料も更新して整合性を保ちます。
