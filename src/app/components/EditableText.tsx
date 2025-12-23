'use client';

import { useState, useRef, useEffect } from 'react';

interface EditableTextProps {
    initialValue: string;
    onSave: (value: string) => void;
    className?: string;
    tagName?: 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'div';
    multiline?: boolean;
}

export function EditableText({ initialValue, onSave, className = '', tagName = 'p', multiline = false }: EditableTextProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(initialValue);
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

    useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    const handleBlur = () => {
        setIsEditing(false);
        if (value !== initialValue) {
            onSave(value);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !multiline) {
            handleBlur();
        }
        if (e.key === 'Escape') {
            setValue(initialValue);
            setIsEditing(false);
        }
    };

    if (isEditing) {
        if (multiline) {
            return (
                <textarea
                    ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    className={`w-full bg-transparent outline-none border-b-2 border-indigo-500 rounded px-1 resize-none ${className}`}
                    rows={3}
                />
            );
        }
        return (
            <input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className={`w-full bg-transparent outline-none border-b-2 border-indigo-500 rounded px-1 ${className}`}
            />
        );
    }

    const Tag = tagName as any;

    return (
        <Tag
            onClick={() => setIsEditing(true)}
            className={`cursor-text hover:bg-slate-50/50 rounded px-1 -mx-1 transition-colors border border-transparent hover:border-slate-200 ${className}`}
            title="Click to edit"
        >
            {value}
        </Tag>
    );
}
