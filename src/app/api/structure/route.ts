import { google } from '@ai-sdk/google';
import { streamObject } from 'ai';
import { z } from 'zod';

export const maxDuration = 60;

// Schema for slide structure
const slideSchema = z.object({
    title: z.string().describe('The title of the presentation'),
    mainGoal: z.string().describe('The main goal or message of the presentation'),
    slides: z.array(
        z.object({
            id: z.string().describe('Unique identifier for the slide'),
            title: z.string().describe('Slide title'),
            layout: z.enum(['title', 'bullets', 'image_left', 'image_right', 'center']).describe('Suggested layout'),
            content: z.array(z.string()).describe('Bullet points or text content'),
            speakerNotes: z.string().describe('Notes for the speaker'),
        })
    ).describe('List of slides'),
});

export async function POST(req: Request) {
    const { prompt } = await req.json();

    const result = await streamObject({
        model: google('gemini-2.5-flash'),
        schema: slideSchema,
        prompt: `
      You are 'Logos', an elite thought-structuring AI.
      Analyze the following unstructured text/notes and restructure them into a logical presentation deck.
      
      User Input:
      ${prompt}

      - Create a coherent narrative flow.
      - Ensure each slide has a clear message.
      - Suggest appropriate layouts.
    `,
    });

    return result.toTextStreamResponse();
}
