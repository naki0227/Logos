import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { prompt } = await req.json();

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        // Enhance prompt for better results
        const enhancedPrompt = encodeURIComponent(`${prompt}, minimalistic vector art, corporate memphis style, trending on dribbble, white background, high quality, 8k`);

        // Pollinations.ai URL
        const imageUrl = `https://image.pollinations.ai/prompt/${enhancedPrompt}?width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 10000)}`;

        // Since Pollinations returns the image directly, we can just return the URL.
        // If we needed to proxy (to avoid CORS or rate limits on client), we would fetch here.
        // Pollinations is generally CORS friendly.

        return NextResponse.json({ imageUrl });
    } catch (error) {
        console.error('Image generation error:', error);
        return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 });
    }
}
