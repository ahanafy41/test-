import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { ChatMessage, RepoInfo, GitHubFile } from '../types';

// Icons
const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-slate-400">
        <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
    </svg>
);

const AiIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-indigo-400">
        <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 0 0 1.5 12c0 1.828.508 3.533 1.348 5.005.342 1.24 1.519 1.905 2.66 1.905H6.44l4.5 4.5c.944.945 2.56.276 2.56-1.06V4.06Z" />
        <path d="M17.25 7.5a.75.75 0 0 0 0 1.5h.01a.75.75 0 0 0 0-1.5h-.01ZM16.5 12a.75.75 0 0 1 .75-.75h.01a.75.75 0 0 1 0 1.5h-.01a.75.75 0 0 1-.75-.75ZM17.25 16.5a.75.75 0 0 0 0 1.5h.01a.75.75 0 0 0 0-1.5h-.01Z" />
    </svg>
);

const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
    </svg>
);

const LoadingDots = () => (
    <div className="flex space-x-1 items-center">
        <span className="w-2 h-2 bg-slate-300 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
        <span className="w-2 h-2 bg-slate-300 rounded-full animate-pulse [animation-delay:-0.15s]"></span>
        <span className="w-2 h-2 bg-slate-300 rounded-full animate-pulse"></span>
    </div>
);

interface FileAiChatProps {
    filePath: string;
    fileContent: string;
    repoInfo: RepoInfo;
    files: GitHubFile[];
    pat: string;
    onApplyChanges: (newContent: string) => void;
}

