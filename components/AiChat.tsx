import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { ApiResponse, ChatMessage } from '../types';

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

interface AiChatProps {
    response: ApiResponse;
}

export function AiChat({ response }: AiChatProps): React.ReactNode {
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Scroll to bottom when new messages are added
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
            });
            setChat(newChat);

            const prettyBody = typeof response.body === 'object' 
                ? JSON.stringify(response.body, null, 2)
                : String(response.body);
            
            const initialPrompt = `
                Analyze the following API response and provide a brief, helpful summary for a developer. 
                Explain what the status code means, what kind of data is in the body, and any potential next steps or things to watch out for.
                Keep the tone helpful and conversational.

                **Response Status:** ${response.status} ${response.statusText}
                
                **Response Headers:**
                \`\`\`json
                ${JSON.stringify(response.headers, null, 2)}
                \`\`\`

                **Response Body:**
                \`\`\`
                ${prettyBody} 
                \`\`\`
            `;

            const result = await newChat.sendMessage({ message: initialPrompt });
            
            setMessages([{ role: 'model', content: result.text }]);
        } catch (err) {
            console.error("AI chat initialization failed:", err);
            setError(err instanceof Error ? err.message : "An unexpected error occurred with the AI assistant.");
        } finally {
            setLoading(false);
        }
    }, [response]);

    useEffect(() => {
        initializeChat();
    }, [initializeChat]);


    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || !chat || loading) return;

        const newUserMessage: ChatMessage = { role: 'user', content: userInput };
        setMessages(prev => [...prev, newUserMessage]);
        setUserInput('');
        setLoading(true);
        setError(null);

        try {
            const result = await chat.sendMessage({ message: userInput });
            const aiResponse: ChatMessage = { role: 'model', content: result.text };
            setMessages(prev => [...prev, aiResponse]);
        } catch (err) {
            console.error("AI chat message failed:", err);
            setError(err instanceof Error ? err.message : "Failed to get a response from the AI assistant.");
            // Re-add user message to input if sending failed
            setUserInput(userInput);
            setMessages(prev => prev.slice(0, -1)); // remove the user message that failed
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[32rem] bg-slate-900/70 rounded-md">
            <div ref={chatContainerRef} className="flex-1 p-4 space-y-4 overflow-y-auto">
                {messages.map((msg, index) => (
                     <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        {msg.role === 'model' && <AiIcon />}
                        <div className={`max-w-xl p-3 rounded-lg ${msg.role === 'model' ? 'bg-slate-700 text-slate-200' : 'bg-indigo-600 text-white'}`}>
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                         {msg.role === 'user' && <UserIcon />}
                    </div>
                ))}
                {loading && (
                    <div className="flex items-start gap-3">
                        <AiIcon />
                        <div className="max-w-xl p-3 rounded-lg bg-slate-700 text-slate-200">
                           <LoadingDots />
                        </div>
                    </div>
                )}
            </div>

            {error && <div className="text-red-400 text-sm px-4 pb-2">{error}</div>}

            <div className="p-4 border-t border-slate-700">
                <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder="Ask a follow-up question..."
                        className="flex-grow bg-slate-700 border border-slate-600 rounded-md px-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={loading && messages.length === 0} // Disable only on initial load
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
