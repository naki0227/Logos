export interface Template {
    id: string;
    name: string;
    description: string;
    structure: {
        title: string;
        mainGoal: string;
        slides: {
            title: string;
            layout: 'title' | 'bullets' | 'grid_2' | 'grid_3' | 'grid_4' | 'comparison' | 'flow' | 'center' | 'vision_layout';
            content: string[];
            speakerNotes: string;
        }[];
    }
}

export const TEMPLATES: Template[] = [
    {
        id: 'pitch_deck',
        name: 'Startup Pitch Deck',
        description: 'Classic 10-slide startup pitch structure',
        structure: {
            title: 'Company Name',
            mainGoal: 'Revolutionizing the industry with AI',
            slides: [
                {
                    title: 'Problem',
                    layout: 'bullets',
                    content: ['Current market inefficiency', 'Pain points for users', 'Why existing solutions fail'],
                    speakerNotes: 'Start with a relatable story. Define the problem clearly.'
                },
                {
                    title: 'Solution',
                    layout: 'vision_layout',
                    content: ['Our unique value proposition', 'How it works', 'Key benefits'],
                    speakerNotes: 'Show, don\'t just tell. Explain the magic.'
                },
                {
                    title: 'Market Size',
                    layout: 'center',
                    content: ['TAM, SAM, SOM analysis'],
                    speakerNotes: 'Prove the market is big enough to matter.'
                },
                {
                    title: 'Business Model',
                    layout: 'grid_3',
                    content: ['Revenue Streams', 'Pricing Strategy', 'Sales Channels'],
                    speakerNotes: 'How do we make money?'
                }
            ]
        }
    },
    {
        id: 'quarterly_review',
        name: 'Quarterly Business Review',
        description: 'Review Q1/Q2/Q3/Q4 performance and next steps',
        structure: {
            title: 'Q1 Business Review',
            mainGoal: 'Analyzing performance and setting course for Q2',
            slides: [
                {
                    title: 'Executive Summary',
                    layout: 'bullets',
                    content: ['Key achievements', 'Missed targets', 'Overall sentiment'],
                    speakerNotes: 'High level overview for executives.'
                },
                {
                    title: 'Key Metrics',
                    layout: 'grid_4',
                    content: ['Revenue: +20%', 'Users: +15%', 'Churn: -5%', 'NPS: 72'],
                    speakerNotes: 'Data driven insights.'
                },
                {
                    title: 'Challenges & Learnings',
                    layout: 'comparison',
                    content: ['Challenge: Supply Chain', 'Learning: Diversify vendors'],
                    speakerNotes: 'Be honest about what went wrong and how we fixed it.'
                },
                {
                    title: 'Roadmap for Next Quarter',
                    layout: 'flow',
                    content: ['Month 1: Launch feature X', 'Month 2: Marketing push', 'Month 3: Optimize'],
                    speakerNotes: 'Clear timeline for next steps.'
                }
            ]
        }
    },
    {
        id: 'education',
        name: 'Educational Lecture',
        description: 'Structure for teaching a new concept',
        structure: {
            title: 'Introduction to Topic',
            mainGoal: 'Understanding the core principles',
            slides: [
                {
                    title: 'Learning Objectives',
                    layout: 'bullets',
                    content: ['Define key terms', 'Understand historical context', 'Apply concepts to real world'],
                    speakerNotes: 'Set expectations for the students.'
                },
                {
                    title: 'Core Concept 1',
                    layout: 'vision_layout',
                    content: ['Definition', 'Example', 'Visual Diagram'],
                    speakerNotes: 'Explain the first major point in detail.'
                },
                {
                    title: 'Case Study',
                    layout: 'grid_2',
                    content: ['Scenario A', 'Outcome A'],
                    speakerNotes: 'Use a concrete example to reinforce learning.'
                },
                {
                    title: 'Summary & Quiz',
                    layout: 'bullets',
                    content: ['Recap main points', 'Question 1', 'Question 2'],
                    speakerNotes: 'Check for understanding.'
                }
            ]
        }
    }
];
