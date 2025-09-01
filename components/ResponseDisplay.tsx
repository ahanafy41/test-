import React, { useState, useCallback, useEffect } from 'react';
import { ApiResponse, ApiError } from '../types';
import { CodeEditor } from './CodeEditor';
import { AiChat } from './AiChat';

interface ResponseDisplayProps {
    response: ApiResponse | null;
    error: ApiError | null;
    loading: boolean;
}

const getStatusColor = (status: number): string => {
    if (status >= 200 && status < 300) return 'text-green-400';
    if (status >= 300 && status < 400) return 'text-yellow-400';
    if (status >= 400 && status < 500) return 'text-orange-400';
    if (status >= 500) return 'text-red-400';
    return 'text-slate-400';
};

const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
    </div>
);

const WelcomeMessage = () => (
    <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mb-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.375a6.375 6.375 0 0 0 6.375-6.375a6.375 6.375 0 0 0-6.375-6.375a6.375 6.375 0 0 0-6.375 6.375a6.375 6.375 0 0 0 6.375 6.375Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 12.75h.007v.008H12v-.008Z" />
        </svg>
        <h3 className="text-xl font-semibold">Ready to send</h3>
        <p>Your API response will appear here once you send a request.</p>
    </div>
);

const CopyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);


export function ResponseDisplay({ response, error, loading }: ResponseDisplayProps): React.ReactNode {
    const [activeTab, setActiveTab] = useState<'body' | 'headers' | 'ai'>('body');
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        if (response) {
            setActiveTab('body');
        }
    }, [response]);

    const handleCopy = useCallback(() => {
        if (!response?.body) return;

        const bodyToCopy = typeof response.body === 'object' 
            ? JSON.stringify(response.body, null, 2) 
            : String(response.body);

        navigator.clipboard.writeText(bodyToCopy).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }).catch(err => {
            console.error('Failed to copy response body:', err);
        });
    }, [response]);

    return (
        <div className="bg-slate-800 rounded-lg shadow-lg border border-slate-700 min-h-[30rem]">
            <div className="p-4 md:p-6 border-b border-slate-700">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-slate-300">Response</h2>
                    {response && (
                        <div className="flex items-center space-x-4 text-sm">
                            <span className="flex items-center">
                                <span className="mr-2 text-slate-400">Status:</span>
                                <span className={`font-bold ${getStatusColor(response.status)}`}>
                                    {response.status} {response.statusText}
                                </span>
                            </span>
                             <span className="flex items-center">
                                <span className="mr-2 text-slate-400">Time:</span>
                                <span className="font-bold text-blue-400">{response.time} ms</span>
                            </span>
                        </div>
                    )}
                </div>
            </div>

            <div className="p-4 md:p-6">
                {loading && <LoadingSpinner />}
                {error && <div className="text-red-400 p-4 bg-red-900/20 rounded-md">{error.message}</div>}
                {!loading && !error && !response && <WelcomeMessage />}
                
                {response && (
                    <div>
                         <div className="flex justify-between items-center border-b border-slate-700 mb-4">
                            <div className="flex space-x-4">
                                <button 
                                    onClick={() => setActiveTab('body')}
                                    className={`py-2 px-4 text-sm font-medium focus:outline-none ${activeTab === 'body' ? 'border-b-2 border-blue-500 text-white' : 'text-slate-400 hover:text-white'}`}
                                >
                                    Body
                                </button>
                                <button 
                                    onClick={() => setActiveTab('headers')}
                                    className={`py-2 px-4 text-sm font-medium focus:outline-none ${activeTab === 'headers' ? 'border-b-2 border-blue-500 text-white' : 'text-slate-400 hover:text-white'}`}
                                >
                                    Headers
                                </button>
                                <button 
                                    onClick={() => setActiveTab('ai')}
                                    className={`py-2 px-4 text-sm font-medium focus:outline-none ${activeTab === 'ai' ? 'border-b-2 border-blue-500 text-white' : 'text-slate-400 hover:text-white'}`}
                                >
                                    AI Insights <span role="img" aria-label="sparkles">✨</span>
                                </button>
                            </div>
                            
                            {activeTab === 'body' && (
                                <button
                                    onClick={handleCopy}
                                    className={`flex items-center text-sm px-3 py-1 rounded-md transition-colors duration-200 ${
                                        isCopied 
                                            ? 'bg-green-600 text-white' 
                                            : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                                    }`}
                                    aria-label="Copy response body"
                                >
                                    {isCopied ? <CheckIcon /> : <CopyIcon />}
                                    <span className="ml-2">{isCopied ? 'Copied!' : 'Copy'}</span>
                                </button>
                            )}
                        </div>
                        
                        {activeTab === 'body' && (
                           <CodeEditor
                                value={typeof response.body === 'object' ? JSON.stringify(response.body, null, 2) : String(response.body)}
                                readOnly={true}
                           />
                        )}
                        {activeTab === 'headers' && (
                             <div className="space-y-1 text-sm text-slate-300 font-mono">
                                {Object.entries(response.headers).map(([key, value]) => (
                                    <div key={key} className="flex">
                                        <span className="text-slate-400 w-1/3 break-all">{key}:</span>
                                        <span className="w-2/3 break-all">{value}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        {activeTab === 'ai' && <AiChat response={response} />}
                    </div>
                )}
            </div>
        </div>
    );
}