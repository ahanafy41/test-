

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GitHubFile, RepoInfo } from '../types';
import { CodeEditor } from './CodeEditor';
import { GitHubAiChat } from './GitHubAiChat';
import { FileAiChat } from './FileAiChat';
import { RepoContext } from './ApiTester';
import { UploadFolderModal } from './UploadFolderModal';

// --- Types ---
interface GitHubRepo {
    full_name: string;
}

// --- Icons ---
const GitHubIcon = () => (
    <svg viewBox="0 0 16 16" fill="currentColor" className="w-5 h-5">
        <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.19.01-.82.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21-.15.46-.55.38A8.013 8.013 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path>
    </svg>
);

const ChevronDownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 transition-transform duration-200 group-open:rotate-180">
        <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
    </svg>
);

const LoadingSpinner = () => (
    <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
    </div>
);

const FileIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-slate-400 flex-shrink-0">
        <path fillRule="evenodd" d="M4 2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8.586a2 2 0 0 0-.586-1.414l-4.586-4.586A2 2 0 0 0 9.414 2H4Zm4 6a1 1 0 0 1 1-1h2a1 1 0 1 1 0 2H9a1 1 0 0 1-1-1Zm0 4a1 1 0 1 1 0-2h6a1 1 0 1 1 0 2H8Z" clipRule="evenodd" />
    </svg>
);

const ButtonSpinner = () => (
    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
        <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
    </svg>
);

const SparklesIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M10.868 2.884c.321-.772 1.334-.772 1.654 0l1.47 3.528 3.805 1.588c.772.321.772 1.334 0 1.654l-3.805 1.588-1.47 3.528c-.321.772-1.334.772-1.654 0l-1.47-3.528-3.805-1.588c-.772-.321-.772-1.334 0-1.654l3.805 1.588 1.47-3.528zM15 15.5a.5.5 0 01.5-.5h2a.5.5 0 010 1h-2a.5.5 0 01-.5-.5zM5 4.5a.5.5 0 01.5-.5h2a.5.5 0 010 1h-2a.5.5 0 01-.5-.5z" clipRule="evenodd" />
    </svg>
);

const UploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2">
        <path fillRule="evenodd" d="M10 2a.75.75 0 01.75.75v8.514l1.94-1.94a.75.75 0 111.06 1.06l-3.25 3.25a.75.75 0 01-1.06 0L6.22 9.884a.75.75 0 111.06-1.06l1.94 1.94V2.75A.75.75 0 0110 2zM3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5a1.25 1.25 0 01-1.25 1.25H4.75A1.25 1.25 0 013.5 15.25v-2.5z" clipRule="evenodd" />
    </svg>
);

const FolderUpIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2">
        <path d="M9.25 13.25a.75.75 0 001.5 0V4.636l2.955 3.129a.75.75 0 001.09-1.03l-4.25-4.5a.75.75 0 00-1.09 0l-4.25 4.5a.75.75 0 101.09 1.03L9.25 4.636v8.614z" />
        <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5a1.25 1.25 0 01-1.25 1.25H4.75A1.25 1.25 0 013.5 15.25v-2.5z" />
    </svg>
);

const InfoIcon = (props: React.ComponentProps<'svg'>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.58.22-2.365.468a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
    </svg>
);

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
        <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
    </svg>
);

// --- Create Repo Modal ---
interface CreateRepoModalProps {
    onClose: () => void;
    onCreate: (name: string, description: string, isPrivate: boolean) => Promise<void>;
}