export function FileAiChat({ filePath, fileContent, repoInfo, files, pat, onApplyChanges }: FileAiChatProps): React.ReactNode {
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const initializeChat = useCallback(async () => {
        setLoading(true);
        setError(null);
        setMessages([]);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const newChat = ai.chats.create({
                model: 'gemini-2.5-flash', // Using gemini-2.5-flash, the latest and most capable model from the 2.5 series for this task.
                config: {
                    temperature: 0.2, // Lower temperature for more predictable code generation
                    tools: [{googleSearch: {}}],
                },
            });
            setChat(newChat);
            
            const headers = { 'Authorization': `token ${pat}`, 'Accept': 'application/vnd.github.v3+json' };
            const CONTEXT_CHAR_LIMIT = 150000;
            const ignoredFiles = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'];
            const ignoredExtensions = ['.svg', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.webp', '.pdf', '.zip', '.gz'];

            let combinedContent = `The user is currently editing this file. Its content is most important.\n\n--- CURRENT FILE: ${filePath} ---\n\`\`\`\n${fileContent}\n\`\`\`\n`;
            
            const otherFiles = files.filter(f => {
                if (f.path === filePath) return false;
                const fileName = f.path.toLowerCase();
                return !ignoredFiles.some(ignored => fileName.endsWith(ignored)) && !ignoredExtensions.some(ext => fileName.endsWith(ext));
            });
            
            const BATCH_SIZE = 10;
            for (let i = 0; i < otherFiles.length; i += BATCH_SIZE) {
                if (combinedContent.length >= CONTEXT_CHAR_LIMIT) break;

                const batch = otherFiles.slice(i, i + BATCH_SIZE);
                const promises = batch.map(file => 
                    fetch(`https://api.github.com/repos/${repoInfo.path}/contents/${file.path}?ref=${repoInfo.defaultBranch}`, { headers })
                        .then(res => res.ok ? res.json() : null)
                        .then(data => {
                            if (data && data.content) {
                                const content = decodeURIComponent(escape(atob(data.content)));
                                return { path: file.path, content };
                            }
                            return null;
                        })
                        .catch(e => {
                            console.warn(`Could not fetch ${file.path}`, e);
                            return null;
                        })
                );

                const results = await Promise.all(promises);

                for (const result of results) {
                    if (!result || combinedContent.length >= CONTEXT_CHAR_LIMIT) continue;

                    const contentToAdd = `\n\n--- FILE: ${result.path} ---\n\`\`\`\n${result.content}\n\`\`\`\n`;

                    if (combinedContent.length + contentToAdd.length > CONTEXT_CHAR_LIMIT) {
                        const remainingSpace = CONTEXT_CHAR_LIMIT - combinedContent.length;
                        if (remainingSpace > 200) {
                            const truncatedContent = result.content.substring(0, remainingSpace - 150);
                            combinedContent += `\n\n--- FILE: ${result.path} ---\n\`\`\`\n${truncatedContent}\n... (file truncated)\n\`\`\`\n`;
                        }
                        break;
                    } else {
                        combinedContent += contentToAdd;
                    }
                }
            }
            
            const fileTree = files.map(f => f.path === filePath ? `- ${f.path} (currently editing)` : `- ${f.path}`).join('\n');

            const initialPrompt = `
                You are an expert AI software engineer with full context of an entire repository. 
                Your primary task is to help me modify the code for the file I currently have open: \`${filePath}\`.

                You have been provided with the full content of the current file, along with the content of other relevant files and the complete file structure of the repository. Use this context to make intelligent, repository-aware suggestions.

                **CRITICAL INSTRUCTIONS:**
                1.  **Focus on the Current File:** My main goal is to modify \`${filePath}\`. When I ask for code changes, you **MUST** respond with the **complete, updated content of the entire \`${filePath}\` file**.
                2.  **Output Format for Code:** Your response for code changes must contain ONLY the code, enclosed in a single markdown code block (e.g., \`\`\`tsx ... \`\`\`). Do not add any extra explanations or text before or after the code block unless I explicitly ask for an explanation.
                3.  **Cross-File Awareness:** If my request requires changes in OTHER files, please describe those changes in plain English first, and then provide the code block for the changes in \`${filePath}\`. You cannot edit other files directly.
                4.  **Web Search:** You have access to Google Search to find up-to-date information, library documentation, or code examples. If you use search, you **must** cite your sources.
                5.  **Be Concise:** Keep your explanations brief and to the point.

                **REPOSITORY CONTEXT:**
                - **Repository:** ${repoInfo.path}
                - **Full File Structure:**
                ${fileTree}
                - **File Contents:**
                ${combinedContent}

                I am now ready for your assistance. Please start by providing a brief, one-paragraph summary of what the current file (\`${filePath}\`) does, considering its role within the entire project.
            `;

            const result = await newChat.sendMessage({ message: initialPrompt });
            
            setMessages([{ role: 'model', content: result.text }]);
        } catch (err) {
            console.error("AI chat initialization failed:", err);
            setError(err instanceof Error ? err.message : "An unexpected error occurred with the AI assistant.");
        } finally {
            setLoading(false);
        }
    }, [filePath, fileContent, repoInfo, files, pat]);

    useEffect(() => {
        initializeChat();
    }, [initializeChat]);


    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || !chat || loading) return;

        const newUserMessage: ChatMessage = { role: 'user', content: userInput };
        setMessages(prev => [...prev, newUserMessage]);
        const currentInput = userInput;
        setUserInput('');
        setLoading(true);
        setError(null);

        try {
            const result = await chat.sendMessage({ message: currentInput });
            const citationsFromApi = result.candidates?.[0]?.groundingMetadata?.groundingChunks;
            const validCitations: ChatMessage['citations'] = citationsFromApi
                ?.filter(c => c.web?.uri && c.web?.title)
                .map(c => ({
                    web: {
                        uri: c.web!.uri!,
                        title: c.web!.title!,
                    }
                }));

            const aiResponse: ChatMessage = { 
                role: 'model', 
                content: result.text,
                citations: validCitations?.length ? validCitations : undefined
            };
            setMessages(prev => [...prev, aiResponse]);
        } catch (err) {
            console.error("AI chat message failed:", err);
            setError(err instanceof Error ? err.message : "Failed to get a response from the AI assistant.");
            setUserInput(currentInput);
            setMessages(prev => prev.slice(0, -1));
        } finally {
            setLoading(false);
        }
    };

    const extractCodeFromMarkdown = (content: string): string | null => {
        const codeBlockRegex = /```(?:\w+)?\n([\s\S]+?)\n```/;
        const match = content.match(codeBlockRegex);
        return match ? match[1].trim() : null;
    };

    return (
        <div className="flex flex-col h-full bg-slate-900/70 rounded-md border border-slate-700">
            <div ref={chatContainerRef} className="flex-1 p-4 space-y-4 overflow-y-auto">
                {messages.map((msg, index) => {
                     const code = msg.role === 'model' ? extractCodeFromMarkdown(msg.content) : null;
                     return (
                     <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        {msg.role === 'model' && <AiIcon />}
                        <div className={`w-full max-w-xl p-3 rounded-lg ${msg.role === 'model' ? 'bg-slate-700 text-slate-200' : 'bg-indigo-600 text-white'}`}>
                            <div className="text-sm whitespace-pre-wrap prose prose-sm prose-invert max-w-none">{msg.content}</div>
                             {code && (
                                <button
                                    onClick={() => onApplyChanges(code)}
                                    className="mt-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-1.5 px-3 rounded-md transition-colors"
                                >
                                    Apply Changes to Editor
                                </button>
                            )}
                            {msg.citations && (
                                <div className="mt-3 pt-3 border-t border-slate-600">
                                    <h5 className="text-xs font-semibold text-slate-400 mb-1">Sources:</h5>
                                    <ul className="text-xs space-y-1">
                                        {msg.citations.map((citation, idx) => (
                                            <li key={idx} className="flex items-center gap-2">
                                                <span className="flex-shrink-0 bg-slate-800 text-slate-300 rounded-full w-4 h-4 text-center text-[10px] leading-4">{idx + 1}</span>
                                                <a href={citation.web.uri} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline truncate" title={citation.web.title}>
                                                    {citation.web.title}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                         {msg.role === 'user' && <UserIcon />}
                    </div>
                    )
                })}
                {loading && (
                    <div className="flex items-start gap-3">
                        <AiIcon />
                        <div className="max-w-xl p-3 rounded-lg bg-slate-700 text-slate-200">
                           <LoadingDots />
                        </div>
                    </div>
                )}
                 {error && <div className="text-red-400 text-sm p-3 bg-red-900/20 rounded-md">{error}</div>}
            </div>

            <div className="p-4 border-t border-slate-700">
                <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder="e.g., 'Refactor this to use async/await'"
                        className="flex-grow bg-slate-700 border border-slate-600 rounded-md px-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={loading && messages.length === 0}
                    />
                    <button
                        type="submit"
                        disabled={loading || !userInput.trim()}
                        className="flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-bold p-2.5 rounded-md transition-colors duration-200"
                        aria-label="Send message"
                    >
                       <SendIcon />
                    </button>
                </form>
            </div>
        </div>
    );
}