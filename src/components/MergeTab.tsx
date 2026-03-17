import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { PDFDocument } from 'pdf-lib';
import { File, Trash2, ArrowUp, ArrowDown, Download, UploadCloud } from 'lucide-react';

export default function MergeTab() {
  const [files, setFiles] = useState<File[]>([]);
  const [isMerging, setIsMerging] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] }
  } as any);

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newFiles = [...files];
    [newFiles[index - 1], newFiles[index]] = [newFiles[index], newFiles[index - 1]];
    setFiles(newFiles);
  };

  const moveDown = (index: number) => {
    if (index === files.length - 1) return;
    const newFiles = [...files];
    [newFiles[index + 1], newFiles[index]] = [newFiles[index], newFiles[index + 1]];
    setFiles(newFiles);
  };

  const handleMerge = async () => {
    if (files.length < 2) return;
    setIsMerging(true);
    try {
      const mergedPdf = await PDFDocument.create();
      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }
      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'merged.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error merging PDFs:", error);
      alert("Failed to merge PDFs.");
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Merge PDF Files</h2>
        <p className="text-slate-500">Combine multiple PDFs into one unified document.</p>
      </div>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-red-500 bg-red-50' : 'border-slate-300 hover:border-slate-400 bg-slate-50'
        }`}
      >
        <input {...getInputProps()} />
        <UploadCloud className="mx-auto h-12 w-12 text-slate-400 mb-4" />
        <p className="text-lg font-medium text-slate-700">
          {isDragActive ? "Drop the PDFs here..." : "Drag & drop PDFs here, or click to select"}
        </p>
        <p className="text-sm text-slate-500 mt-2">Only .pdf files are supported</p>
      </div>

      {files.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <ul className="divide-y divide-slate-100">
            {files.map((file, index) => (
              <li key={`${file.name}-${index}`} className="flex items-center justify-between p-4 hover:bg-slate-50">
                <div className="flex items-center gap-3 overflow-hidden">
                  <File className="text-red-500 flex-shrink-0" />
                  <span className="truncate font-medium text-slate-700">{file.name}</span>
                  <span className="text-xs text-slate-400 flex-shrink-0">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => moveUp(index)} disabled={index === 0} className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30">
                    <ArrowUp size={18} />
                  </button>
                  <button onClick={() => moveDown(index)} disabled={index === files.length - 1} className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30">
                    <ArrowDown size={18} />
                  </button>
                  <button onClick={() => removeFile(index)} className="p-1 text-red-400 hover:text-red-600 ml-2">
                    <Trash2 size={18} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
            <button
              onClick={handleMerge}
              disabled={files.length < 2 || isMerging}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Download size={18} />
              {isMerging ? 'Merging...' : 'Merge PDFs'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
