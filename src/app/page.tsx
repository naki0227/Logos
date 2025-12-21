'use client';

import { useState } from 'react';
import { experimental_useObject as useObject } from '@ai-sdk/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Loader2, LayoutTemplate } from 'lucide-react';
import { z } from 'zod';

// Define schema locally for type inference (needs to match server)
const slideSchema = z.object({
  title: z.string().optional(),
  mainGoal: z.string().optional(),
  slides: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      layout: z.string(),
      content: z.array(z.string()),
      speakerNotes: z.string(),
    })
  ).optional(),
});

export default function Home() {
  const [input, setInput] = useState('');

  const { object, submit, isLoading } = useObject({
    api: '/api/structure',
    schema: slideSchema,
  });

  const handleSubmit = () => {
    if (!input.trim()) return;
    submit({ prompt: input });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-8 h-screen">

        {/* Left: Input Area */}
        <div className="flex flex-col gap-4 p-6 bg-white rounded-3xl shadow-sm border border-slate-100">
          <header className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-600 rounded-xl text-white">
              <Sparkles size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Logos</h1>
              <p className="text-sm text-slate-500">Structura AI • Thought Architect</p>
            </div>
          </header>

          <textarea
            className="flex-1 w-full p-4 text-lg bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 resize-none outline-none placeholder:text-slate-400"
            placeholder="ここにカオスな思考を書き殴ってください..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />

          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={isLoading || !input}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-medium rounded-full transition-all active:scale-95"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  Structure Thoughts
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: Output Preview */}
        <div className="flex flex-col gap-4 p-6 bg-slate-100 rounded-3xl border border-slate-200 overflow-hidden relative">
          {!object?.slides ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
              <LayoutTemplate size={48} className="opacity-20" />
              <p>Result will appear here</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto pr-2 space-y-6">
              <AnimatePresence>
                {/* Title Card */}
                {object.title && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-8 bg-white rounded-xl shadow-sm border-l-4 border-indigo-500"
                  >
                    <h2 className="text-3xl font-bold mb-2 text-slate-900">{object.title}</h2>
                    <p className="text-slate-500">{object.mainGoal}</p>
                  </motion.div>
                )}

                {/* Slides */}
                {object.slides?.map((slide, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold text-slate-800">
                        <span className="text-indigo-200 mr-2">#{index + 1}</span>
                        {slide?.title}
                      </h3>
                      <span className="text-xs font-mono px-2 py-1 bg-slate-100 rounded text-slate-500">
                        {slide?.layout}
                      </span>
                    </div>

                    <ul className="space-y-2 mb-6 ml-1">
                      {slide?.content?.map((item, i) => (
                        <li key={i} className="flex gap-2 text-slate-700">
                          <span className="text-indigo-400">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>

                    {slide?.speakerNotes && (
                      <div className="p-3 bg-yellow-50 text-yellow-800 text-sm rounded-lg border border-yellow-100">
                        <span className="font-bold mr-1">🗣️ Note:</span>
                        {slide.speakerNotes}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
