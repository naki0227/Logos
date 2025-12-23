'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { decodeData } from '@/lib/share'; // We'll assume relative path from src/app/share/page.tsx to src/lib/share.ts is ../../lib/share
import { Loader2, Download, FileText, X } from 'lucide-react';
import { generatePPTX, generatePDF } from '@/lib/pptx';

// Basic theme definitions (copied for standalone viewing without full page dependencies)
// Ideally shared from a common lib/themes.ts
const THEMES: any = {
    premium: { color: 'bg-indigo-900', style: { fontFamily: 'Helvetica Neue' } },
    minimal: { color: 'bg-zinc-900', style: { fontFamily: 'Arial' } },
    nature: { color: 'bg-emerald-900', style: { fontFamily: 'Georgia' } },
    pop: { color: 'bg-pink-900', style: { fontFamily: 'Verdana' } },
    cyber: { color: 'bg-slate-900', style: { fontFamily: 'Courier New' } },
    luxury: { color: 'bg-stone-900', style: { fontFamily: 'Times New Roman' } },
    japanese: { color: 'bg-orange-900', style: { fontFamily: 'Yu Mincho' } },
    sky: { color: 'bg-sky-900', style: { fontFamily: 'Helvetica' } },
};

function ShareContent() {
    const searchParams = useSearchParams();
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

    useEffect(() => {
        const encoded = searchParams.get('data');
        if (encoded) {
            try {
                const decoded = decodeData(encoded);
                if (decoded) {
                    setData(decoded);
                    // Also set title
                    document.title = decoded.title ? `Logos: ${decoded.title}` : 'Logos Presentation';
                } else {
                    setError('Failed to load presentation data.');
                }
            } catch (e) {
                console.error(e);
                setError('Invalid share link.');
            }
        } else {
            setError('No data found in link.');
        }
    }, [searchParams]);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-500">
                <X size={48} className="mb-4 opacity-20" />
                <p>{error}</p>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
        );
    }

    // Determine theme styles
    let themeStyle = {};
    let themeClass = 'bg-indigo-900';

    // Check if it's a known theme or custom
    // Note: For simplicity in share view, we might need to carry custom theme data in the shared payload if it's custom.
    // Assuming shared payload structure is compatible.
    if (data.themeId && THEMES[data.themeId]) {
        themeClass = THEMES[data.themeId].color;
        themeStyle = THEMES[data.themeId].style;
    }
    // If custom theme data is embedded (future improvement), handle here.

    const slides = data.slides || [];
    const currentSlide = currentSlideIndex === 0 ? null : slides[currentSlideIndex - 1];

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm z-10">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                        <SparklesIcon className="text-white" size={16} />
                    </div>
                    <h1 className="font-bold text-slate-800 text-lg truncate max-w-xs md:max-w-md">{data.title}</h1>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => generatePDF(data)}
                        className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Download PDF"
                    >
                        <FileText size={20} />
                    </button>
                    <button
                        onClick={() => generatePPTX(data)}
                        className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Download PPTX"
                    >
                        <Download size={20} />
                    </button>
                </div>
            </div>

            {/* Main Content - Viewer */}
            <div className="flex-1 overflow-hidden flex flex-col items-center justify-center p-4 md:p-8">
                <div
                    className={`w-full max-w-5xl aspect-video rounded-2xl shadow-2xl p-8 md:p-12 flex flex-col justify-center relative overflow-hidden transition-all ${themeClass}`}
                    style={themeStyle}
                >
                    {/* Slide Navigation Overlay */}
                    <div className="absolute inset-0 z-0 pointer-events-none opacity-10 bg-white/5" />

                    <div className="z-10 relative h-full flex flex-col justify-center">
                        {currentSlideIndex === 0 ? (
                            <div className="text-center">
                                <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">{data.title}</h1>
                                <p className="text-xl md:text-3xl text-white/80 max-w-3xl mx-auto">{data.mainGoal}</p>
                            </div>
                        ) : (
                            <div>
                                <h2 className="text-3xl md:text-5xl font-bold text-white mb-8 md:mb-12">{currentSlide.title}</h2>
                                <ul className="space-y-4 md:space-y-6">
                                    {currentSlide.content?.map((line: string, i: number) => (
                                        <li key={i} className="text-xl md:text-3xl text-white/90 flex items-start gap-4">
                                            <span className="text-indigo-300 transform scale-150 mt-1">•</span>
                                            <span>{line}</span>
                                        </li>
                                    ))}
                                </ul>
                                {currentSlide.image && (
                                    <div className="mt-8 flex justify-center">
                                        <img src={currentSlide.image} alt="Visual" className="max-h-[30vh] rounded-lg shadow-lg border-2 border-white/20" />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer Info */}
                    <div className="absolute bottom-6 right-8 text-white/40 font-mono text-sm z-10">
                        {currentSlideIndex + 1} / {slides.length + 1}
                    </div>
                </div>

                {/* Navigation Controls */}
                <div className="mt-8 flex items-center gap-6 bg-white px-6 py-3 rounded-2xl shadow-lg border border-slate-100">
                    <button
                        onClick={() => setCurrentSlideIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentSlideIndex === 0}
                        className="p-2 rounded-full hover:bg-slate-100 disabled:opacity-30 transition-colors"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                    </button>
                    <span className="font-mono text-slate-500 font-medium min-w-[3rem] text-center">
                        {currentSlideIndex + 1} / {slides.length + 1}
                    </span>
                    <button
                        onClick={() => setCurrentSlideIndex(prev => Math.min(slides.length, prev + 1))}
                        disabled={currentSlideIndex === slides.length}
                        className="p-2 rounded-full hover:bg-slate-100 disabled:opacity-30 transition-colors"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                    </button>
                </div>
            </div>
        </div>
    );
}

// Sparkles Icon component for header
function SparklesIcon({ className, size }: { className?: string, size?: number }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size || 24}
            height={size || 24}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
        </svg>
    )
}

export default function SharePage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>}>
            <ShareContent />
        </Suspense>
    );
}
