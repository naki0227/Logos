# 🗣️ Logos (ロゴス)

**Order from Chaos. Structure your Thoughts.**

## 📖 概要 (Overview)
**Logos** は、脳内の断片的なメモや散らかった思考を、論理的な構造を持った成果物（プレゼンテーションスライド）に変える思考整理AIプロダクトです。
LLMの推論能力を活用し、単なるテキスト生成ではなく、**「構造化」「視覚化」「共有」** までをワンストップで実現します。

![Logos Presentation Mode](https://placehold.co/800x450/indigo/white?text=Logos+Presentation)

## 🚀 主な機能 (Key Features)

### 1. AI Slide Generation
チャット形式で思考を投げかけるだけで、AIがプレゼンテーションの構成を提案し、スライドを自動生成します。
- **Core Technology**: Vercel AI SDK (Google Gemini)
- **Features**: タイトル、メインゴール、各スライドのコンテンツ作成

### 2. Live Customization
プレゼンテーションのデザインをリアルタイムにカスタマイズできます。
- **Theme Customizer**: ブランドカラーや好みに合わせて、独自のカラーパレットを作成・保存可能。
- **Font Selection**: Google Fontsから雰囲気に合ったフォントを選択可能。
- **Inline Editing**: スライド上のテキストをクリックするだけで直接編集可能。

### 3. AI Image Generation
視覚的なインパクトを与える画像を、スライドの内容に基づいてAIが自動生成します。
- **Technology**: Pollinations.ai (Stable Diffusion)
- **Workflow**: スライドカード上のボタンをクリックするだけで、文脈に合った画像を生成・挿入。

### 4. Serverless Sharing
作成したプレゼンテーションを、URLひとつで即座に共有できます。
- **Mechanism**: `lz-string` を使用してプレゼンデータを圧縮・URLエンコードするため、データベース不要で永続的な共有が可能。
- **Read-only Mode**: URLを受け取った相手は、ログイン不要でプレゼンを閲覧・再生可能。

### 5. Export Options
実務での利用を想定し、汎用的なフォーマットへの書き出しをサポートしています。
- **PPTX**: PowerPoint形式でダウンロードし、PowerPointやGoogle Slidesで微調整が可能。
- **PDF**: 配布資料として最適なPDF形式での保存。

### 6. Templates
目的別のテンプレートから素早くプレゼン作成を開始できます。
- Startup Pitch Deck
- Quarterly Business Review
- Educational Lecture etc.

## 🛠 技術スタック (Tech Stack)

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animation**: [Framer Motion](https://www.framer.com/motion/)
- **AI**: [Vercel AI SDK](https://sdk.vercel.ai/docs), [Google Gemini](https://deepmind.google/technologies/gemini/)
- **Image Gen**: [Pollinations.ai](https://pollinations.ai/)
- **PDF/PPTX**: `jspdf`, `pptxgenjs`
- **Sharing**: `lz-string`

## 🏁 始め方 (Getting Started)

### 1. Clone the repository
```bash
git clone https://github.com/naki0227/Logos.git
cd Logos
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up Environment Variables
Create a `.env.local` file in the root directory and add your Google Gemini API Key.
```bash
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
```

### 4. Run the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🤝 Contribution
Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License
This project is licensed under the MIT License.
