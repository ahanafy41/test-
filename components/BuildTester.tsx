import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import { RepoContext } from './ApiTester';

// --- Icons ---
const PlayIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
    </svg>
);
const RefreshIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M15.312 11.342a1.25 1.25 0 01.938 2.308A8.001 8.001 0 014.688 3.658a1.25 1.25 0 012.308.938A5.5 5.5 0 0013.5 10a.75.75 0 011.5 0c0 .98-.222 1.898-.625 2.695a1.25 1.25 0 01-.563-1.353z" clipRule="evenodd" />
        <path fillRule="evenodd" d="M4.688 8.658a1.25 1.25 0 01-2.308-.938A8.001 8.001 0 0115.312 16.342a1.25 1.25 0 01-2.308-.938A5.5 5.5 0 006.5 10a.75.75 0 01-1.5 0c0-.98.222-1.898.625-2.695a1.25 1.25 0 011.063-1.353z" clipRule="evenodd" />
    </svg>
);
const CodeBracketIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M6.28 5.22a.75.75 0 010 1.06L2.56 10l3.72 3.72a.75.75 0 01-1.06 1.06L.97 10.53a.75.75 0 010-1.06l4.25-4.25a.75.75 0 011.06 0zm7.44 0a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L17.44 10l-3.72-3.72a.75.75 0 010-1.06zM11.378 2.011a.75.75 0 01.447 1.364L8.242 16.62a.75.75 0 01-1.364-.447L10.46 2.458a.75.75 0 01.918-.447z" clipRule="evenodd" />
    </svg>
);
const ChevronDownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 transition-transform duration-200 group-open:rotate-180">
        <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
    </svg>
);
const ButtonSpinner = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

interface BuildTesterProps {
    repoContext: RepoContext | null;
}

