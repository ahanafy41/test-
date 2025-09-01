
import React from 'react';
import { ApiTester } from './components/ApiTester';

function App(): React.ReactNode {
  return (
    <main className="bg-slate-900 text-white min-h-screen font-sans">
      <div className="container mx-auto p-4 md:p-8">
        <header className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600">
            API Test Client
          </h1>
          <p className="text-slate-400 mt-2">
            Craft and test your API requests with ease.
          </p>
        </header>
        <ApiTester />
      </div>
    </main>
  );
}

export default App;