function CreateRepoModal({ onClose, onCreate }: CreateRepoModalProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setError("Repository name is required.");
            return;
        }
        if (!/^[a-zA-Z0-9_.-]+$/.test(name)) {
            setError("Repository name can only contain letters, numbers, and the characters . - _");
            return;
        }

        setIsCreating(true);
        setError(null);
        try {
            await onCreate(name, description, isPrivate);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
            setIsCreating(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="create-repo-title">
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-full max-w-lg flex flex-col">
                <header className="flex items-center justify-between p-4 border-b border-slate-700">
                    <h3 id="create-repo-title" className="text-lg font-semibold text-slate-200">
                        Create New GitHub Repository
                    </h3>
                    <button onClick={onClose} className="p-1 rounded-md hover:bg-slate-700 text-slate-400" aria-label="Close create repository modal">
                        <CloseIcon />
                    </button>
                </header>
                <form onSubmit={handleSubmit}>
                    <main className="p-6 space-y-4">
                        <div>
                            <label htmlFor="repo-name" className="block text-sm font-medium text-slate-300 mb-1">
                                Repository Name <span className="text-red-400">*</span>
                            </label>
                            <input
                                id="repo-name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="my-awesome-project"
                                required
                                className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="repo-description" className="block text-sm font-medium text-slate-300 mb-1">
                                Description (Optional)
                            </label>
                            <textarea
                                id="repo-description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                placeholder="A short description of your new repository."
                                className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                            />
                        </div>
                        <div className="flex items-center justify-between bg-slate-700/60 p-3 rounded-md">
                            <span className="text-sm font-medium text-slate-300">
                                {isPrivate ? 'Private Repository' : 'Public Repository'}
                            </span>
                            <label htmlFor="visibility-toggle" className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={isPrivate} onChange={() => setIsPrivate(!isPrivate)} id="visibility-toggle" className="sr-only peer" />
                                <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>
                        {error && <div className="text-red-400 p-3 bg-red-900/20 rounded-md text-sm text-center">{error}</div>}
                    </main>
                    <footer className="p-4 bg-slate-800/50 border-t border-slate-700 flex justify-end items-center gap-4">
                        <button type="button" onClick={onClose} disabled={isCreating} className="text-sm font-semibold text-slate-300 hover:text-white px-4 py-2 rounded-md disabled:opacity-50">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isCreating}
                            className="w-48 flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-md transition-colors duration-200"
                        >
                            {isCreating ? <ButtonSpinner /> : 'Create Repository'}
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
}


// --- FileEditor Modal Component ---
interface FileEditorModalProps {
    file: { path: string; content: string; sha: string };
    repoInfo: RepoInfo;
    files: GitHubFile[];
    pat: string;
    onClose: () => void;
    onImport: () => void;
    onSaveSuccess: (newSha: string) => void;
}

