import React, { useState } from 'react';
import { FilePlus, PenTool, FileText } from 'lucide-react';
import MergeTab from './components/MergeTab';
import SignatureTab from './components/SignatureTab';
import BeritaAcaraTab from './components/BeritaAcaraTab';
import SignatureBATab from './components/SignatureBATab';

export default function App() {
  const [activeTab, setActiveTab] = useState<'merge' | 'signature' | 'berita-acara' | 'signature-ba'>('merge');
  const [baPdfFile, setBaPdfFile] = useState<File | null>(null);

  const handleSignBA = (file: File) => {
    setBaPdfFile(file);
    setActiveTab('signature-ba');
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col">
      <header className="border-b border-slate-200 px-6 py-4 flex items-center justify-between print:hidden">
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
          <button
            onClick={() => setActiveTab('berita-acara')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              (activeTab === 'berita-acara' || activeTab === 'signature-ba') ? 'bg-slate-100 font-medium' : 'hover:bg-slate-50'
            }`}
          >
            <FileText size={18} />
            Berita Acara
          </button>
        </nav>
      </header>

      <main className={`mx-auto p-6 flex-1 w-full print:p-0 print:m-0 print:max-w-none ${(activeTab === 'berita-acara' || activeTab === 'signature-ba') ? 'max-w-7xl' : 'max-w-5xl'}`}>
        {activeTab === 'merge' && <MergeTab />}
        {activeTab === 'signature' && <SignatureTab />}
        {activeTab === 'berita-acara' && <BeritaAcaraTab onSignPDF={handleSignBA} />}
        {activeTab === 'signature-ba' && baPdfFile && (
          <SignatureBATab 
            file={baPdfFile} 
            onBack={() => setActiveTab('berita-acara')} 
          />
        )}
      </main>

      <footer className="border-t border-slate-200 mt-auto py-6 text-center text-sm text-slate-500 print:hidden">
        100% gratis . open-source . untuk menunjang tugas tim dilapangan
      </footer>
    </div>
  );
}
