import React, { useState, useCallback, useRef } from 'react';

// Icons
const FileImportIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
        <path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" />
        <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5a1.25 1.25 0 0 1-1.25 1.25H4.75A1.25 1.25 0 0 1 3.5 15.25v-2.5Z" />
    </svg>
);

const ChevronDownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 transition-transform duration-200 group-open:rotate-180">
        <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
    </svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.58.22-2.365.468a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
    </svg>
);


interface LocalFileImporterProps {
    onFileImported: (content: string) => void;
}

export function LocalFileImporter({ onFileImported }: LocalFileImporterProps): React.ReactNode {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setError(null);
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result as string;
                onFileImported(text);
                setSelectedFile(file);
            };
            reader.onerror = () => {
                setError(`Failed to read file: ${reader.error?.message}`);
                setSelectedFile(null);
            };
            reader.readAsText(file);
        }
        // Reset input value to allow selecting the same file again
        if (event.target) {
            event.target.value = '';
        }
    };

    const handleClearFile = () => {
        setSelectedFile(null);
        setError(null);
        // Optionally clear the body in parent, but the user might want to keep it
        // onFileImported(''); 
    };

    const triggerFileSelect = () => {
        fileInputRef.current?.click();
    };

    return (
        <details className="bg-slate-800/50 rounded-lg shadow-lg border border-slate-700 group">
            <summary className="p-4 list-none flex justify-between items-center cursor-pointer hover:bg-slate-800/70 rounded-t-lg">
                <div className="flex items-center space-x-3">
                    <FileImportIcon />
                    <h2 className="text-xl font-semibold text-slate-300">Import from Local File</h2>
                </div>
                <ChevronDownIcon />
            </summary>
            <div className="p-4 md:p-6 border-t border-slate-700 space-y-4">
                <p className="text-sm text-slate-400">
                    Import the content of a local file directly into the request body. Useful for JSON payloads, GraphQL queries, and more.
                </p>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    aria-hidden="true"
                />
                {!selectedFile ? (
                    <button
                        onClick={triggerFileSelect}
                        className="w-full flex items-center justify-center bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200"
                    >
                        Select File to Import
                    </button>
                ) : (
                    <div className="bg-slate-700/50 p-3 rounded-md flex items-center justify-between">
                        <div className="text-sm">
                            <p className="font-semibold text-slate-200">{selectedFile.name}</p>
                            <p className="text-slate-400">({(selectedFile.size / 1024).toFixed(2)} KB) imported as request body.</p>
                        </div>
                        <div className="flex items-center space-x-2">
                             <button
                                onClick={triggerFileSelect}
                                className="text-sm font-semibold text-blue-400 hover:text-blue-300"
                                aria-label="Import another file"
                            >
                                Import Another
                            </button>
                            <button
                                onClick={handleClearFile}
                                className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-700 rounded-md"
                                aria-label="Clear selected file"
                            >
                                <TrashIcon />
                            </button>
                        </div>
                    </div>
                )}
                 {error && <div className="text-red-400 p-3 bg-red-900/20 rounded-md text-sm">{error}</div>}
            </div>
        </details>
    );
}