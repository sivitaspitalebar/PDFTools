import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { PDFDocument } from 'pdf-lib';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import SignatureCanvas from 'react-signature-canvas';
import { UploadCloud, Download, X, PenTool, Move, Loader2 } from 'lucide-react';

// Set worker for react-pdf using the exact version it requires
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PlacedSignature {
  id: string;
  url: string;
  x: number;
  y: number;
  page: number;
}

export default function SignatureTab() {
  const [file, setFile] = useState<File | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNum, setPageNum] = useState(1);
  
  const [pdfError, setPdfError] = useState<string | null>(null);
  
  const sigCanvasRef = useRef<SignatureCanvas>(null);
  
  const [signatures, setSignatures] = useState<PlacedSignature[]>([]);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [containerWidth, setContainerWidth] = useState<number>(800);

  const containerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const pdfWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateWidth = () => {
      if (pdfWrapperRef.current) {
        // Subtract padding (32px = 2rem total padding)
        setContainerWidth(pdfWrapperRef.current.clientWidth - 32);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    
    // Also use ResizeObserver for more robust tracking
    let observer: ResizeObserver | null = null;
    if (pdfWrapperRef.current && window.ResizeObserver) {
      observer = new ResizeObserver(updateWidth);
      observer.observe(pdfWrapperRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateWidth);
      if (observer) observer.disconnect();
    };
  }, [file]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setSignatures([]);
      setActiveDragId(null);
      setPdfError(null);
      setPageNum(1);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1
  } as any);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPdfError(null);
  }

  function onDocumentLoadError(error: Error) {
    console.error("Error loading PDF:", error);
    setPdfError(error.message || "Failed to load PDF file.");
  }

  const addSignature = () => {
    if (sigCanvasRef.current && !sigCanvasRef.current.isEmpty()) {
      const url = sigCanvasRef.current.getCanvas().toDataURL('image/png');
      setSignatures(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          url,
          x: 50,
          y: 50,
          page: pageNum
        }
      ]);
      sigCanvasRef.current.clear();
    }
  };

  const clearSignature = () => {
    if (sigCanvasRef.current) {
      sigCanvasRef.current.clear();
    }
  };

  // Dragging logic for signature image
  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    setActiveDragId(id);
    
    // Calculate offset from top-left of the signature image
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!activeDragId || !containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    
    let newX = e.clientX - containerRect.left - dragOffset.x;
    let newY = e.clientY - containerRect.top - dragOffset.y;
    
    // Constrain to canvas
    const maxX = containerRect.width - 150; // approx sig width
    const maxY = containerRect.height - 50; // approx sig height
    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));

    setSignatures(sigs => sigs.map(sig => 
      sig.id === activeDragId ? { ...sig, x: newX, y: newY } : sig
    ));
  };

  const handleMouseUp = () => {
    setActiveDragId(null);
  };

  const handleApplySignature = async () => {
    if (!file || signatures.length === 0 || !pageRef.current) return;
    setIsProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDocLib = await PDFDocument.load(arrayBuffer);
      const pages = pdfDocLib.getPages();

      const uiWidth = pageRef.current.clientWidth;
      const uiHeight = pageRef.current.clientHeight;

      for (const sig of signatures) {
        const page = pages[sig.page - 1];
        if (!page) continue;

        // Fetch signature image
        const sigImageBytes = await fetch(sig.url).then(res => res.arrayBuffer());
        const sigImage = await pdfDocLib.embedPng(sigImageBytes);

        // Calculate coordinates
        const pdfWidth = page.getWidth();
        const pdfHeight = page.getHeight();
        
        const scaleX = pdfWidth / uiWidth;
        const scaleY = pdfHeight / uiHeight;

        const sigWidth = 150; // Rendered width in UI
        const sigHeight = (sigImage.height / sigImage.width) * sigWidth;

        // Convert UI coordinates to PDF coordinates
        // pdf-lib origin is bottom-left, UI origin is top-left
        const pdfX = sig.x * scaleX;
        const pdfY = pdfHeight - ((sig.y + sigHeight) * scaleY);

        page.drawImage(sigImage, {
          x: pdfX,
          y: pdfY,
          width: sigWidth * scaleX,
          height: sigHeight * scaleY,
        });
      }

      const pdfBytes = await pdfDocLib.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `signed_${file.name}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error applying signature:", error);
      alert("Failed to apply signature.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Sign PDF Document</h2>
        <p className="text-slate-500">Add your signature to a PDF file easily.</p>
      </div>

      {!file ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-red-500 bg-red-50' : 'border-slate-300 hover:border-slate-400 bg-slate-50'
          }`}
        >
          <input {...getInputProps()} />
          <UploadCloud className="mx-auto h-12 w-12 text-slate-400 mb-4" />
          <p className="text-lg font-medium text-slate-700">
            {isDragActive ? "Drop the PDF here..." : "Drag & drop a PDF here, or click to select"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Controls & Signature Pad */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-700 truncate" title={file.name}>
                  {file.name}
                </h3>
                <button onClick={() => setFile(null)} className="text-slate-400 hover:text-red-500">
                  <X size={20} />
                </button>
              </div>
              
              {numPages && (
                <div className="flex items-center justify-between text-sm text-slate-600 mb-4">
                  <span>Page {pageNum} of {numPages}</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setPageNum(p => Math.max(1, p - 1))}
                      disabled={pageNum === 1}
                      className="px-2 py-1 bg-slate-100 rounded hover:bg-slate-200 disabled:opacity-50"
                    >
                      Prev
                    </button>
                    <button 
                      onClick={() => setPageNum(p => Math.min(numPages, p + 1))}
                      disabled={pageNum === numPages}
                      className="px-2 py-1 bg-slate-100 rounded hover:bg-slate-200 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <PenTool size={18} />
                Draw Signature
              </h3>
              
              <div className="border border-slate-200 rounded-lg bg-slate-50 mb-4 overflow-hidden">
                <SignatureCanvas
                  ref={sigCanvasRef}
                  canvasProps={{
                    className: 'w-full h-40 cursor-crosshair'
                  }}
                  backgroundColor="transparent"
                />
              </div>
              
              <div className="flex gap-2 mb-6">
                <button 
                  onClick={clearSignature}
                  className="flex-1 py-2 px-4 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                >
                  Clear
                </button>
                <button 
                  onClick={addSignature}
                  className="flex-1 py-2 px-4 bg-slate-800 text-white rounded-lg hover:bg-slate-900 font-medium transition-colors"
                >
                  Add to PDF
                </button>
              </div>

              <button
                onClick={handleApplySignature}
                disabled={signatures.length === 0 || isProcessing}
                className="w-full py-3 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Processing...
                  </>
                ) : (
                  <>
                    <Download size={20} />
                    Apply & Download
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: PDF Preview */}
          <div 
            ref={pdfWrapperRef}
            className="lg:col-span-2 bg-slate-100 border border-slate-200 rounded-xl overflow-hidden flex justify-center items-center p-4 min-h-[600px] relative"
          >
            {pdfError ? (
              <div className="text-center p-6 bg-red-50 rounded-xl border border-red-200 max-w-md">
                <X className="w-10 h-10 text-red-500 mx-auto mb-2" />
                <h3 className="text-red-800 font-bold mb-1">Error Loading PDF</h3>
                <p className="text-red-600 text-sm">{pdfError}</p>
              </div>
            ) : (
              <div 
                ref={containerRef}
                className="relative shadow-lg bg-white overflow-hidden"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{ width: 'fit-content', height: 'fit-content' }}
              >
                <div ref={pageRef}>
                  <Document
                    file={file}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={onDocumentLoadError}
                    loading={
                      <div className="flex flex-col items-center justify-center p-20">
                        <Loader2 className="w-10 h-10 text-red-600 animate-spin mb-4" />
                        <p className="text-slate-600 font-medium">Loading PDF document...</p>
                      </div>
                    }
                  >
                    <Page 
                      pageNumber={pageNum} 
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      width={containerWidth} // Dynamic width based on container
                    />
                  </Document>
                </div>
                
                {numPages && signatures.filter(s => s.page === pageNum).map(sig => (
                  <div
                    key={sig.id}
                    className="absolute cursor-move border border-dashed border-blue-500 bg-blue-50/30 group z-10"
                    style={{
                      left: sig.x,
                      top: sig.y,
                      width: 150,
                      // Height is auto based on image aspect ratio
                    }}
                    onMouseDown={(e) => handleMouseDown(e, sig.id)}
                  >
                    <div className="absolute -top-3 -right-3 bg-blue-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSignatures(sigs => sigs.filter(s => s.id !== sig.id));
                        }}
                        className="hover:bg-blue-600 rounded-full p-0.5"
                      >
                        <X size={12} />
                      </button>
                      <Move size={12} className="m-0.5" />
                    </div>
                    <img 
                      src={sig.url} 
                      alt="Draggable Signature" 
                      className="w-full h-auto pointer-events-none"
                      draggable={false}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
