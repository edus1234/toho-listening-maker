# リスニングテスト自動作成システム v2.4 - テスト概要

## 📅 リリース情報
- **バージョン**: v2.4
- **リリース日**: 2025-11-12
- **コミット**: 8f13cb0, 89ddace
- **デプロイ状況**: ✅ 本番環境デプロイ済み

## 🌐 アクセスURL

### 本番環境
- **メインドメイン**: https://toho-listening-maker.pages.dev
- **最新デプロイ**: https://c607bcb1.toho-listening-maker.pages.dev
- **APIヘルスチェック**: https://toho-listening-maker.pages.dev/api/health

### 開発環境
- **サンドボックス**: https://3000-ig5yq671gzgh8b7xu04ha-b237eb32.sandbox.novita.ai

## 🎉 v2.4 新機能

### 1. 「ブランクを反映」ボタン 🆕
**機能概要**:
- ブランク秒数を変更した際、ワンクリックで全てのブランクを再生成
- 変更の意図を明確にし、誤操作を防止

**実装詳細**:
- **フロントエンド** (`/home/user/webapp/public/static/app.js`, Line ~2875-2917):
  - ブランク秒数入力時は `segment._modified = true` でマーク
  - 「ブランクを反映」ボタンクリックで全ブランクセグメントを再生成
  - `/api/generate-silence` を呼び出して新しいサイレンス音声を取得
  
**テスト手順**:
1. 音声生成後、ブランクブロックの秒数を変更（例: 0.5秒 → 2秒）
2. 「ブランクを反映（変更を適用）」ボタンをクリック
3. 「ブランクの反映が完了しました」アラート表示を確認
4. 再生して、変更が反映されていることを確認
5. MP3ダウンロードして、変更が反映されていることを確認

**期待される動作**:
- ✅ ブランク秒数変更が即座に全てのブランクブロックに反映
- ✅ 変更後の再生で正しい秒数のブランクが挿入される
- ✅ ダウンロードしたMP3ファイルにも正しく反映される

### 2. デフォルト0.5秒ブランク 🆕
**機能概要**:
- セリフ（対話）間に自動的に0.5秒のブランクを挿入
- ナレーション・質問・選択肢には自動挿入なし
- pauseAfter=0の場合のみ適用

**実装詳細**:
- **バックエンド** (`/home/user/webapp/src/index.tsx`, Line ~1248-1266):
  ```typescript
  // Add default 0.5s silence after dialogue segments (not narration/question/option)
  const shouldAddDefaultBlank = (line.type === 'dialogue' || !line.type) && pauseAfter === 0
  const finalPauseAfter = shouldAddDefaultBlank ? 0.5 : pauseAfter

  if (finalPauseAfter > 0) {
    const silenceBase64 = getSilenceBase64(finalPauseAfter)
    if (silenceBase64) {
      console.log(`⏸️ Adding ${finalPauseAfter}s silence after segment${shouldAddDefaultBlank ? ' (default)' : ''}`)
      audioSegments.push({
        speaker: 'Silence',
        audio: silenceBase64,
        pauseAfter: finalPauseAfter,
        duration: finalPauseAfter,
        type: 'silence',
        text: `[Silence: ${finalPauseAfter}s]`
      })
    }
  }
  ```

**テスト手順**:
1. 新しいリスニングテストを作成（ダイアローグ形式）
2. 音声設定画面で、セリフのブランク時間を0秒のままにする
3. 音声を生成
4. セグメント一覧を確認 → 各セリフの後に「⏸️ ブランク（間隔）0.5s」が自動挿入されていることを確認
5. 再生して、セリフ間に0.5秒の間隔があることを確認

**期待される動作**:
- ✅ pauseAfter=0のセリフの後に自動的に0.5秒のブランクが挿入される
- ✅ ナレーション、質問、選択肢には自動挿入されない
- ✅ pauseAfter > 0 のセリフには影響しない（ユーザー設定が優先）

### 3. 日本語なまり英語アクセント 🆕
**機能概要**:
- アクセント選択に「日本語なまり英語」を追加
- 英語テキストを日本語アクセントで発音
- 話者設定とナレーター設定の両方で選択可能

**実装詳細**:
- **バックエンド** (`/home/user/webapp/src/index.tsx`, Line ~906-930):
  ```typescript
  'Japanese': {
    'male': {
      'neutral': { languageCode: 'ja-JP', standard: 'ja-JP-Standard-D', ssml: 'ja-JP-Wavenet-D' },
      'warm': { languageCode: 'ja-JP', standard: 'ja-JP-Standard-C', ssml: 'ja-JP-Wavenet-C' },
      'calm': { languageCode: 'ja-JP', standard: 'ja-JP-Standard-D', ssml: 'ja-JP-Wavenet-D' }
    },
    'female': {
      'neutral': { languageCode: 'ja-JP', standard: 'ja-JP-Standard-A', ssml: 'ja-JP-Wavenet-A' },
      'warm': { languageCode: 'ja-JP', standard: 'ja-JP-Standard-B', ssml: 'ja-JP-Wavenet-B' },
      'calm': { languageCode: 'ja-JP', standard: 'ja-JP-Standard-A', ssml: 'ja-JP-Wavenet-A' }
    }
  }
  ```

- **フロントエンド** (`/home/user/webapp/public/static/app.js`):
  - Line ~327: `nationalityOptions` 配列に追加
  - Line ~1454: 話者アクセント選択に追加
  - Line ~1504: ナレーターアクセント選択に追加