function FileEditorModal({ file, repoInfo, files, pat, onClose, onImport, onSaveSuccess }: FileEditorModalProps) {
    const [editedContent, setEditedContent] = useState(file.content);
    const [commitMessage, setCommitMessage] = useState(`Update ${file.path}`);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string|null>(null);
    const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);

    useEffect(() => {
        setEditedContent(file.content);
        setCommitMessage(`Update ${file.path}`);
        setError(null);
    }, [file]);

    const handleSave = async () => {
        if (!commitMessage.trim()) {
            setError("Commit message cannot be empty.");
            return;
        }
        setIsSaving(true);
        setError(null);

        try {
            const contentBase64 = btoa(unescape(encodeURIComponent(editedContent)));

            const response = await fetch(`https://api.github.com/repos/${repoInfo.path}/contents/${file.path}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${pat}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: commitMessage,
                    content: contentBase64,
                    sha: file.sha,
                    branch: repoInfo.defaultBranch,
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to save file to GitHub.');
            }
            
            onSaveSuccess(data.content.sha);

        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred while saving.');
        } finally {
            setIsSaving(false);
        }
    };
    
    const hasChanges = editedContent !== file.content;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="file-editor-title">
            <div className={`bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-full max-h-[90vh] flex flex-col transition-all duration-300 ${isAiPanelOpen ? 'max-w-7xl' : 'max-w-4xl'}`}>
                <header className="flex items-center justify-between p-4 border-b border-slate-700 flex-shrink-0">
                    <h3 id="file-editor-title" className="text-lg font-semibold text-slate-200 truncate" title={file.path}>
                        Editing: {file.path}
                    </h3>
                     <div className="flex items-center space-x-2">
                        <button 
                            onClick={() => setIsAiPanelOpen(!isAiPanelOpen)}
                            className={`flex items-center space-x-2 text-sm px-3 py-1.5 rounded-md transition-colors duration-200 ${isAiPanelOpen ? 'bg-indigo-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}
                            aria-label={isAiPanelOpen ? 'Close AI Assistant' : 'Open AI Assistant'}
                        >
                            <SparklesIcon />
                            <span>Ask AI</span>
                        </button>
                        <button onClick={onClose} className="p-1 rounded-md hover:bg-slate-700 text-slate-400" aria-label="Close file editor">
                            <CloseIcon />
                        </button>
                    </div>
                </header>
                <main className="flex-grow overflow-y-auto flex min-h-0">
                    <div className="flex-1 p-6 h-full">
                        <CodeEditor value={editedContent} onChange={(e) => setEditedContent(e.target.value)} className="h-full resize-none" />
                    </div>
                     {isAiPanelOpen && (
                         <div className="w-1/2 flex-shrink-0 p-6 pl-0 h-full border-l border-slate-700">
                             <FileAiChat 
                                filePath={file.path} 
                                fileContent={file.content}
                                repoInfo={repoInfo}
                                files={files}
                                pat={pat}
                                onApplyChanges={(newCode) => {
                                    setEditedContent(newCode);
                                    setError(null);
                                }}
                             />
                        </div>
                    )}
                </main>
                <footer className="p-4 border-t border-slate-700 flex-shrink-0 space-y-4">
                    {error && <div className="text-red-400 p-3 bg-red-900/20 rounded-md text-sm text-center">{error}</div>}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <input
                            type="text"
                            value={commitMessage}
                            onChange={(e) => setCommitMessage(e.target.value)}
                            placeholder="Commit message"
                            className="flex-grow bg-slate-700 border border-slate-600 rounded-md px-4 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                            aria-label="Commit message"
                            disabled={!hasChanges || isSaving}
                        />
                         <button
                            onClick={handleSave}
                            disabled={!hasChanges || isSaving}
                            className="w-full sm:w-auto flex items-center justify-center bg-green-600 hover:bg-green-500 disabled:bg-green-800 disabled:cursor-not-allowed text-white font-bold py-2 px-6 rounded-md transition-colors duration-200"
                        >
                           {isSaving ? <ButtonSpinner /> : 'Save to GitHub'}
                        </button>
                    </div>
                     <div className="flex justify-end">
                         <button
                            onClick={onImport}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200 text-sm"
                        >
                           Import as Request Body
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
}

// --- Upload Modal Component ---
interface UploadFileModalProps {
    file: File;
    existingFiles: GitHubFile[];
    repoPath: string;
    onClose: () => void;
    onUpload: (filePath: string, commitMessage: string) => Promise<void>;
}

function UploadFileModal({ file, existingFiles, repoPath, onClose, onUpload }: UploadFileModalProps) {
    const [filePath, setFilePath] = useState(file.name);
    const [commitMessage, setCommitMessage] = useState(`Add ${file.name}`);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const doesFileExist = existingFiles.some(f => f.path === filePath.trim());

    const handleUpload = async () => {
        if (!filePath.trim()) {
            setError("File path cannot be empty.");
            return;
        }
        if (!commitMessage.trim()) {
            setError("Commit message cannot be empty.");
            return;
        }

        setIsUploading(true);
        setError(null);
        try {
            await onUpload(filePath.trim(), commitMessage.trim());
            onClose();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred during upload.');
            setIsUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="upload-file-title">
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-full max-w-2xl flex flex-col">
                <header className="flex items-center justify-between p-4 border-b border-slate-700">
                    <h3 id="upload-file-title" className="text-lg font-semibold text-slate-200">
                        Upload File to {repoPath}
                    </h3>
                    <button onClick={onClose} className="p-1 rounded-md hover:bg-slate-700 text-slate-400" aria-label="Close upload modal">
                        <CloseIcon />
                    </button>
                </header>
                <main className="p-6 space-y-4">
                    <div>
                        <label htmlFor="file-name" className="block text-sm font-medium text-slate-300 mb-1">
                           Local File
                        </label>
                        <p id="file-name" className="bg-slate-900/70 p-2 rounded-md text-sm text-slate-400">{file.name} ({(file.size / 1024).toFixed(2)} KB)</p>
                    </div>
                     <div>
                        <label htmlFor="file-path" className="block text-sm font-medium text-slate-300 mb-1">
                           File Path in Repository
                        </label>
                        <input
                            id="file-path"
                            type="text"
                            value={filePath}
                            onChange={(e) => setFilePath(e.target.value)}
                            placeholder="e.g., src/components/NewFile.js"
                            className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                         {doesFileExist && (
                            <p className="text-xs text-yellow-400 mt-1">Warning: A file already exists at this path and will be overwritten.</p>
                        )}
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
                        />
                    </div>
                     {error && <div className="text-red-400 p-3 bg-red-900/20 rounded-md text-sm text-center">{error}</div>}
                </main>
                 <footer className="p-4 bg-slate-800/50 border-t border-slate-700 flex justify-end items-center gap-4">
                    <button onClick={onClose} className="text-sm font-semibold text-slate-300 hover:text-white px-4 py-2 rounded-md">
                        Cancel
                    </button>
                    <button
                        onClick={handleUpload}
                        disabled={isUploading}
                        className="w-48 flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-md transition-colors duration-200"
                    >
                        {isUploading ? <ButtonSpinner /> : 'Upload and Commit'}
                    </button>
                </footer>
            </div>
        </div>
    );
}


// --- Delete Confirmation Modal ---
interface DeleteConfirmationModalProps {
    file: GitHubFile;
    onClose: () => void;
    onConfirm: () => void;
    isDeleting: boolean;
}

function DeleteConfirmationModal({ file, onClose, onConfirm, isDeleting }: DeleteConfirmationModalProps) {
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="delete-file-title">
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-full max-w-md flex flex-col">
                <header className="p-4 border-b border-slate-700">
                    <h3 id="delete-file-title" className="text-lg font-semibold text-slate-200">
                        Confirm Deletion
                    </h3>
                </header>
                <main className="p-6">
                    <p className="text-slate-300">
                        Are you sure you want to permanently delete the file <strong className="font-mono bg-slate-700/50 px-1 py-0.5 rounded-md text-red-400">{file.path}</strong>?
                    </p>
                    <p className="text-sm text-slate-400 mt-2">This action cannot be undone.</p>
                </main>
                <footer className="p-4 bg-slate-800/50 border-t border-slate-700 flex justify-end items-center gap-4">
                     <button onClick={onClose} disabled={isDeleting} className="text-sm font-semibold text-slate-300 hover:text-white px-4 py-2 rounded-md disabled:opacity-50">
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="w-40 flex items-center justify-center bg-red-600 hover:bg-red-500 disabled:bg-red-800 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-md transition-colors duration-200"
                    >
                        {isDeleting ? <ButtonSpinner /> : 'Delete File'}
                    </button>
                </footer>
            </div>
        </div>
    );
}


// --- Main Component ---
interface GitHubImporterProps {
    onFileImported: (content: string) => void;
    onRepoContextChange: (context: RepoContext | null) => void;
}

export function GitHubImporter({ onFileImported, onRepoContextChange }: GitHubImporterProps): React.ReactNode {
    const [pat, setPat] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [isLoadingFiles, setIsLoadingFiles] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [repositories, setRepositories] = useState<GitHubRepo[]>([]);
    const [selectedRepo, setSelectedRepo] = useState<string>('');
    
    const [files, setFiles] = useState<GitHubFile[]>([]);
    const [repoInfo, setRepoInfo] = useState<RepoInfo | null>(null);

    const [editingFile, setEditingFile] = useState<{ path: string; content: string; sha: string } | null>(null);
    const [loadingPreviewPath, setLoadingPreviewPath] = useState<string | null>(null);
    const [isAiChatOpen, setIsAiChatOpen] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const folderInputRef = useRef<HTMLInputElement>(null);
    const [fileToUpload, setFileToUpload] = useState<File | null>(null);
    const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
    
    const [fileToDelete, setFileToDelete] = useState<GitHubFile | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    
    const [isCreateRepoModalOpen, setIsCreateRepoModalOpen] = useState(false);


    const getHeaders = useCallback(() => {
        const headers: HeadersInit = {
            'Accept': 'application/vnd.github.v3+json',
        };
        if (pat) {
            headers['Authorization'] = `token ${pat}`;
        }
        return headers;
    }, [pat]);

    const handleConnectToGitHub = async () => {
        if (!pat) {
            setError('A Personal Access Token is required to connect.');
            return;
        }
        setIsConnecting(true);
        setIsConnected(false);
        setError(null);
        setRepositories([]);
        setFiles([]);
        setSelectedRepo('');
        setRepoInfo(null);
        onRepoContextChange(null);

        try {
            const headers = getHeaders();
            const reposRes = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', { headers });

            if (!reposRes.ok) {
                if (reposRes.status === 401) {
                    throw new Error('Authentication failed. Please check if your Personal Access Token is correct and has the `repo` scope.');
                }
                throw new Error(`Could not fetch repositories. Status: ${reposRes.status}`);
            }
            const repoData: GitHubRepo[] = await reposRes.json();
            
            setRepositories(repoData);
            setIsConnected(true);
            if (repoData.length === 0) {
                setError('No repositories found for this token. You can create one now!');
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred while connecting to GitHub.');
            setIsConnected(false);
        } finally {
            setIsConnecting(false);
        }
    };

    const handleFetchFiles = useCallback(async (repoPath: string) => {
        if (!repoPath) {
            setFiles([]);
            setRepoInfo(null);
            setError(null);
            onRepoContextChange(null);
            return;
        }
        
        setIsLoadingFiles(true);
        setError(null);
        setFiles([]);
        setRepoInfo(null);
        setIsAiChatOpen(false);
        onRepoContextChange(null);

        try {
            const headers = getHeaders();
            const repoDetailsRes = await fetch(`https://api.github.com/repos/${repoPath}`, { headers });
            if (!repoDetailsRes.ok) throw new Error(`Could not fetch repository. Status: ${repoDetailsRes.status}. Check token permissions.`);
            const repoDetails = await repoDetailsRes.json();
            const defaultBranch = repoDetails.default_branch;

            const currentRepoInfo = { path: repoPath, defaultBranch };
            setRepoInfo(currentRepoInfo);

            const treeRes = await fetch(`https://api.github.com/repos/${repoPath}/git/trees/${defaultBranch}?recursive=1`, { headers });
            if (!treeRes.ok) throw new Error(`Could not fetch file tree. Status: ${treeRes.status}`);
            const treeData = await treeRes.json();
            
            if (treeData.truncated) {
                setError("Warning: Repository is large, so the file list may be incomplete.");
            }
            
            const repoFiles = treeData.tree
                .filter((file: any) => file.type === 'blob')
                .sort((a: GitHubFile, b: GitHubFile) => a.path.localeCompare(b.path));
            setFiles(repoFiles);
            onRepoContextChange({ repoInfo: currentRepoInfo, files: repoFiles, pat });


            if (repoFiles.length === 0) {
                 setError('This repository is empty. You can upload files or use the AI agent to create new ones.');
            }

        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
            setFiles([]);
            onRepoContextChange(null);
        } finally {
            setIsLoadingFiles(false);
        }
    }, [getHeaders, pat, onRepoContextChange]);

    const handleRepoSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const repoPath = e.target.value;
        setSelectedRepo(repoPath);
        handleFetchFiles(repoPath);
    };

    const handleEditFile = useCallback(async (file: GitHubFile) => {
        if (!repoInfo) {
            setError("Repository information is missing. Please fetch files again.");
            return;
        }
        setLoadingPreviewPath(file.path);
        setError(null);
        
        try {
            const headers = getHeaders();
            const contentRes = await fetch(`https://api.github.com/repos/${repoInfo.path}/contents/${file.path}?ref=${repoInfo.defaultBranch}`, { headers });
            if (!contentRes.ok) throw new Error(`Could not fetch file content. Status: ${contentRes.status}`);
            const data = await contentRes.json();
            
            const content = decodeURIComponent(escape(atob(data.content)));
            
            setEditingFile({ path: file.path, content, sha: data.sha });
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load file content.');
        } finally {
            setLoadingPreviewPath(null);
        }

    }, [repoInfo, getHeaders]);
    
    const handleSaveSuccess = (newSha: string) => {
        if (editingFile) {
            // Refresh file list to get new sha for all files
            if (repoInfo) handleFetchFiles(repoInfo.path);
            setEditingFile(null);
        }
    };

    const handleFileSelectedForUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setFileToUpload(file);
        }
        if (event.target) {
            event.target.value = ''; // Allow selecting the same file again
        }
    };
    
    const handleFolderSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = event.target.files;
        if (selectedFiles && selectedFiles.length > 0) {
            setFilesToUpload(Array.from(selectedFiles));
        }
        if (event.target) {
            event.target.value = ''; // Allow re-selecting the same folder
        }
    };


    const handleConfirmUpload = useCallback(async (filePath: string, commitMessage: string) => {
        if (!fileToUpload || !repoInfo) {
            throw new Error("File or repository information is missing.");
        }

        const reader = new FileReader();
        const promise = new Promise<string>((resolve, reject) => {
            reader.onload = () => {
                const result = reader.result as string;
                const base64Content = result.split(',')[1];
                resolve(base64Content);
            };
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(fileToUpload);
        });

        try {
            const contentBase64 = await promise;
            const headers = getHeaders();
            const existingFile = files.find(f => f.path === filePath);

            const body: { message: string; content: string; branch: string; sha?: string } = {
                message: commitMessage,
                content: contentBase64,
                branch: repoInfo.defaultBranch,
            };

            if (existingFile) {
                body.sha = existingFile.sha;
            }

            const response = await fetch(`https://api.github.com/repos/${repoInfo.path}/contents/${filePath}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(body)
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to upload file to GitHub.');
            }
            await handleFetchFiles(repoInfo.path);
        } catch (error) {
            console.error("Upload failed:", error);
            throw error;
        }
    }, [fileToUpload, repoInfo, getHeaders, files, handleFetchFiles]);
    
    const handleStartFolderUpload = useCallback(async (basePath: string, commitMessage: string, onProgress: (progress: { current: number; total: number; fileName: string; }) => void) => {
        if (!filesToUpload.length || !repoInfo) {
            throw new Error("No files to upload or repository information is missing.");
        }

        for (const [index, file] of filesToUpload.entries()) {
            const relativePath = (file as any).webkitRelativePath || file.name;
            const fullRepoPath = `${basePath ? `${basePath}/` : ''}${relativePath}`.replace(/\/+/g, '/');

            onProgress({ current: index + 1, total: filesToUpload.length, fileName: fullRepoPath });

            const contentBase64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const result = reader.result as string;
                    resolve(result.split(',')[1]);
                };
                reader.onerror = error => reject(error);
                reader.readAsDataURL(file);
            });

            const headers = getHeaders();
            const existingFile = files.find(f => f.path === fullRepoPath);

            const body: { message: string; content: string; branch: string; sha?: string; } = {
                message: commitMessage.replace(/\{file\}/g, relativePath).replace(/\{folder\}/g, relativePath.split('/')[0] || ''),
                content: contentBase64,
                branch: repoInfo.defaultBranch,
            };

            if (existingFile) {
                body.sha = existingFile.sha;
            }

            const response = await fetch(`https://api.github.com/repos/${repoInfo.path}/contents/${fullRepoPath}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(`Failed to upload ${fullRepoPath}: ${data.message}`);
            }
            
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        await handleFetchFiles(repoInfo.path);
    }, [filesToUpload, repoInfo, getHeaders, files, handleFetchFiles]);

    const handleDeleteFile = useCallback(async () => {
        if (!fileToDelete || !repoInfo) return;

        setIsDeleting(true);
        setError(null);

        try {
            const headers = getHeaders();
            const response = await fetch(`https://api.github.com/repos/${repoInfo.path}/contents/${fileToDelete.path}`, {
                method: 'DELETE',
                headers,
                body: JSON.stringify({
                    message: `Delete file: ${fileToDelete.path}`,
                    sha: fileToDelete.sha,
                    branch: repoInfo.defaultBranch,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to delete file from GitHub.');
            }

            setFileToDelete(null);
            await handleFetchFiles(repoInfo.path);

        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred while deleting the file.');
            // Close modal even on error so user can see the message
            if (e instanceof Error) {
                 setTimeout(() => setFileToDelete(null), 500);
            }
        } finally {
            setIsDeleting(false);
        }
    }, [fileToDelete, repoInfo, getHeaders, handleFetchFiles]);

    const handleCreateRepository = async (name: string, description: string, isPrivate: boolean) => {
        const headers = getHeaders();
        const response = await fetch('https://api.github.com/user/repos', {
            method: 'POST',
            headers,
            body: JSON.stringify({ name, description, private: isPrivate, auto_init: true })
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Failed to create repository.');
        }

        // Success
        setIsCreateRepoModalOpen(false);
        // Add to list and sort alphabetically
        setRepositories(prev => [data, ...prev].sort((a, b) => a.full_name.localeCompare(b.full_name)));
        // Automatically select the new repo, which will trigger file fetch
        setSelectedRepo(data.full_name);
        handleFetchFiles(data.full_name);
    };


    return (
        <>
            <details className="bg-slate-800/50 rounded-lg shadow-lg border border-slate-700 group" open>
                <summary className="p-4 list-none flex justify-between items-center cursor-pointer hover:bg-slate-800/70 rounded-t-lg">
                    <div className="flex items-center space-x-3">
                        <GitHubIcon />
                        <h2 className="text-xl font-semibold text-slate-300">GitHub Code Editor & Analyzer</h2>
                    </div>
                    <ChevronDownIcon />
                </summary>
                <div className="p-4 md:p-6 border-t border-slate-700 space-y-4">
                    <p className="text-sm text-slate-400">
                        Enter your GitHub Personal Access Token (PAT) to connect and see your repositories.
                    </p>
                    <div className="flex flex-col md:flex-row items-center gap-4">
                         <div className="relative w-full">
                             <input
                                type="password"
                                value={pat}
                                onChange={(e) => setPat(e.target.value)}
                                placeholder="Personal Access Token (PAT)"
                                className="bg-slate-700 border border-slate-600 rounded-md px-4 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                                aria-label="GitHub Personal Access Token"
                            />
                            <div className="group absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                                <InfoIcon className="w-5 h-5 text-slate-500" />
                                <div className="absolute bottom-full left-1/2 z-10 mb-2 w-80 -translate-x-1/2 transform rounded-lg bg-slate-900 p-3 text-sm text-slate-300 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 border border-slate-700 pointer-events-none">
                                    A PAT allows this app to list your repositories. Create one in your GitHub settings under Developer settings. The token requires the <code className="bg-slate-700 px-1 rounded-sm text-xs">repo</code> scope. This token is not saved and only used for your current session.
                                    <div className="absolute left-1/2 top-full -ml-2 h-0 w-0 -translate-x-1/2 border-x-8 border-t-8 border-x-transparent border-t-slate-900"></div>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleConnectToGitHub}
                            disabled={isConnecting || !pat}
                            className="w-full md:w-auto flex-shrink-0 flex items-center justify-center bg-slate-600 hover:bg-slate-500 disabled:bg-slate-800 disabled:cursor-not-allowed text-white font-bold py-2 px-6 rounded-md transition-colors duration-200"
                        >
                            {isConnecting ? 'Connecting...' : 'Connect to GitHub'}
                        </button>
                    </div>
                    
                    {isConnected && (
                        <div className="flex items-end gap-2">
                             <div className="flex-grow">
                                {repositories.length > 0 ? (
                                    <>
                                        <label htmlFor="repo-select" className="block text-sm font-medium text-slate-300 mb-1">
                                            Select Repository
                                        </label>
                                        <select
                                            id="repo-select"
                                            value={selectedRepo}
                                            onChange={handleRepoSelectionChange}
                                            className="bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                                        >
                                            <option value="">-- Select a Repository --</option>
                                            {repositories.map(repo => (
                                                <option key={repo.full_name} value={repo.full_name}>{repo.full_name}</option>
                                            ))}
                                        </select>
                                    </>
                                ) : !isConnecting && (
                                     <div className="text-sm text-slate-400 bg-slate-700/50 p-3 rounded-md mt-2">
                                        You don't have any repositories. Create one to get started!
                                    </div>
                                )}
                            </div>
                             <button
                                onClick={() => setIsCreateRepoModalOpen(true)}
                                className="flex-shrink-0 flex items-center gap-2 bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm"
                                title="Create New Repository"
                            >
                                <PlusIcon />
                                <span>New</span>
                            </button>
                        </div>
                    )}


                    <div className="mt-2">
                        {isLoadingFiles && <LoadingSpinner />}
                        {error && <div className="text-red-400 p-3 bg-red-900/20 rounded-md text-sm">{error}</div>}
                        {!isLoadingFiles && files.length > 0 && (
                            <div>
                                <div className="flex flex-col sm:flex-row justify-between items-center mb-3 gap-3">
                                <h3 className="text-lg font-semibold text-slate-300">
                                    Repository Files
                                </h3>
                                <div className="flex items-center gap-2">
                                    <input type="file" ref={fileInputRef} onChange={handleFileSelectedForUpload} className="hidden" />
                                    <input
                                        type="file"
                                        ref={folderInputRef}
                                        onChange={handleFolderSelected}
                                        className="hidden"
                                        {...{ webkitdirectory: "", directory: "", multiple: true }}
                                    />
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200 text-sm"
                                    >
                                        <UploadIcon />
                                        <span>Upload File</span>
                                    </button>
                                     <button
                                        onClick={() => folderInputRef.current?.click()}
                                        className="flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200 text-sm"
                                    >
                                        <FolderUpIcon />
                                        <span>Upload Folder</span>
                                    </button>
                                    <button
                                        onClick={() => setIsAiChatOpen(true)}
                                        className="flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200 text-sm"
                                    >
                                        <SparklesIcon />
                                        <span>Ask AI to Edit</span>
                                    </button>
                                </div>
                                </div>
                                <ul className="space-y-1 max-h-72 overflow-y-auto pr-2 border border-slate-700 rounded-md p-2 bg-slate-900/50">
                                    {files.map(file => (
                                        <li key={file.sha} className="flex items-center justify-between p-2 rounded-md hover:bg-slate-700/50 gap-2">
                                            <div className="flex items-center space-x-3 min-w-0">
                                                <FileIcon />
                                                <span className="text-sm text-slate-300 truncate" title={file.path}>{file.path}</span>
                                            </div>
                                             <div className="flex items-center space-x-2 flex-shrink-0">
                                                <button 
                                                    onClick={() => handleEditFile(file)}
                                                    disabled={loadingPreviewPath !== null || isDeleting}
                                                    className="text-xs font-semibold bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white px-3 py-1 rounded-md transition-colors duration-200 flex-shrink-0 w-28 text-center"
                                                >
                                                   {loadingPreviewPath === file.path ? <ButtonSpinner /> : 'Open & Edit'}
                                                </button>
                                                <button
                                                    onClick={() => setFileToDelete(file)}
                                                    disabled={loadingPreviewPath !== null || isDeleting}
                                                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-md transition-colors duration-200 disabled:cursor-not-allowed disabled:text-slate-600"
                                                    aria-label={`Delete ${file.path}`}
                                                >
                                                    <TrashIcon />
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </details>
            {editingFile && repoInfo && (
                <FileEditorModal
                    file={editingFile}
                    repoInfo={repoInfo}
                    files={files}
                    pat={pat}
                    onClose={() => setEditingFile(null)}
                    onImport={() => {
                        onFileImported(editingFile.content);
                        setEditingFile(null);
                    }}
                    onSaveSuccess={handleSaveSuccess}
                />
            )}
            {fileToUpload && repoInfo && (
                 <UploadFileModal
                    file={fileToUpload}
                    existingFiles={files}
                    repoPath={repoInfo.path}
                    onClose={() => setFileToUpload(null)}
                    onUpload={handleConfirmUpload}
                />
            )}
            {filesToUpload.length > 0 && repoInfo && (
                <UploadFolderModal
                    files={filesToUpload}
                    repoPath={repoInfo.path}
                    onClose={() => setFilesToUpload([])}
                    onUpload={handleStartFolderUpload}
                />
            )}
            {fileToDelete && (
                <DeleteConfirmationModal 
                    file={fileToDelete}
                    onClose={() => setFileToDelete(null)}
                    onConfirm={handleDeleteFile}
                    isDeleting={isDeleting}
                />
            )}
            {isAiChatOpen && repoInfo && (
                <GitHubAiChat
                    repoInfo={repoInfo}
                    files={files}
                    pat={pat}
                    onClose={() => setIsAiChatOpen(false)}
                    onPlanExecuted={() => handleFetchFiles(repoInfo.path)}
                />
            )}
            {isCreateRepoModalOpen && (
                <CreateRepoModal
                    onClose={() => setIsCreateRepoModalOpen(false)}
                    onCreate={handleCreateRepository}
                />
            )}
        </>
    );
}