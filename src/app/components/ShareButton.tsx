'use client';

import { useState } from 'react';
import { Share2, Check, Copy } from 'lucide-react';
import { encodeData } from '@/lib/share';

interface ShareButtonProps {
    data: any;
}

export function ShareButton({ data }: ShareButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleShare = async () => {
        setLoading(true);
        try {
            // Encode data
            const encoded = encodeData(data);
            const url = `${window.location.origin}/share?data=${encoded}`;

            // Copy to clipboard
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (e) {
            console.error("Failed to share", e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleShare}
            disabled={!data || loading}
            className={`flex items-center gap-2 px-6 py-3 font-medium rounded-xl transition-all active:scale-95 disabled:opacity-50 ${copied
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700'
                }`}
            title="Share as Link"
        >
            {copied ? <Check size={18} /> : <Share2 size={18} />}
            {copied ? 'Copied Link!' : 'Share'}
        </button>
    );
}