**テスト手順**:
1. 新しいリスニングテストを作成
2. 音声設定画面で、話者のアクセントを「日本語なまり英語」に変更
3. 音声を生成
4. 再生して、英語テキストが日本語アクセントで発音されていることを確認
5. ナレーター設定でも「日本語なまり英語」が選択できることを確認

**期待される動作**:
- ✅ アクセント選択に「日本語なまり英語」オプションが表示される
- ✅ 英語テキストが日本語アクセントで発音される
- ✅ 男性・女性の両方で選択可能
- ✅ 声質（neutral/warm/calm）も選択可能

## 🧪 総合テストチェックリスト

### 基本フロー
- [ ] ログイン (toho/toho)
- [ ] 新規作成メニュー選択
- [ ] スクリプト条件入力（ダイアローグ、2人、トピック入力）
- [ ] 音声設定画面で各機能を確認
- [ ] 音声生成
- [ ] 再生確認
- [ ] ダウンロード確認
- [ ] フォルダに保存

### 新機能テスト
#### 1. ブランクを反映ボタン
- [ ] ブランク秒数を変更
- [ ] 「ブランクを反映」ボタンクリック
- [ ] アラート表示確認
- [ ] 再生で変更反映を確認
- [ ] ダウンロードで変更反映を確認

#### 2. デフォルト0.5秒ブランク
- [ ] セリフのpauseAfter=0で音声生成
- [ ] セグメント一覧に0.5秒ブランク自動挿入を確認
- [ ] 再生で0.5秒の間隔を確認
- [ ] ナレーション・質問には自動挿入されないことを確認

#### 3. 日本語なまり英語
- [ ] アクセント選択に「日本語なまり英語」が表示
- [ ] 話者設定で選択可能
- [ ] ナレーター設定で選択可能
- [ ] 音声生成後、日本語アクセントで発音されることを確認
- [ ] 男性・女性の両方で動作確認

### 既存機能の回帰テスト
- [ ] ブランク入力マッピング（displayIndex使用）
- [ ] Web Audio APIによるMP3デコード・結合
- [ ] WAV形式でのダウンロード
- [ ] フォルダ管理機能
- [ ] QRコード生成
- [ ] テスト保存・読み込み

## 📊 技術詳細

### アーキテクチャ
- **音声ブロック**: 実際の音声セグメント（発言、ナレーション、質問等）
- **ブランクブロック**: サイレンス音声（CBR MP3、ID3/VBRヘッダなし）
- **デフォルトブランク**: pauseAfter=0の対話セグメントに自動挿入される0.5秒のブランク
- **Apply Blanks**: ユーザーがブランク秒数を変更した場合の一括反映機能

### データフロー
1. **音声生成時**:
   - バックエンドがセリフを解析
   - pauseAfter=0の対話セグメントに0.5秒のデフォルトブランク挿入
   - 音声ブロックとブランクブロックを分離して返す

2. **ブランク変更時**:
   - ユーザーがブランク秒数を変更
   - `segment._modified = true` でマーク
   - 「ブランクを反映」ボタンで全ブランクを再生成

3. **ダウンロード時**:
   - 音声ブロックのみをバックエンドに送信
   - `/api/merge-audio` で音声+ブランクを統合
   - Web Audio APIでデコード・結合
   - WAV形式でエクスポート

## 🎯 既知の問題と制限事項

### 制限事項
1. **ブランク秒数の範囲**: 0.5〜10秒（Google TTSの制限）
2. **日本語なまり英語**: 日本語TTSを使用するため、完璧な英語発音ではない
3. **デフォルトブランク**: 対話セグメントのみ（ナレーション・質問・選択肢には適用されない）

### 改善予定
- [ ] カスタムブランク秒数（0.1秒単位）
- [ ] ブランクプリセット（短い/標準/長い）
- [ ] ブランク自動調整（セリフの長さに応じて）

## 📝 デプロイメント情報

### ビルド情報
```bash
npm run build
# vite v5.4.21 building SSR bundle for production...
# dist/_worker.js  100.61 kB
# ✓ built in 474ms
```

### デプロイコマンド
```bash
npx wrangler pages deploy dist --project-name toho-listening-maker
# ✨ Deployment complete! 
# https://c607bcb1.toho-listening-maker.pages.dev
```

### データベース
- **D1データベース**: toho-listening-db
- **データベースID**: dd170a52-e43d-4813-8ebf-a428b1d8febb
- **マイグレーション**: 適用済み
- **初期ユーザー**: toho/toho (SHA-256)

## 🔐 認証情報

### ログイン
- **ユーザー名**: toho
- **パスワード**: toho
- **パスワードハッシュ**: SHA-256

### API Keys
- **OpenAI API**: 設定済み（.dev.vars, Cloudflare Secrets）
- **Google TTS API**: 設定済み（.dev.vars, Cloudflare Secrets）

## 📞 サポート

問題が発生した場合:
1. ブラウザの開発者ツールでコンソールエラーを確認
2. PM2ログを確認: `pm2 logs webapp --nostream`
3. APIヘルスチェック: https://toho-listening-maker.pages.dev/api/health

---

**最終更新**: 2025-11-12  
**バージョン**: v2.4  
**コミット**: 8f13cb0, 89ddace  
**デプロイ**: ✅ 本番環境稼働中
