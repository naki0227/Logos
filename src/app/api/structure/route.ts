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
            layout: z.enum(['title', 'bullets', 'grid_2', 'grid_3', 'grid_4', 'comparison', 'flow', 'center', 'vision_layout']).describe('Suggested layout. Use grid_2/3/4 for parallel points. Use center for impact.'),
            content: z.array(z.string()).describe('Bullet points or main text content'),
            gridItems: z.array(z.object({
                title: z.string().optional().describe('Title for the grid box'),
                content: z.string().describe('Content for the grid box'),
            })).optional().describe('Content for grid layouts'),
            speakerNotes: z.string().describe('Notes for the speaker'),
            elements: z.array(
                z.object({
                    type: z.enum(['text', 'shape', 'image']),
                    content: z.string().optional().describe('Text content or Image prompt (English for images)'),
                    x: z.number().describe('X position in percentage (0-100)'),
                    y: z.number().describe('Y position in percentage (0-100)'),
                    w: z.number().describe('Width in percentage (0-100)'),
                    h: z.number().describe('Height in percentage (0-100)'),
                    zIndex: z.number().optional().describe('Layer order (1=back, 10=front). Overlapping elements need distinct zIndex.'),
                    source: z.enum(['generated', 'crop']).optional().describe('Use "crop" to cut out part of the original image, "generated" for AI image.'),
                    color: z.string().optional().describe('Color code'),
                    fontSize: z.number().optional().describe('Font size'),
                })
            ).optional().describe('For VisionDraft: specific elements with coordinates'),
        })
    ).describe('List of slides'),
});

export async function POST(req: Request) {
    const { prompt, image } = await req.json();

    const systemInstructions = image
        ? `You are 'Logos Vision', an expert in converting visual sketches into professional slides.
       
       **Goal:**
       Analyze the uploaded image (whiteboard, napkin sketch, or screenshot) and reconstruct it as a PowerPoint slide.
       
       **Rules:**
       1. **Language:** Output title/text in **Japanese**.
       2. **Images - Crop vs Generate:**
          - **Crop (source: 'crop'):** If there is a specific diagram, graph, or handwritten note that is unique and complex, define a region to CROP from the original image. Set x, y, w, h to exactly capture that part.
          - **Generate (source: 'generated'):** If it's a generic concept (e.g. "student studying") that can be replaced by a clean illustration, use this. Content MUST be an English prompt.
       3. **Layering:** Detect overlapping objects. Assign 'zIndex' (0=background, 10=foreground). Text should usually be on top of shapes.
       4. **Layout:** Reconstruct spatial layout with precise x,y,w,h.
       
       Ensure the 'layout' is set to 'vision_layout'.`
        : `You are 'Logos', an elite thought-structuring AI.
       Analyze the following unstructured text/notes and restructure them into a logical presentation deck.
       
       **Rules:**
       1. **Language:** ALWAYS output the content in **Japanese**, regardless of the input language (unless explicitly asked to translate).
       2. **Design Principles:**
          - **One Message per Slide:** Don't cram too much text. Split into multiple slides if needed.
          - **Visual Hierarchy:** Use 'grid_2', 'grid_3' layouts for parallel concepts. Use 'center' for big impactful statements.
          - **Professional Tone:** Keep text concise and punchy.
       
       Create a coherent narrative flow.
       Ensure each slide has a clear message.
       Suggest appropriate modern layouts.`;

    const messages: any[] = [
        {
            role: 'user',
            content: [
                { type: 'text', text: prompt || 'Analyze this image and turn it into slides.' },
                ...(image ? [{ type: 'image', image: image }] : []),
            ],
        },
    ];

    const result = await streamObject({
        model: google('gemini-2.5-flash'),
        schema: slideSchema,
        messages: messages,
        system: systemInstructions,
    });

    return result.toTextStreamResponse();
}
