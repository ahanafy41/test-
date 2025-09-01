
import React from 'react';
import { KeyValuePair } from '../types';

interface KeyValueEditorProps {
    items: KeyValuePair[];
    setItems: React.Dispatch<React.SetStateAction<KeyValuePair[]>>;
    keyPlaceholder?: string;
    valuePlaceholder?: string;
    addItemText?: string;
}

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.58.22-2.365.468a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
    </svg>
);


export function KeyValueEditor({ items, setItems, keyPlaceholder, valuePlaceholder, addItemText }: KeyValueEditorProps): React.ReactNode {
    
    const updateItem = (id: string, field: 'key' | 'value', value: string) => {
        setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const addItem = () => {
        setItems([...items, { id: Date.now().toString(), key: '', value: '' }]);
    };
    
    const removeItem = (id: string) => {
        setItems(items.filter(item => item.id !== id));
    };

    return (
        <div className="space-y-2">
            {items.map(item => (
                <div key={item.id} className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={item.key}
                        onChange={(e) => updateItem(item.id, 'key', e.target.value)}
                        placeholder={keyPlaceholder || 'Key'}
                        className="flex-grow bg-slate-700 border border-slate-600 rounded-md px-3 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                        type="text"
                        value={item.value}
                        onChange={(e) => updateItem(item.id, 'value', e.target.value)}
                        placeholder={valuePlaceholder || 'Value'}
                        className="flex-grow bg-slate-700 border border-slate-600 rounded-md px-3 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        onClick={() => removeItem(item.id)}
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-700 rounded-md"
                        aria-label="Remove item"
                    >
                        <TrashIcon />
                    </button>
                </div>
            ))}
            <button
                onClick={addItem}
                className="text-sm font-semibold text-blue-400 hover:text-blue-300 pt-2"
            >
                {addItemText || '+ Add Item'}
            </button>
        </div>
    );
}