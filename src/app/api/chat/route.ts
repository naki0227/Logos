
import { google } from '@ai-sdk/google';
import { streamText, tool, convertToModelMessages } from 'ai';
import { z } from 'zod';

export const maxDuration = 60;

// Shared Schema (Same as before)
const slideSchema = z.object({
    title: z.string().describe('The title of the presentation'),
    mainGoal: z.string().describe('The main goal or message of the presentation'),
    slides: z.array(
        z.object({
            id: z.string().describe('Unique identifier for the slide'),
            title: z.string().describe('Slide title'),
            layout: z.enum(['title', 'bullets', 'grid_2', 'grid_3', 'grid_4', 'comparison', 'flow', 'center', 'vision_layout']).describe('Suggested layout.'),
            content: z.array(z.string()).describe('Bullet points or main text content'),
            gridItems: z.array(z.object({
                title: z.string().optional(),
                content: z.string(),
            })).optional(),
            speakerNotes: z.string().describe('Notes for the speaker'),
            elements: z.array(
                z.object({
                    type: z.enum(['text', 'shape', 'image']),
                    content: z.string().optional(),
                    x: z.number(), y: z.number(), w: z.number(), h: z.number(),
                    zIndex: z.number().optional(),
                    source: z.enum(['generated', 'crop']).optional(),
                    color: z.string().optional(),
                    fontSize: z.number().optional(),
                })
            ).optional(),
        })
    ).describe('List of slides'),
});

export async function POST(req: Request) {
    const { messages, data } = await req.json();
    const { image, themeId } = data || {};

    const systemPrompt = `You are Logos, an expert presentation architect and thinking partner.
    
    **Your Goal:**
    Interact with the user to clarify their thoughts ("Kabetuchi" style) and structure a professional presentation.
    Do NOT just generate slides immediately unless the user provides a very complete prompt.
    Ask clarifying questions about the target audience, the core message, and the desired tone.
    
    **Process:**
    1. **Discuss:** Help the user brainstorming. If they upload an image, analyze it and ask how they want to present it.
    2. **Structure:** When the direction is clear (or the user asks to generate), use the 'generateSlides' tool to create the deck.
    
    **Rules:**
    - Always speak in Japanese.
    - Be helpful, insightful, and professional (like a McKinsey consultant).
    - When generating slides, use the 'generateSlides' tool. Do not output JSON in text.
    `;

    // Process messages to handle image content properly if passed
    // Note: In Vercel AI SDK 'useChat', attachments are usually handled in 'messages'.
    // Here we assume 'image' passed in 'data' is the main visual context if needed (e.g. for VisionDraft).

    // AI SDK v5: Convert UIMessage[] to ModelMessage[] 
    const modelMessages = convertToModelMessages(messages);

    const coreMessages = [
        { role: 'system' as const, content: systemPrompt },
        ...modelMessages
    ];

    // Inject image context into the latest user message if present and not already there
    if (image) {
        const lastMsg = coreMessages[coreMessages.length - 1];
        if (lastMsg.role === 'user' && typeof lastMsg.content === 'string') {
            // In a real implementation this might need more robust handling of multimodal messages
            // For now we assume the system prompt or tool can access the 'image' via arguments or implicit context
            // However, streamText doesn't support implicit context injection into the model easily without multimodal parts.
            // We will append a text note about the image availability.
            lastMsg.content += "\n\n[System Note: The user has uploaded an image context for this session.]";
        }
    }

    const result = await streamText({
        model: google('gemini-2.5-flash'),
        messages: coreMessages,
        tools: {
            generateSlides: tool({
                description: 'Generate the structured JSON for the presentation slides.',
                inputSchema: slideSchema,
                execute: async (args) => {
                    console.log('🔧 TOOL EXECUTE CALLED with args:', JSON.stringify(args, null, 2));
                    // In a real agent, we might do server-side processing here.
                    // For client-side rendering, we just return the args as the result.
                    const result = args;
                    console.log('🔧 TOOL EXECUTE RETURNING:', JSON.stringify(result, null, 2));
                    return result;
                },
            }),
        },
    });

    console.log('✅ Returning stream response');
    return result.toUIMessageStreamResponse();
}
