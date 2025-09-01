import React, { useState } from 'react';

// --- Icons ---
const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
        <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
    </svg>
);

const ButtonSpinner = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const CheckCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-8 h-8 text-green-400">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
    </svg>
);

// --- Component ---
interface UploadFolderModalProps {
    files: File[];
    repoPath: string;
    onClose: () => void;
    onUpload: (basePath: string, commitMessage: string, onProgress: (progress: { current: number, total: number, fileName: string }) => void) => Promise<void>;
}

export function UploadFolderModal({ files, repoPath, onClose, onUpload }: UploadFolderModalProps) {
    const [basePath, setBasePath] = useState('');
    const [commitMessage, setCommitMessage] = useState('feat: Upload folder {folder}');
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState({ current: 0, total: files.length, fileName: '' });

    const handleUpload = async () => {
        setIsUploading(true);
        setError(null);
        setProgress({ current: 0, total: files.length, fileName: '' });
        try {
            await onUpload(basePath.trim(), commitMessage.trim(), setProgress);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
            setIsUploading(false); // Stop on error
        }
    };

    const isFinished = progress.current === progress.total && !error && isUploading;
    const progressPercentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="upload-folder-title">
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
                <header className="flex items-center justify-between p-4 border-b border-slate-700 flex-shrink-0">
                    <h3 id="upload-folder-title" className="text-lg font-semibold text-slate-200">
                        Upload Folder to {repoPath}
                    </h3>
                    <button onClick={onClose} className="p-1 rounded-md hover:bg-slate-700 text-slate-400" aria-label="Close upload modal">
                        <CloseIcon />
                    </button>
                </header>
                <main className="p-6 space-y-4 overflow-y-auto">
                    <div>
                        <p className="text-sm font-medium text-slate-300 mb-2">Found {files.length} files to upload:</p>
                        <ul className="bg-slate-900/70 p-2 rounded-md text-xs text-slate-400 font-mono max-h-40 overflow-y-auto border border-slate-700">
                            {files.map(file => (
                                <li key={(file as any).webkitRelativePath || file.name} className="truncate" title={(file as any).webkitRelativePath || file.name}>
                                    {(file as any).webkitRelativePath || file.name}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <label htmlFor="base-path" className="block text-sm font-medium text-slate-300 mb-1">
                           Destination Path (Optional)
                        </label>
                        <input
                            id="base-path"
                            type="text"
                            value={basePath}
                            onChange={(e) => setBasePath(e.target.value)}
                            placeholder="e.g., src/assets"
                            className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={isUploading}
                        />
                         <p className="text-xs text-slate-500 mt-1">Leave blank to upload to the repository root.</p>
                    </div>
                     <div>
                        <label htmlFor="commit-message" className="block text-sm font-medium text-slate-300 mb-1">
                           Commit Message
                        </label>
                         <input
                            id="commit-message"
                            type="text"
                            value={commitMessage}
                            onChange={(e) => setCommitMessage(e.target.value)}
                            className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={isUploading}
                        />
                         <p className="text-xs text-slate-500 mt-1">Use <code className="bg-slate-700 px-1 rounded-sm text-xs">{'{file}'}</code> and <code className="bg-slate-700 px-1 rounded-sm text-xs">{'{folder}'}</code> as placeholders.</p>
                    </div>

                    {isUploading && !isFinished && (
                        <div className="space-y-2 pt-2">
                             <p className="text-sm text-center text-slate-300">
                                Uploading {progress.current} of {progress.total}: <span className="font-mono text-cyan-400 text-xs">{progress.fileName}</span>
                            </p>
                             <div className="w-full bg-slate-700 rounded-full h-2.5">
                                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
                            </div>
                        </div>
                    )}

                    {isFinished && (
                        <div className="flex flex-col items-center justify-center p-4 bg-slate-700/50 rounded-md text-center">
                            <CheckCircleIcon />
                            <p className="mt-2 font-semibold text-slate-200">Upload Complete!</p>
                            <p className="text-sm text-slate-400">{progress.total} files have been successfully uploaded to your repository.</p>
                        </div>
                    )}
                    
                    {error && <div className="text-red-400 p-3 bg-red-900/20 rounded-md text-sm text-center">{error}</div>}
                </main>
                 <footer className="p-4 bg-slate-800/50 border-t border-slate-700 flex justify-end items-center gap-4 flex-shrink-0">
                    {!isFinished && (
                         <button onClick={onClose} disabled={isUploading} className="text-sm font-semibold text-slate-300 hover:text-white px-4 py-2 rounded-md disabled:opacity-50">
                            Cancel
                        </button>
                    )}
                    
                    {isFinished ? (
                        <button
                            onClick={onClose}
                            className="w-48 flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-md"
                        >
                           Close
                        </button>
                    ) : (
                        <button
                            onClick={handleUpload}
                            disabled={isUploading}
                            className="w-48 flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-md transition-colors duration-200"
                        >
                            {isUploading ? <ButtonSpinner /> : 'Start Upload'}
                        </button>
                    )}
                </footer>
            </div>
        </div>
    );
}
