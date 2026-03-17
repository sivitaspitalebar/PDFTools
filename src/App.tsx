import React, { useState } from 'react';
import { FilePlus, PenTool } from 'lucide-react';
import MergeTab from './components/MergeTab';
import SignatureTab from './components/SignatureTab';

export default function App() {
  const [activeTab, setActiveTab] = useState<'merge' | 'signature'>('merge');

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col">
      <header className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* LOGO P ADA DI SINI */}
          <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
          <h1 className="text-xl font-bold">PDF Tools</h1>
        </div>
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('merge')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === 'merge' ? 'bg-slate-100 font-medium' : 'hover:bg-slate-50'
            }`}
          >
            <FilePlus size={18} />
            Merge PDF
          </button>
          <button
            onClick={() => setActiveTab('signature')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === 'signature' ? 'bg-slate-100 font-medium' : 'hover:bg-slate-50'
            }`}
          >
            <PenTool size={18} />
            Sign PDF
          </button>
        </nav>
      </header>

      <main className="max-w-5xl mx-auto p-6 flex-1 w-full">
        {activeTab === 'merge' ? <MergeTab /> : <SignatureTab />}
      </main>

      <footer className="border-t border-slate-200 mt-auto py-6 text-center text-sm text-slate-500">
        100% gratis . open-source . untuk menunjang tugas tim dilapangan
      </footer>
    </div>
  );
}