export function BuildTester({ repoContext }: BuildTesterProps): React.ReactNode {
    const [status, setStatus] = useState<'idle' | 'generating' | 'running' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);
    const [previewHtml, setPreviewHtml] = useState<string | null>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    const resetState = useCallback(() => {
        setStatus('idle');
        setError(null);
        setPreviewHtml(null);
    }, []);

    useEffect(() => {
        resetState();
    }, [repoContext, resetState]);


    const handleGeneratePreview = useCallback(async () => {
        if (!repoContext) return;

        setStatus('generating');
        setError(null);
        setPreviewHtml(null);

        try {
            const { files, pat, repoInfo } = repoContext;
            const sourceFiles = files.filter(f => 
                f.path.match(/\.(js|ts|jsx|tsx|html|css|json)$/i) &&
                !f.path.includes('lock') &&
                !f.path.startsWith('dist/') &&
                !f.path.startsWith('node_modules/')
            ).slice(0, 30); // Limit files to avoid huge prompts

            const fileContents = await Promise.all(sourceFiles.map(async file => {
                const headers = { 'Authorization': `token ${pat}`, 'Accept': 'application/vnd.github.v3.raw' };
                try {
                    const res = await fetch(`https://api.github.com/repos/${repoInfo.path}/contents/${file.path}`, { headers });
                    if (!res.ok) return { path: file.path, content: `/* Error fetching ${file.path} */` };
                    return { path: file.path, content: await res.text() };
                } catch (e) {
                     return { path: file.path, content: `/* Network error fetching ${file.path} */` };
                }
            }));
            
            const prompt = `
You are an intelligent, in-memory web application bundler and transpiler. Your task is to process a set of source files from a web project (which may use React, TypeScript, and JSX) and generate a single, self-contained \`index.html\` file that can run in a browser sandbox.

**CRITICAL BUILD PROCESS:**

1.  **Analyze Entry Point:** Find the main entry point, typically \`index.tsx\` or \`main.tsx\`. This file will bootstrap the application (e.g., using \`ReactDOM.createRoot\`).

2.  **Transpile and Bundle JavaScript/TypeScript:**
    *   Go through all provided \`.js\`, \`.ts\`, \`.jsx\`, and \`.tsx\` files.
    *   **Transpile:** Convert all TypeScript and JSX syntax into standard, browser-compatible JavaScript (ESM).
    *   **Combine:** Bundle all the transpiled JavaScript code into a SINGLE \`<script type="module">\` tag. The code must be ordered correctly to respect dependencies.
    *   **Handle Imports:**
        *   **NPM Packages:** Rewrite all bare module imports (e.g., \`import React from 'react';\`) to use the \`https://esm.sh/\` CDN. The rewritten import should be \`import React from 'https://esm.sh/react';\`.
        *   **Local Files:** Imports of local files (e.g., \`import App from './App';\`) should be handled by inlining the transpiled code of the imported file directly into the bundle. You are creating one giant script file.

3.  **Bundle CSS:**
    *   Find all CSS content. This might be in \`.css\` files or referenced via a CDN link in an existing \`index.html\` (like TailwindCSS).
    *   Combine all CSS rules into a single \`<style>\` tag inside the \`<head>\`.

4.  **Construct Final HTML:**
    *   Create a standard HTML5 document (\`<!DOCTYPE html>...\`).
    *   The \`<head>\` should contain the bundled \`<style>\` tag and any necessary meta tags.
    *   The \`<body>\` must contain the necessary root element for the app, usually \`<div id="root"></div>\`.
    *   Place the single, large, transpiled \`<script type="module">\` at the very end of the \`<body>\`.

**OUTPUT REQUIREMENTS:**
*   Your response MUST be **only the raw HTML code**.
*   Do NOT wrap it in markdown (\`\`\`html\`), JSON, or add any commentary.
*   Your output must start with \`<!DOCTYPE html>\` and end with \`</html>\`.

**PROJECT SOURCE FILES:**
${JSON.stringify(fileContents, null, 2)}

Generate the complete, runnable \`index.html\` file now.
`;
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response: GenerateContentResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash', // Using gemini-2.5-flash, the latest and most capable model from the 2.5 series for this task.
                contents: prompt,
                config: {
                    temperature: 0.2, // Lower temperature for more predictable and accurate code/HTML generation
                },
            });

            const htmlContent = response.text;
            if (!htmlContent || !htmlContent.trim().toLowerCase().startsWith('<!doctype html>')) {
                throw new Error("AI build process failed. It did not return valid HTML. This can happen with very complex projects or syntax errors in the source code. Please try again.");
            }

            setPreviewHtml(htmlContent);
            setStatus('running');

        } catch (e) {
            console.error("AI Preview Generation Error:", e);
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(`Preview Failed: ${errorMessage}`);
            setStatus('error');
        }
    }, [repoContext]);

    const handleReload = () => {
        if (iframeRef.current) {
            iframeRef.current.srcdoc = previewHtml || '';
        }
    };
    
    if (!repoContext) {
        return null;
    }
    
    const renderStatus = () => {
        switch (status) {
            case 'idle':
                return (
                    <button
                        onClick={handleGeneratePreview}
                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-md transition-colors duration-200"
                    >
                        <PlayIcon />
                        <span>Generate Live Preview</span>
                    </button>
                );
            case 'generating':
                return (
                     <div className="bg-slate-900 rounded-lg p-4 border border-slate-700 flex items-center justify-center gap-4">
                        <ButtonSpinner />
                        <h3 className="font-semibold text-slate-200 text-lg">
                            AI is building your live preview...
                        </h3>
                    </div>
                );
            case 'error':
                 return (
                    <div>
                        <div className="text-red-400 p-3 bg-red-900/20 rounded-md text-sm mb-4 break-words">
                            <p className="font-bold">An error occurred:</p>
                            <p>{error}</p>
                        </div>
                         <button
                            onClick={handleGeneratePreview}
                            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200 text-sm"
                        >
                            <RefreshIcon />
                            <span>Try Again</span>
                        </button>
                    </div>
                );
             case 'running':
                return (
                    <div className="space-y-3">
                        <div className="bg-slate-900 rounded-t-lg p-2 border border-b-0 border-slate-700 flex items-center justify-end gap-2">
                            <button onClick={handleReload} className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md" aria-label="Reload Preview">
                                <RefreshIcon />
                            </button>
                             <button onClick={resetState} className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md" aria-label="Close Preview">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l-3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
                            </button>
                        </div>
                        <iframe
                            ref={iframeRef}
                            srcDoc={previewHtml ?? ''}
                            title="Live Preview Sandbox"
                            className="w-full h-96 bg-white rounded-b-lg border border-t-0 border-slate-700"
                            sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
                        ></iframe>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <details className="bg-slate-800/50 rounded-lg shadow-lg border border-slate-700 group" open>
            <summary className="p-4 list-none flex justify-between items-center cursor-pointer hover:bg-slate-800/70 rounded-t-lg">
                <div className="flex items-center space-x-3">
                    <CodeBracketIcon />
                    <h2 className="text-xl font-semibold text-slate-300">App Sandbox & Live Preview</h2>
                </div>
                <ChevronDownIcon />
            </summary>
            <div className="p-4 md:p-6 border-t border-slate-700 space-y-4">
                 <p className="text-sm text-slate-400">
                   Click the button to have an AI build and run a live, interactive preview of your application directly in your browser.
                </p>
                {renderStatus()}
            </div>
        </details>
    );
}