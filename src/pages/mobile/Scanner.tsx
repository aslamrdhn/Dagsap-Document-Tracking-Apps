import React, { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { fetchApi } from "../../lib/api";
import toast from "react-hot-toast";
import { CheckCircle2, ScanLine } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function Scanner() {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    // Only init scanner if not showing result/success
    if (scanResult || isSuccess) return;

    const scanner = new Html5QrcodeScanner("reader", { 
      qrbox: { width: 250, height: 250 }, 
      fps: 10,
      aspectRatio: 1.0,
      videoConstraints: {
        facingMode: "environment"
      }
    }, false);
    
    scanner.render((text) => {
      if (!scanResult && !processing && !isSuccess) {
        scanner.pause(true);
        setScanResult(text);
      }
    }, (err) => {
      // Ignore routine scanning errors
    });

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [scanResult, processing, isSuccess]);

  const processScan = async () => {
    if (!scanResult) return;
    setProcessing(true);
    try {
      const res = await fetchApi("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentNumber: scanResult })
      });
      if (res.ok) {
        setIsSuccess(true);
        // We do not toast success here, we show the success UI state
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to process scan");
        setScanResult(null); // allow rescanning
      }
    } catch (e) {
      toast.error("Network error");
      setScanResult(null);
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    setScanResult(null);
    setIsSuccess(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="h-full flex flex-col"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Scan Document</h2>
        <p className="text-sm text-slate-500 mt-1 font-medium">Point camera at QR Code or Barcode</p>
      </div>
      
      <AnimatePresence mode="wait">
        {!scanResult && !isSuccess && (
          <motion.div 
            key="scanner"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex-1 flex flex-col items-center"
          >
            <div className="w-full max-w-sm bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden p-2 relative">
              <div id="reader" className="w-full rounded-2xl overflow-hidden [&_video]:rounded-2xl [&_video]:object-cover [&_#reader__dashboard_section_csr]:hidden"></div>
              <style>{`
                #reader__dashboard_section_swaplink { display: none; }
                #reader__status_span { display: none; }
                #reader { border: none !important; }
              `}</style>
            </div>
            
            <div className="mt-8 flex flex-col items-center justify-center opacity-60">
              <ScanLine size={48} className="text-slate-400 mb-4 animate-pulse" />
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Awaiting Scan...</p>
            </div>
          </motion.div>
        )}

        {scanResult && !isSuccess && (
          <motion.div 
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col"
          >
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-center space-y-6">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
                 <ScanLine size={32} className="text-blue-500" />
              </div>
              
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Code Scanned</div>
                <div className="text-3xl font-black font-mono text-[#800000] break-all">{scanResult}</div>
              </div>
              
              <div className="pt-4 space-y-3">
                <button 
                  onClick={processScan}
                  disabled={processing}
                  className="w-full bg-[#800000] text-white p-4 rounded-xl font-bold shadow-lg shadow-[#800000]/20 hover:bg-[#600000] transition active:scale-[0.98] disabled:opacity-70 flex justify-center items-center h-14"
                >
                  {processing ? (
                    <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    "Confirm & Update Tracking"
                  )}
                </button>
                <button 
                  onClick={handleReset}
                  disabled={processing}
                  className="w-full bg-slate-100 text-slate-600 p-4 rounded-xl font-bold hover:bg-slate-200 transition active:scale-[0.98] disabled:opacity-50 h-14"
                >
                  Cancel & Rescan
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {isSuccess && (
          <motion.div 
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col justify-center items-center text-center px-4"
          >
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.5 }}
              className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6"
            >
              <CheckCircle2 size={48} className="text-green-600" />
            </motion.div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Success!</h3>
            <p className="text-slate-500 font-medium mb-8">Document tracking has been updated successfully.</p>
            
            <button 
              onClick={handleReset}
              className="bg-slate-800 text-white px-8 py-4 rounded-xl font-bold hover:bg-slate-900 transition active:scale-[0.98] shadow-lg shadow-slate-800/20 w-full max-w-xs"
            >
              Scan Next Document
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
