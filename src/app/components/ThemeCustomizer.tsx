'use client';

import { useState } from 'react';
import { X, Palette, type, Plus, Save } from 'lucide-react';

interface Theme {
    id: string;
    name: string;
    colors: {
        primary: string;
        secondary: string;
        accent: string;
        bg: string;
        textMain: string;
    };
    font: string;
}

interface ThemeCustomizerProps {
    currentThemeId: string;
    customThemes: Theme[];
    onThemeChange: (themeId: string) => void;
    onCustomThemeSave: (theme: Theme) => void;
    onClose: () => void;
}

export function ThemeCustomizer({ currentThemeId, customThemes, onThemeChange, onCustomThemeSave, onClose }: ThemeCustomizerProps) {
    const [activeTab, setActiveTab] = useState<'create' | 'select'>('create');

    const [newThemeName, setNewThemeName] = useState('My Custom Theme');
    const [colors, setColors] = useState({
        primary: '#1E1B4B',
        secondary: '#4338CA',
        accent: '#6366F1',
        bg: '#FFFFFF',
        textMain: '#334155'
    });
    const [font, setFont] = useState('Inter');

    const fonts = ['Inter', 'Roboto', 'Playfair Display', 'Montserrat', 'Lato', 'Open Sans'];

    const handleSave = () => {
        const newTheme: Theme = {
            id: `custom_${Date.now()}`,
            name: newThemeName,
            colors,
            font
        };
        onCustomThemeSave(newTheme);
        onThemeChange(newTheme.id);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800">Customize Look</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Font Selection */}
                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-slate-700 block">Font Family</label>
                        <div className="grid grid-cols-3 gap-2">
                            {fonts.map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFont(f)}
                                    className={`px-3 py-2 rounded-lg text-sm border transition-all ${font === f ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold' : 'border-slate-200 hover:border-indigo-300 text-slate-600'
                                        }`}
                                    style={{ fontFamily: f }}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Color Selection */}
                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-slate-700 block">Color Palette</label>
                        <div className="grid grid-cols-2 gap-4">
                            {Object.entries(colors).map(([key, value]) => (
                                <div key={key} className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        value={value}
                                        onChange={(e) => setColors(prev => ({ ...prev, [key]: e.target.value }))}
                                        className="w-10 h-10 rounded-lg cursor-pointer border-none p-0 bg-transparent"
                                    />
                                    <div>
                                        <p className="text-xs text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                                        <p className="text-xs font-mono text-slate-700">{value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Preview & Save */}
                    <div className="pt-6 border-t border-slate-100">
                        <div className="mb-4 space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Theme Name</label>
                            <input
                                type="text"
                                value={newThemeName}
                                onChange={(e) => setNewThemeName(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                            />
                        </div>

                        <button
                            onClick={handleSave}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-200"
                        >
                            <Save size={18} />
                            Save Custom Theme
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
