import React, { useState, useCallback } from 'react';
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import { FoundApi, HttpMethod } from '../types';

// --- Icons ---
const MagicWandIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
        <path d="M9.522 2.152a.75.75 0 01.956 0l1.24 1.24a.75.75 0 001.06 0l1.239-1.239a.75.75 0 011.06 1.06l-1.239 1.239a.75.75 0 000 1.06l1.24 1.24a.75.75 0 010 1.06l-1.24 1.24a.75.75 0 00-1.06 0l-1.24 1.24a.75.75 0 01-1.06 0l-1.24-1.24a.75.75 0 00-1.06 0l-1.24 1.24a.75.75 0 01-1.06 0l-1.239-1.24a.75.75 0 00-1.06 0l-1.24 1.24a.75.75 0 01-1.06-1.06l1.24-1.24a.75.75 0 000-1.06L2.152 6.47a.75.75 0 010-1.06l1.24-1.24a.75.75 0 000-1.06L2.152 1.87a.75.75 0 011.06 1.06l1.24 1.239a.75.75 0 001.06 0l1.24-1.24a.75.75 0 011.06 0l1.24 1.24a.75.75 0 001.06 0l1.24-1.24zM14.28 8.22a.75.75 0 00-1.06-1.06l-1.24 1.24a.75.75 0 11-1.06-1.06l1.24-1.24a.75.75 0 00-1.06-1.06l-1.24 1.24a.75.75 0 01-1.06 0L6.62 5.04a.75.75 0 00-1.06 1.06l1.24 1.24a.75.75 0 010 1.06l-1.24 1.24a.75.75 0 001.06 1.06l1.24-1.24a.75.75 0 011.06 0l1.24 1.24a.75.75 0 001.06 0l1.24-1.24a.75.75 0 010-1.06l1.24-1.24a.75.75 0 000-1.06l-1.24-1.24z" />
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

const FlaskIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1.5">
        <path fillRule="evenodd" d="M10 2a.75.75 0 0 1 .75.75v1.252a3.745 3.745 0 0 1 2.973 3.744l.261 2.605a3.5 3.5 0 0 1-3.483 3.901H9.5a3.5 3.5 0 0 1-3.483-3.901l.26-2.605A3.745 3.745 0 0 1 9.25 4.002V2.75A.75.75 0 0 1 10 2Zm0 13.5a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z" clipRule="evenodd" />
    </svg>
);

const InfoCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0 text-sky-400">
        <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM9 9a1 1 0 0 0 0 2v3a1 1 0 0 0 1 1h1a1 1 0 1 0 0-2v-3a1 1 0 0 0-1-1H9z" clipRule="evenodd" />
    </svg>
);

const TestTubeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0 text-lime-400">
        <path fillRule="evenodd" d="M10 2a.75.75 0 0 1 .75.75v1.252a3.745 3.745 0 0 1 2.973 3.744l.261 2.605a3.5 3.5 0 0 1-3.483 3.901H9.5a3.5 3.5 0 0 1-3.483-3.901l.26-2.605A3.745 3.745 0 0 1 9.25 4.002V2.75A.75.75 0 0 1 10 2ZM8.6 14.25a.75.75 0 0 1 .288-1.423 2.009 2.009 0 0 0 2.223 0 .75.75 0 1 1 .874 1.135 3.51 3.51 0 0 1-3.971 0A.75.75 0 0 1 8.6 14.25Z" clipRule="evenodd" />
    </svg>
);


interface ApiFinderProps {
    onApiSelect: (api: FoundApi) => void;
}

