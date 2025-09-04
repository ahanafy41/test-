import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Chat, GenerateContentResponse } from '@google/genai';
import { RepoInfo, GitHubFile, ChatMessage, AgentAction } from '../types';

// --- Icons ---
const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
        <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l-3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
    </svg>
);

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

const ButtonSpinner = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const CreateIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-green-400">
        <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
        <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
    </svg>
);

const UpdateIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-yellow-400">
        <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
    </svg>
);

const DeleteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-red-400">
        <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.58.22-2.365.468a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
    </svg>
);

const MoveIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-blue-400">
      <path fillRule="evenodd" d="M5.22 14.78a.75.75 0 001.06 0l7.22-7.22v5.69a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75h-7.5a.75.75 0 000 1.5h5.69l-7.22 7.22a.75.75 0 000 1.06z" clipRule="evenodd" />
    </svg>
);

const CopyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-purple-400">
        <path d="M7 3.5A1.5 1.5 0 018.5 2h6A1.5 1.5 0 0116 3.5v10.5a1.5 1.5 0 01-1.5 1.5h-6A1.5 1.5 0 017 15.5V14H5.5A1.5 1.5 0 014 12.5v-6A1.5 1.5 0 015.5 5H7V3.5zM5.5 6.5v6h6V6.5h-6z" />
        <path d="M8.5 4a.5.5 0 00-.5.5V14h6.5V4a.5.5 0 00-.5.5h-5.5z" />
    </svg>
);


interface GitHubAiChatProps {
    repoInfo: RepoInfo;
    files: GitHubFile[];
    pat: string;
    onClose: () => void;
    onPlanExecuted: () => void;
}

