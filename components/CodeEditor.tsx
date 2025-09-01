
import React from 'react';

interface CodeEditorProps {
    value: string;
    onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    placeholder?: string;
    readOnly?: boolean;
    className?: string;
}

export function CodeEditor({ value, onChange, placeholder, readOnly = false, className }: CodeEditorProps): React.ReactNode {
    const baseClasses = "w-full bg-slate-900/70 border border-slate-700 rounded-md p-4 font-mono text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y";
    
    const finalClassName = [
        baseClasses,
        className === undefined ? 'h-64' : className
    ].join(' ').trim();

    return (
        <textarea
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            readOnly={readOnly}
            className={finalClassName}
            spellCheck="false"
        />
    );
}
