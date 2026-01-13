# 🗣️ Logos

<p align="center">
  <b>"Order from Chaos. Structure your Thoughts."</b><br>
  AI tool that transforms scattered thoughts into structured presentations
</p>

![Logos Presentation Mode](https://placehold.co/800x450/indigo/white?text=Logos+Presentation)

---

[🇯🇵 Japanese (日本語)](README.ja.md)

## 📖 Overview

**Logos** is a thought-organizing AI product that turns fragmented notes and cluttered thoughts in your brain into logical, structured deliverables (presentation slides).
Leveraging the reasoning capabilities of LLMs, it realizes **"Structuring"**, **"Visualization"**, and **"Sharing"** in one stop, rather than just text generation.

## 🚀 Key Features

### 1. AI Slide Generation
Just throw your thoughts in a chat, and the AI proposes the structure and generates slides automatically.
- **Core Technology**: Vercel AI SDK (Google Gemini)
- **Features**: Titles, Main Goals, Content creation for each slide.

### 2. Live Customization
Customize the presentation design in real-time.
- **Theme Customizer**: Create and save unique color palettes to match brand colors.
- **Font Selection**: Select fonts from Google Fonts.
- **Inline Editing**: Edit text directly on the slide.

### 3. AI Image Generation
Automatically generate impactful images based on slide content.
- **Technology**: Pollinations.ai (Stable Diffusion)
- **Workflow**: Click a button to generate and insert context-aware images.

### 4. Serverless Sharing
Share created presentations instantly via URL.
- **Mechanism**: Uses `lz-string` to compress and URL-encode presentation data, allowing persistent sharing without a database.
- **Read-only Mode**: Recipients can view and play the presentation without login.

### 5. Export Options
Supports export to common formats for practical use.
- **PPTX**: Download in PowerPoint format for fine-tuning.
- **PDF**: Save as PDF for handouts.

### 6. Templates
Start quickly with purpose-built templates.
- Startup Pitch Deck
- Quarterly Business Review
- Educational Lecture etc.

## 🛠 Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animation**: [Framer Motion](https://www.framer.com/motion/)
- **AI**: [Vercel AI SDK](https://sdk.vercel.ai/docs), [Google Gemini](https://deepmind.google/technologies/gemini/)
- **Image Gen**: [Pollinations.ai](https://pollinations.ai/)
- **PDF/PPTX**: `jspdf`, `pptxgenjs`
- **Sharing**: `lz-string`

## 🏁 Getting Started

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