export function GitHubAiChat({ repoInfo, files, pat, onClose, onPlanExecuted }: GitHubAiChatProps): React.ReactNode {
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [loadingMessage, setLoadingMessage] = useState<string>('جاري تحضير المساعد الذكي...');
    const [error, setError] = useState<string | null>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const [actionPlan, setActionPlan] = useState<AgentAction[] | null>(null);
    const [isExecuting, setIsExecuting] = useState(false);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages, actionPlan, isExecuting]);

    const getHeaders = useCallback(() => ({
        'Authorization': `token ${pat}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
    }), [pat]);

    const initializeAgent = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            setMessages([]);
            setLoadingMessage('جاري تحليل ملفات المشروع...');
            
            const fileTree = files.map(f => `- ${f.path}`).join('\n');
            
            const systemInstruction = `
You are 'Fahim' (فاهم), an expert AI software engineer. You are friendly and helpful, and you communicate **exclusively in Egyptian Arabic.** Your job is to help the user modify their GitHub repository.

**Your Personality:**
*   You are collaborative and friendly. Use Egyptian slang (e.g., 'يا باشا', 'تمام', 'عينيا', 'يا هندسة').
*   You explain things simply.

**YOUR MOST IMPORTANT RULE: THE TWO-STEP WORKFLOW**
You **MUST** follow this two-step process for EVERY user request to modify files. There are no exceptions.

**Step 1: Propose the Plan (Conversation)**
*   When the user asks you to make a change, your FIRST response is **ALWAYS** a conversational message in Egyptian Arabic.
*   In this message, you will:
    1.  Acknowledge the request.
    2.  Propose a step-by-step plan for how you will achieve it. Explain *why* you are doing each step.
    3.  **ALWAYS** end your message by asking the user for their confirmation to proceed. Use phrases like 'إيه رأيك؟', 'تمام كده؟', or 'أبدأ تنفيذ؟'.
*   **NEVER, EVER** include a JSON code block in this first step. This step is for discussion only.

**Step 2: Execute the Plan (JSON Output)**
*   **ONLY AFTER** the user gives you explicit approval (e.g., 'نفذ', 'تمام', 'ايوة', 'ok'), your **very next response** MUST be a single, valid JSON code block and NOTHING ELSE.
*   This JSON block must contain the array of actions to be executed.
*   **DO NOT** write any Egyptian Arabic or any other text before or after the JSON block in this step. Your entire response must be just the JSON.

**Example Conversation Flow:**
*   **User:** اعملي صفحة جديدة اسمها about.
*   **You (Step 1):** عينيا يا هندسة. عشان أعملك الصفحة دي، هعمل ملف جديد اسمه \`src/about.js\` وأحط فيه كود بسيط. وبعدين لازم نعدل ملف \`src/App.js\` عشان يظهر لينك للصفحة الجديدة. إيه رأيك في الخطة دي؟
*   **User:** تمام، نفذ.
*   **You (Step 2):** \`\`\`json
    [
      {
        "action_type": "CREATE_FILE",
        "file_path": "src/about.js",
        "content": "export default function About() { return <h1>About Page</h1>; }",
        "explanation": "Create the new About page component."
      }
    ]
    \`\`\`

**Other Capabilities:**
*   **Google Search:** You can search the web for information. If you do, you **must** cite your sources.

**JSON Action Structure (For Step 2 ONLY):**
Your JSON output must be an array of "action" objects. Each object must have an \`action_type\`, an \`explanation\`, and other properties based on the action type.
*   **Create/Update File:** \`action_type\`: \`"CREATE_FILE"\` or \`"UPDATE_FILE"\`, \`file_path\`: string, \`content\`: string
*   **Delete File:** \`action_type\`: \`"DELETE_FILE"\`, \`file_path\`: string
*   **Delete Folder:** \`action_type\`: \`"DELETE_FOLDER"\`, \`folder_path\`: string
*   **Move/Rename:** \`action_type\`: \`"MOVE_FILE"\` or \`"MOVE_FOLDER"\`, \`source_path\`: string, \`destination_path\`: string
*   **Copy:** \`action_type\`: \`"COPY_FILE"\` or \`"COPY_FOLDER"\`, \`source_path\`: string, \`destination_path\`: string

**Repository Context:**
- **Repository:** ${repoInfo.path}
- **Full File Structure:**
${fileTree}

**IMPORTANT:** You do not have the content of these files. You MUST create your plan based on the file paths and your general knowledge of software development. Make reasonable assumptions about the file contents based on their names and locations.

Now, start the conversation by introducing yourself and asking how you can help, in Egyptian Arabic.
`;
            
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const newChat = ai.chats.create({ 
                model: 'gemini-2.5-flash',
                config: {
                    systemInstruction: systemInstruction,
                    temperature: 0.2,
                    tools: [{googleSearch: {}}],
                },
            });
            setChat(newChat);

            const result = await newChat.sendMessage({ message: "أهلاً" });
            if (result.text) {
                 setMessages([{ role: 'model', content: result.text }]);
            }

        } catch (err) {
            setError(err instanceof Error ? err.message : "An unexpected error occurred during AI initialization.");
        } finally {
            setIsLoading(false);
        }
    }, [repoInfo, files, pat]);
    
    useEffect(() => {
        initializeAgent();
    }, [initializeAgent]);
    
    const parseAiResponse = (text: string): AgentAction[] | null => {
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
        const jsonString = jsonMatch ? jsonMatch[1] : text.trim();
        try {
            if (!jsonString.startsWith('[') || !jsonString.endsWith(']')) {
                return null;
            }
            const parsed = JSON.parse(jsonString);
            if (Array.isArray(parsed) && (parsed.length === 0 || parsed.every(item => item.action_type && item.explanation))) {
                return parsed;
            }
            return null;
        } catch (e) {
            return null;
        }
    };


    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || !chat || isLoading || isExecuting) return;

        const newUserMessage: ChatMessage = { role: 'user', content: userInput };
        setMessages(prev => [...prev, newUserMessage]);
        const currentInput = userInput;
        setUserInput('');
        setIsLoading(true);
        setError(null);
        setActionPlan(null);

        try {
            const response: GenerateContentResponse = await chat.sendMessage({ message: currentInput });
            
            const plan = parseAiResponse(response.text);
            const citationsFromApi = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
            const validCitations: ChatMessage['citations'] = citationsFromApi
                ?.filter(c => c.web?.uri && c.web?.title)
                .map(c => ({
                    web: {
                        uri: c.web!.uri!,
                        title: c.web!.title!,
                    }
                }));

            if (plan && plan.length > 0) {
                setActionPlan(plan);
            } else if (plan && plan.length === 0) {
                 setMessages(prev => [...prev, { role: 'model', content: "للأسف، مقدرتش أعمل خطة بالطلب ده. ممكن تجرب تشرحه بطريقة تانية؟" }]);
            } else {
                const aiResponse: ChatMessage = { 
                    role: 'model', 
                    content: response.text,
                    citations: validCitations?.length ? validCitations : undefined
                };
                setMessages(prev => [...prev, aiResponse]);
            }

        } catch (err) {
            console.error("AI chat message failed:", err);
            const errorMessage = err instanceof Error ? err.message : "Failed to get a response from the AI assistant.";
            setError(errorMessage);
            setMessages(prev => [...prev, {role: 'model', content: `عفواً، حصل خطأ: ${errorMessage}`}]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleExecutePlan = async () => {
        if (!actionPlan) return;
        setIsExecuting(true);
        setError(null);

        let currentFilesState = [...files];

        for (const [index, action] of actionPlan.entries()) {
            setLoadingMessage(`بنفذ خطوة ${index + 1}/${actionPlan.length}: ${action.explanation}`);
            try {
                const url = `https://api.github.com/repos/${repoInfo.path}/contents/`;
                const headers = getHeaders();

                if (action.action_type === 'CREATE_FILE' || action.action_type === 'UPDATE_FILE') {
                    if (!action.file_path) throw new Error("Missing file_path for CREATE/UPDATE action.");
                    const existingFile = currentFilesState.find(f => f.path === action.file_path);

                    if (action.action_type === 'UPDATE_FILE' && !existingFile) {
                        throw new Error(`AI tried to update a non-existent file: ${action.file_path}. Please ask it to create the file first.`);
                    }
                    if (action.action_type === 'CREATE_FILE' && existingFile) {
                        throw new Error(`AI tried to create a file that already exists: ${action.file_path}. Please ask it to update the file instead.`);
                    }

                    const contentBase64 = btoa(unescape(encodeURIComponent(action.content || '')));
                    const body: { message: string; content: string; branch: string; sha?: string } = {
                        message: `AI Agent: ${action.explanation}`,
                        content: contentBase64,
                        branch: repoInfo.defaultBranch,
                    };
                    if (action.action_type === 'UPDATE_FILE' && existingFile) {
                        body.sha = existingFile.sha;
                    }

                    const res = await fetch(url + action.file_path, { method: 'PUT', headers, body: JSON.stringify(body) });
                    const data = await res.json();
                    if (!res.ok) {
                        throw new Error(`Failed to ${action.action_type} ${action.file_path}: ${data.message}`);
                    }

                    const newFileData = data.content;
                    const newFileState: GitHubFile = { path: newFileData.path, type: 'blob', sha: newFileData.sha };
                    const existingIndex = currentFilesState.findIndex(f => f.path === newFileData.path);
                    if (existingIndex > -1) {
                        currentFilesState[existingIndex] = newFileState;
                    } else {
                        currentFilesState.push(newFileState);
                    }
                } else if (action.action_type === 'DELETE_FILE') {
                    if (!action.file_path) throw new Error("Missing file_path for DELETE_FILE action.");
                    const fileToDelete = currentFilesState.find(f => f.path === action.file_path);
                    if (!fileToDelete) {
                        console.warn(`Attempted to delete a file that was not in the state: ${action.file_path}. Skipping.`);
                        continue;
                    }

                    const res = await fetch(url + action.file_path, {
                        method: 'DELETE',
                        headers,
                        body: JSON.stringify({
                            message: `AI Agent: ${action.explanation}`,
                            sha: fileToDelete.sha,
                            branch: repoInfo.defaultBranch
                        })
                    });
                    if (!res.ok && res.status !== 404) {
                        const data = await res.json();
                        throw new Error(`Failed to delete ${action.file_path}: ${data.message}`);
                    }
                    currentFilesState = currentFilesState.filter(f => f.path !== action.file_path);
                } else if (action.action_type === 'MOVE_FILE') {
                    if (!action.source_path || !action.destination_path) throw new Error("Missing source or destination path for MOVE_FILE action.");
                    const sourceFile = currentFilesState.find(f => f.path === action.source_path);
                    if (!sourceFile) throw new Error(`Source file for move not found: ${action.source_path}`);
                    
                    const contentRes = await fetch(url + action.source_path, { headers });
                    const contentData = await contentRes.json();
                    if (!contentRes.ok) throw new Error(`Could not fetch content for ${action.source_path} to move it.`);

                    const createRes = await fetch(url + action.destination_path, {
                        method: 'PUT',
                        headers,
                        body: JSON.stringify({
                            message: `AI Agent: ${action.explanation} (create destination)`,
                            content: contentData.content,
                            branch: repoInfo.defaultBranch,
                        })
                    });
                    const createData = await createRes.json();
                    if (!createRes.ok) throw new Error(`Failed to create destination file ${action.destination_path}: ${createData.message}`);
                    
                    const deleteRes = await fetch(url + action.source_path, {
                        method: 'DELETE', headers,
                        body: JSON.stringify({
                            message: `AI Agent: ${action.explanation} (delete source)`,
                            sha: sourceFile.sha,
                            branch: repoInfo.defaultBranch
                        })
                    });
                    if (!deleteRes.ok) throw new Error(`Failed to delete source file ${action.source_path} after move.`);

                    currentFilesState = currentFilesState.filter(f => f.path !== action.source_path);
                    const newFileState: GitHubFile = { path: createData.content.path, type: 'blob', sha: createData.content.sha };
                    currentFilesState.push(newFileState);
                
                } else if (action.action_type === 'DELETE_FOLDER') {
                    if (!action.folder_path) throw new Error("Missing folder_path for DELETE_FOLDER action.");
                    const filesToDelete = currentFilesState.filter(f => f.path.startsWith(action.folder_path + '/'));
                    const sortedFilesToDelete = filesToDelete.sort((a, b) => b.path.split('/').length - a.path.split('/').length);

                    for (const file of sortedFilesToDelete) {
                        setLoadingMessage(`Deleting from folder: ${file.path}`);
                        const res = await fetch(url + file.path, { 
                            method: 'DELETE', 
                            headers, 
                            body: JSON.stringify({ message: `AI Agent: ${action.explanation}`, sha: file.sha, branch: repoInfo.defaultBranch })
                        });
                        if (!res.ok && res.status !== 404) {
                             const data = await res.json();
                             throw new Error(`Failed to delete file ${file.path} from folder: ${data.message}`);
                        }
                    }
                    currentFilesState = currentFilesState.filter(f => !f.path.startsWith(action.folder_path + '/'));
                } else if (action.action_type === 'COPY_FILE' || action.action_type === 'MOVE_FOLDER' || action.action_type === 'COPY_FOLDER') {
                    throw new Error(`Action type ${action.action_type} is too complex and not supported in this version to guarantee stability. Please ask the AI to perform simpler, file-by-file operations.`);
                }
            } catch (e) {
                const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
                setError(`فشل التنفيذ في الخطوة ${index + 1}. الخطأ: ${errorMessage}`);
                setIsExecuting(false);
                return;
            }
        }

        setIsExecuting(false);
        setActionPlan(null);
        setMessages(prev => [...prev, { role: 'model', content: "✅ تمام، الخطة اتنفذت بنجاح والملفات اتحدثت." }]);
        onPlanExecuted();
    };

    const renderActionPlan = () => {
        if (!actionPlan) return null;

        const actionIcons: { [key in AgentAction['action_type']]: React.ReactNode } = {
            CREATE_FILE: <CreateIcon />,
            UPDATE_FILE: <UpdateIcon />,
            DELETE_FILE: <DeleteIcon />,
            DELETE_FOLDER: <DeleteIcon />,
            MOVE_FILE: <MoveIcon />,
            MOVE_FOLDER: <MoveIcon />,
            COPY_FILE: <CopyIcon />,
            COPY_FOLDER: <CopyIcon />,
        };

        const getActionTitle = (action: AgentAction) => {
            switch (action.action_type) {
                case 'CREATE_FILE':
                case 'UPDATE_FILE':
                case 'DELETE_FILE':
                    return <span className="font-mono text-cyan-400">{action.file_path}</span>;
                case 'DELETE_FOLDER':
                    return <span className="font-mono text-cyan-400">{action.folder_path}</span>;
                case 'MOVE_FILE':
                case 'MOVE_FOLDER':
                case 'COPY_FILE':
                case 'COPY_FOLDER':
                    return <span className="font-mono text-cyan-400">{action.source_path} → {action.destination_path}</span>;
                default:
                    return null;
            }
        };

        return (
            <div className="bg-slate-700/50 p-4 rounded-lg my-4 border border-slate-600">
                <h4 className="text-md font-semibold text-slate-200 mb-3">الخطة المقترحة للتنفيذ:</h4>
                <ul className="space-y-2">
                    {actionPlan.map((action, index) => (
                        <li key={index} className="flex items-start gap-3 p-2 bg-slate-800 rounded-md">
                           <div className="flex-shrink-0 pt-0.5">{actionIcons[action.action_type]}</div>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-300 truncate">
                                    {action.action_type.replace('_', ' ')}: {getActionTitle(action)}
                                </p>
                                <p className="text-xs text-slate-400">{action.explanation}</p>
                            </div>
                        </li>
                    ))}
                </ul>
                <div className="mt-4 flex justify-end gap-3">
                    <button 
                        onClick={() => setActionPlan(null)}
                        disabled={isExecuting}
                        className="text-sm font-semibold text-slate-300 hover:text-white px-4 py-2 rounded-md disabled:opacity-50"
                    >
                        إلغاء
                    </button>
                    <button 
                        onClick={handleExecutePlan}
                        disabled={isExecuting}
                        className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-6 rounded-md transition-colors w-40 flex items-center justify-center disabled:bg-green-800"
                    >
                        {isExecuting ? <ButtonSpinner /> : 'موافقة وتنفيذ'}
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col">
                <header className="flex items-center justify-between p-4 border-b border-slate-700 flex-shrink-0">
                    <h3 className="text-lg font-semibold text-slate-200 truncate">
                        المساعد الذكي 'فاهم' للمشروع: <span className="font-mono bg-slate-700/50 px-2 py-1 rounded-md">{repoInfo.path}</span>
                    </h3>
                    <button onClick={onClose} className="p-1 rounded-md hover:bg-slate-700 text-slate-400" aria-label="Close AI Chat">
                        <CloseIcon />
                    </button>
                </header>
                
                <div ref={chatContainerRef} className="flex-1 p-4 space-y-4 overflow-y-auto">
                    {messages.map((msg, index) => (
                         <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                            {msg.role === 'model' && <AiIcon />}
                            <div className={`max-w-2xl p-3 rounded-lg ${msg.role === 'model' ? 'bg-slate-700 text-slate-200' : 'bg-indigo-600 text-white'}`}>
                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                {msg.citations && (
                                    <div className="mt-3 pt-3 border-t border-slate-600">
                                        <h5 className="text-xs font-semibold text-slate-400 mb-1">المصادر:</h5>
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
                    ))}
                    {actionPlan && !isExecuting && renderActionPlan()}

                    {isLoading && (
                        <div className="flex items-start gap-3">
                            <AiIcon />
                            <div className="max-w-xl p-3 rounded-lg bg-slate-700 text-slate-200">
                               <p className="text-sm">{loadingMessage}</p>
                            </div>
                        </div>
                    )}
                    {isExecuting && !isLoading && (
                        <div className="flex items-start gap-3">
                            <AiIcon />
                            <div className="max-w-xl p-3 rounded-lg bg-slate-700 text-slate-200">
                               <p className="text-sm">{loadingMessage}</p>
                            </div>
                        </div>
                    )}
                </div>
                
                {error && <div className="text-red-400 text-sm px-4 pb-2 text-center">{error}</div>}

                <footer className="p-4 border-t border-slate-700 flex-shrink-0">
                    <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                        <input
                            type="text"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            placeholder={isLoading || isExecuting ? "لحظة من فضلك..." : "مثال: 'اعملي كومبوننت جديدة للوجين'"}
                            className="flex-grow bg-slate-700 border border-slate-600 rounded-md px-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={isLoading || isExecuting || actionPlan !== null}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || isExecuting || !userInput.trim() || actionPlan !== null}
                            className="flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-bold p-2.5 rounded-md transition-colors duration-200"
                            aria-label="Send message"
                        >
                           <SendIcon />
                        </button>
                    </form>
                </footer>
            </div>
        </div>
    );
}