export function ApiFinder({ onApiSelect }: ApiFinderProps): React.ReactNode {
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [results, setResults] = useState<FoundApi[]>([]);

    const handleFindApis = useCallback(async () => {
        if (!query.trim()) {
            setError("Please enter a description of the API you want to find.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setResults([]);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const prompt = `
You are a meticulous and accurate API discovery expert. Your task is to find public APIs that are a DIRECT and PRECISE match for the user's query: "${query}".

**CRITICAL INSTRUCTIONS:**
1.  **Relevance is Paramount:** Only return APIs that are highly relevant to the user's query. It is better to return zero results than irrelevant ones. Do not provide "similar" or "alternative" APIs unless the query is very broad.
2.  **Verify Endpoints:** The 'url' field MUST be a live, callable API endpoint. Do NOT provide links to websites, documentation pages, or sign-up forms. The URL should be immediately usable for a test request.
3.  **Accuracy is Essential:** Use Google Search to find the most up-to-date information. Cross-reference information if possible to ensure the API is still active and functions as described. Discard any APIs that seem outdated or have broken documentation links.
4.  **Simplicity First:** Prioritize APIs that are free, public, and do NOT require an API key or complex authentication (like OAuth). If an API key is simple to get (e.g., from a free sign-up), you can include it, but you must clearly state this in the usage explanation.

**OUTPUT FORMAT:**
- Your entire response MUST be a single JSON code block containing a JSON array.
- Do not include any text before or after the JSON block.
- If no suitable APIs are found, return an empty array \`[]\`.

**JSON Object Structure for each API:**
- "name": Short, descriptive name (e.g., "Get Random Cat Fact").
- "description": One-sentence summary of what the API does.
- "url": The full, working, and callable API endpoint URL.
- "method": The HTTP method (GET, POST, PUT, PATCH, DELETE).
- "headers": (Object) Required or example headers. Use an empty object \`{}\` if none are needed.
- "body": (String) A stringified JSON example request body if required. Otherwise, an empty string \`""\`.
- "usage_explanation": A clear explanation of how to use this endpoint. Mention any important query parameters and what to expect in the response. State if an API key is needed.
- "test_in_app_example": A simple, one-sentence instruction for testing this API in the current application.

**Example of a PERFECT response for a query like "random user generator":**
\`\`\`json
[
  {
    "name": "Get a random user",
    "description": "Fetches data for a single random user from the Random User Generator API.",
    "url": "https://randomuser.me/api/",
    "method": "GET",
    "headers": {},
    "body": "",
    "usage_explanation": "This GET endpoint retrieves a randomly generated user profile, including name, address, email, and more. The response is in JSON format. You can add query parameters like '?gender=female' to filter results. No API key is required.",
    "test_in_app_example": "Click 'Test This API' and hit 'Send' to get a new random user profile in the response."
  }
]
\`\`\`
`;

            const response: GenerateContentResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash', // Using gemini-2.5-flash, the latest and most capable model from the 2.5 series for this task.
                contents: prompt,
                config: {
                    tools: [{ googleSearch: {} }],
                    temperature: 0.2, // Lower temperature for more factual and precise API finding
                }
            });

            const text = response.text;
            let parsedResults: any[] = [];
            const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
            
            if (jsonMatch && jsonMatch[1]) {
                 parsedResults = JSON.parse(jsonMatch[1]);
            } else {
                 // Fallback for when the model doesn't use markdown
                try {
                    parsedResults = JSON.parse(text.trim());
                } catch (e) {
                     throw new Error("The AI returned a response in an unexpected format. Please try again.");
                }
            }

            if (!Array.isArray(parsedResults)) {
                 throw new Error("The AI response was not a valid list of APIs.");
            }
            
            // Validation of fields
            const validResults = parsedResults.filter(r => 
                r.url && r.method && r.name && r.description &&
                r.usage_explanation && r.test_in_app_example &&
                Object.values(HttpMethod).includes(r.method as HttpMethod)
            );

            if (validResults.length === 0 && parsedResults.length > 0) {
                 setError("The AI found some APIs, but they were in an invalid format. You can try asking again.");
            } else if (validResults.length === 0) {
                setError("No suitable APIs were found for your query. Please try rephrasing your request to be more specific or more broad.");
            }

            setResults(validResults);

        } catch (e) {
            console.error("AI API Finder Error:", e);
            setError(e instanceof Error ? e.message : 'An unknown error occurred while finding APIs.');
            setResults([]);
        } finally {
            setIsLoading(false);
        }

    }, [query]);
    
    return (
        <details className="bg-slate-800/50 rounded-lg shadow-lg border border-slate-700 group">
            <summary className="p-4 list-none flex justify-between items-center cursor-pointer hover:bg-slate-800/70 rounded-t-lg">
                <div className="flex items-center space-x-3">
                    <MagicWandIcon />
                    <h2 className="text-xl font-semibold text-slate-300">AI API Finder</h2>
                </div>
                <ChevronDownIcon />
            </summary>
            <div className="p-4 md:p-6 border-t border-slate-700">
                <p className="text-sm text-slate-400 mb-4">
                    Describe the kind of API you're looking for, and our AI assistant will search the web to find it for you.
                </p>
                <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-2">
                     <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleFindApis()}
                        placeholder="e.g., A free API for currency conversion"
                        className="flex-grow bg-slate-700 border border-slate-600 rounded-md px-4 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                        aria-label="API search query"
                    />
                    <button
                        onClick={handleFindApis}
                        disabled={isLoading}
                        className="flex items-center justify-center w-full md:w-auto bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-bold py-2 px-6 rounded-md transition-colors duration-200"
                    >
                        {isLoading ? 'Finding...' : 'Find APIs'}
                    </button>
                </div>
                <div className="mt-6">
                    {isLoading && <LoadingSpinner />}
                    {error && <div className="text-red-400 p-3 bg-red-900/20 rounded-md text-sm">{error}</div>}
                    {results.length > 0 && (
                        <div className="space-y-3">
                             <h3 className="text-lg font-semibold text-slate-300">
                                Found APIs
                            </h3>
                            <ul className="space-y-4">
                                {results.map((api, index) => (
                                    <li key={index} className="bg-slate-900/50 border border-slate-700 rounded-lg">
                                        <details className="group">
                                            <summary className="p-4 list-none flex justify-between items-center cursor-pointer">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-blue-400 truncate" title={api.name}>{api.name}</p>
                                                    <p className="text-sm text-slate-400 mt-1">{api.description}</p>
                                                </div>
                                                <ChevronDownIcon />
                                            </summary>
                                            <div className="p-4 border-t border-slate-700 space-y-4">
                                                <div>
                                                    <h4 className="text-sm font-semibold text-slate-300 mb-2">Endpoint</h4>
                                                    <p className="text-xs text-slate-400 font-mono bg-slate-800 p-2 rounded-md break-all">
                                                        <span className={`font-bold ${
                                                            api.method === 'GET' ? 'text-green-400' : 
                                                            api.method === 'POST' ? 'text-orange-400' : 
                                                            api.method === 'PUT' ? 'text-yellow-400' :
                                                            api.method === 'PATCH' ? 'text-purple-400' :
                                                            api.method === 'DELETE' ? 'text-red-400' :
                                                            'text-gray-400'
                                                        }`}>{api.method}</span> {api.url}
                                                    </p>
                                                </div>
                                                
                                                <div>
                                                    <h4 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                                                        <InfoCircleIcon /> Usage Explanation
                                                    </h4>
                                                    <p className="text-sm text-slate-400">{api.usage_explanation}</p>
                                                </div>

                                                <div>
                                                    <h4 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                                                        <TestTubeIcon /> How to Test
                                                    </h4>
                                                    <p className="text-sm text-slate-400">{api.test_in_app_example}</p>
                                                </div>

                                                <button
                                                    onClick={() => onApiSelect(api)}
                                                    className="flex items-center justify-center bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200 text-sm w-full md:w-auto mt-2"
                                                >
                                                    <FlaskIcon />
                                                    Test This API
                                                </button>
                                            </div>
                                        </details>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </details>
    );
}