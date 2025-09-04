import React, { useState, useCallback } from 'react';
import { HttpMethod, KeyValuePair, ApiResponse, ApiError, FoundApi, RepoInfo, GitHubFile } from '../types';
import { KeyValueEditor } from './KeyValueEditor';
import { CodeEditor } from './CodeEditor';
import { ResponseDisplay } from './ResponseDisplay';
import { GitHubImporter } from './GitHubImporter';
import { ApiFinder } from './ApiFinder';
import { LocalFileImporter } from './LocalFileImporter';

const METHODS_WITH_BODY = [HttpMethod.POST, HttpMethod.PUT, HttpMethod.PATCH];

export interface RepoContext {
    repoInfo: RepoInfo;
    files: GitHubFile[];
    pat: string;
}

const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
    </svg>
);

const InfoIcon = (props: React.ComponentProps<'svg'>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
);


export function ApiTester(): React.ReactNode {
    const [url, setUrl] = useState<string>('https://jsonplaceholder.typicode.com/todos/1');
    const [method, setMethod] = useState<HttpMethod>(HttpMethod.GET);
    const [headers, setHeaders] = useState<KeyValuePair[]>([{ id: '1', key: 'Content-Type', value: 'application/json' }]);
    const [body, setBody] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'headers' | 'body'>('headers');

    const [response, setResponse] = useState<ApiResponse | null>(null);
    const [error, setError] = useState<ApiError | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    
    const [selectedProxy, setSelectedProxy] = useState<string>('none');
    const [customProxyUrl, setCustomProxyUrl] = useState<string>('');

    const [repoContext, setRepoContext] = useState<RepoContext | null>(null);


    const handleSendRequest = useCallback(async () => {
        setLoading(true);
        setError(null);
        setResponse(null);

        const startTime = Date.now();

        let validatedUrl = url;
        try {
            if (!validatedUrl) {
                throw new Error("URL cannot be empty.");
            }
            // Add protocol if missing for validation
            if (!/^https?:\/\//i.test(validatedUrl)) {
                validatedUrl = 'https://' + validatedUrl;
            }
            new URL(validatedUrl);
        } catch (e) {
            setError({ message: e instanceof Error ? e.message : 'Invalid URL format.' });
            setLoading(false);
            return;
        }

        let finalUrl = url;
        if (selectedProxy !== 'none') {
            const proxyUrl = selectedProxy === 'custom' ? customProxyUrl : selectedProxy;
            if (proxyUrl) {
                finalUrl = `${proxyUrl.trim()}${url}`;
            }
        }

        const requestHeaders = new Headers();
        headers.forEach(header => {
            if (header.key && !header.key.startsWith('//')) { // Ignore commented out headers
                requestHeaders.append(header.key, header.value);
            }
        });

        try {
            const res = await fetch(finalUrl, {
                method,
                headers: requestHeaders,
                body: METHODS_WITH_BODY.includes(method) ? body : undefined,
            });

            const endTime = Date.now();
            const responseTime = endTime - startTime;

            const responseHeaders: Record<string, string> = {};
            res.headers.forEach((value, key) => {
                responseHeaders[key] = value;
            });
            
            const contentType = res.headers.get('content-type');
            let responseBody: any;
            if (contentType && contentType.includes('application/json')) {
                try {
                    responseBody = await res.json();
                } catch (jsonError) {
                    // Handle cases where content-type is json but body is empty or invalid
                    responseBody = await res.text();
                }
            } else {
                responseBody = await res.text();
            }

            setResponse({
                status: res.status,
                statusText: res.statusText,
                headers: responseHeaders,
                body: responseBody,
                time: responseTime,
            });

        } catch (e) {
            setError({ message: e instanceof Error ? e.message : 'An unknown error occurred.' });
        } finally {
            setLoading(false);
        }
    }, [url, method, headers, body, selectedProxy, customProxyUrl]);

    const handleFileImported = useCallback((content: string) => {
        if (!METHODS_WITH_BODY.includes(method)) {
            setMethod(HttpMethod.POST);
        }
        setBody(content);
        setActiveTab('body');
    }, [method]);

    const handleApiFound = useCallback((api: FoundApi) => {
        setUrl(api.url);
        setMethod(api.method);

        if (api.body) {
            setBody(api.body);
            if (METHODS_WITH_BODY.includes(api.method)) {
                setActiveTab('body');
            }
        } else {
            setBody('');
        }
        
        const newHeaders: KeyValuePair[] = [];
        if (api.headers) {
            Object.entries(api.headers).forEach(([key, value], index) => {
                newHeaders.push({ id: `found-header-${index}-${key}`, key, value });
            });
        }

        if (api.body && !newHeaders.some(h => h.key.toLowerCase() === 'content-type')) {
            newHeaders.unshift({ id: 'content-type-default', key: 'Content-Type', value: 'application/json' });
        }

        if (newHeaders.length === 0) {
            newHeaders.push({ id: 'content-type-default', key: 'Content-Type', value: 'application/json' });
        }
        
        setHeaders(newHeaders);
        setActiveTab('headers');

    }, []);

    return (
        <div className="space-y-8">
            <GitHubImporter onFileImported={handleFileImported} onRepoContextChange={setRepoContext} />
            <ApiFinder onApiSelect={handleApiFound} />
            <LocalFileImporter onFileImported={handleFileImported} />

            <div className="bg-slate-800 rounded-lg p-4 md:p-6 shadow-lg border border-slate-700">
                <h2 className="text-xl font-semibold mb-4 text-slate-300">Request</h2>
                <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-2">
                    <select
                        value={method}
                        onChange={(e) => setMethod(e.target.value as HttpMethod)}
                        className="bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-auto"
                        aria-label="HTTP Method"
                    >
                        {Object.values(HttpMethod).map(m => <option key={m}>{m}</option>)}
                    </select>
                    <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://api.example.com/data"
                        className="flex-grow bg-slate-700 border border-slate-600 rounded-md px-4 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                        aria-label="Request URL"
                    />
                    <button
                        onClick={handleSendRequest}
                        disabled={loading}
                        className="flex items-center justify-center space-x-2 w-full md:w-auto bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-bold py-2 px-6 rounded-md transition-colors duration-200"
                    >
                        <SendIcon />
                        <span>{loading ? 'Sending...' : 'Send'}</span>
                    </button>
                </div>
                
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 md:gap-x-4 items-center">
                    <div className="flex items-center space-x-2">
                        <label htmlFor="proxy-select" className="text-sm text-slate-300 font-medium flex-shrink-0">CORS Proxy:</label>
                        <select
                            id="proxy-select"
                            value={selectedProxy}
                            onChange={(e) => setSelectedProxy(e.target.value)}
                            className="bg-slate-700 border border-slate-600 rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                            aria-label="CORS Proxy Selection"
                        >
                            <option value="none">None</option>
                            <option value="https://corsproxy.io/?">Proxy 1 (corsproxy.io)</option>
                            <option value="https://cors-anywhere.herokuapp.com/">Proxy 2 (herokuapp)</option>
                            <option value="custom">Custom...</option>
                        </select>
                        <div className="group relative flex items-center">
                            <InfoIcon className="w-5 h-5 text-slate-500" />
                            <div className="absolute bottom-full left-1/2 z-10 mb-2 w-72 -translate-x-1/2 transform rounded-lg bg-slate-900 p-3 text-sm text-slate-300 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 border border-slate-700 pointer-events-none">
                                Routes your request through a server to bypass browser CORS errors. Public proxies can be unreliable, have rate limits, or may require visiting their homepage to activate. Use 'Custom' to provide your own proxy URL.
                                <div className="absolute left-1/2 top-full -ml-2 h-0 w-0 -translate-x-1/2 border-x-8 border-t-8 border-x-transparent border-t-slate-900"></div>
                            </div>
                        </div>
                    </div>
                     {selectedProxy === 'custom' && (
                        <div className="mt-2 md:mt-0">
                            <input
                                type="text"
                                value={customProxyUrl}
                                onChange={(e) => setCustomProxyUrl(e.target.value)}
                                placeholder="https://your-proxy.com/"
                                className="bg-slate-700 border border-slate-600 rounded-md px-3 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                                aria-label="Custom Proxy URL"
                            />
                        </div>
                    )}
                </div>


                <div className="mt-6">
                    <div className="border-b border-slate-700 flex space-x-4">
                        <button 
                            onClick={() => setActiveTab('headers')}
                            className={`py-2 px-4 text-sm font-medium focus:outline-none ${activeTab === 'headers' ? 'border-b-2 border-blue-500 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            Headers
                        </button>
                        {METHODS_WITH_BODY.includes(method) && (
                           <button 
                                onClick={() => setActiveTab('body')}
                                className={`py-2 px-4 text-sm font-medium focus:outline-none ${activeTab === 'body' ? 'border-b-2 border-blue-500 text-white' : 'text-slate-400 hover:text-white'}`}
                            >
                                Body
                            </button>
                        )}
                    </div>
                    <div className="pt-4">
                        {activeTab === 'headers' && (
                            <KeyValueEditor items={headers} setItems={setHeaders} keyPlaceholder="Header" valuePlaceholder="Value" addItemText="+ Add Header" />
                        )}
                        {activeTab === 'body' && METHODS_WITH_BODY.includes(method) && (
                            <CodeEditor value={body} onChange={(e) => setBody(e.target.value)} placeholder="Request body (e.g., JSON)" />
                        )}
                    </div>
                </div>
            </div>

            <ResponseDisplay response={response} error={error} loading={loading} />
        </div>
    );
}