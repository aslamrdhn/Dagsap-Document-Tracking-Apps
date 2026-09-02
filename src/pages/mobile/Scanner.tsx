import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { fetchApi } from '../../lib/api';
import toast from 'react-hot-toast';
import {
  CheckCircle2,
  ScanLine,
  Camera,
  Upload,
  Keyboard,
  RefreshCw,
  AlertTriangle,
  FileText,
  ArrowRight,
  Zap,
  ZapOff,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type ScanMode = 'camera' | 'upload' | 'manual';

export default function Scanner() {
  const [activeMode, setActiveMode] = useState<ScanMode>('camera');
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [docDetails, setDocDetails] = useState<any | null>(null);
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successDoc, setSuccessDoc] = useState<any | null>(null);

  // Camera States
  const [cameraPermissionError, setCameraPermissionError] = useState<string | null>(null);
  const [isCameraRunning, setIsCameraRunning] = useState(false);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);

  // Manual input state
  const [manualCode, setManualCode] = useState('');

  // File upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isStoppingRef = useRef(false);

  // Sound generator using Web Audio API for scan beep
  const playScanBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      }
    } catch {
      // Audio context might be restricted before user interaction
    }

    if (navigator.vibrate) {
      try {
        navigator.vibrate([80, 40, 80]);
      } catch {
        // Ignored
      }
    }
  };

  // Stop camera safely
  const stopCamera = async () => {
    if (html5QrCodeRef.current && isCameraRunning && !isStoppingRef.current) {
      isStoppingRef.current = true;
      try {
        await html5QrCodeRef.current.stop();
      } catch (err) {
        console.warn('Error stopping camera:', err);
      } finally {
        setIsCameraRunning(false);
        isStoppingRef.current = false;
      }
    }
  };

  // Start camera with auto-fallbacks
  const startCamera = async (cameraIdToUse?: string) => {
    setCameraPermissionError(null);
    const element = document.getElementById('qr-reader-viewport');
    if (!element) return;

    // Clean up existing instance if needed
    if (html5QrCodeRef.current) {
      if (isCameraRunning) {
        try {
          await html5QrCodeRef.current.stop();
        } catch {
          // Ignore
        }
      }
    } else {
      html5QrCodeRef.current = new Html5Qrcode('qr-reader-viewport');
    }

    const qrCode = html5QrCodeRef.current;

    // Detect available cameras
    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        setCameras(devices);
      }
    } catch (err) {
      console.warn('Could not enumerate cameras:', err);
    }

    const onScanSuccess = (decodedText: string) => {
      playScanBeep();
      stopCamera();
      handleCodeDetected(decodedText);
    };

    const qrConfig = {
      fps: 15,
      qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
        const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
        const qrboxSize = Math.floor(minEdge * 0.72);
        return { width: qrboxSize, height: qrboxSize };
      },
      aspectRatio: 1.0,
    };

    // Strategy 1: specific camera ID
    if (cameraIdToUse) {
      try {
        await qrCode.start(cameraIdToUse, qrConfig, onScanSuccess, () => {});
        setIsCameraRunning(true);
        setSelectedCameraId(cameraIdToUse);
        checkTorchSupport(qrCode);
        return;
      } catch (err: any) {
        console.warn('Failed starting specific camera ID:', err);
      }
    }

    // Strategy 2: Environment / Back camera
    try {
      await qrCode.start({ facingMode: 'environment' }, qrConfig, onScanSuccess, () => {});
      setIsCameraRunning(true);
      checkTorchSupport(qrCode);
      return;
    } catch (err: any) {
      console.warn('Failed starting environment facingMode:', err);
    }

    // Strategy 3: User / Front camera
    try {
      await qrCode.start({ facingMode: 'user' }, qrConfig, onScanSuccess, () => {});
      setIsCameraRunning(true);
      checkTorchSupport(qrCode);
      return;
    } catch (err: any) {
      console.warn('Failed starting user facingMode:', err);
    }

    // Strategy 4: First camera from detected list
    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        await qrCode.start(devices[0].id, qrConfig, onScanSuccess, () => {});
        setIsCameraRunning(true);
        setSelectedCameraId(devices[0].id);
        checkTorchSupport(qrCode);
        return;
      }
    } catch (err: any) {
      console.warn('Failed starting first camera from list:', err);
    }

    // If all strategies failed:
    setCameraPermissionError(
      'Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan di peramban Anda, atau gunakan fitur Upload Gambar / Input Manual di atas.'
    );
    setIsCameraRunning(false);
  };

  const checkTorchSupport = (qrCode: Html5Qrcode) => {
    try {
      const capabilities = (qrCode as any).getRunningTrackCapabilities?.();
      if (capabilities && capabilities.torch) {
        setTorchSupported(true);
      } else {
        setTorchSupported(false);
      }
    } catch {
      setTorchSupported(false);
    }
  };

  const toggleTorch = async () => {
    if (!html5QrCodeRef.current || !isCameraRunning) return;
    try {
      const nextTorch = !torchOn;
      await (html5QrCodeRef.current as any).applyVideoConstraints({
        advanced: [{ torch: nextTorch }],
      });
      setTorchOn(nextTorch);
    } catch {
      toast.error('Flashlight tidak didukung pada kamera ini');
    }
  };

  const switchCamera = async () => {
    if (cameras.length <= 1) {
      toast('Hanya 1 kamera yang terdeteksi', { icon: 'ℹ️' });
      return;
    }
    const currentIndex = cameras.findIndex((c) => c.id === selectedCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCamera = cameras[nextIndex];
    await stopCamera();
    startCamera(nextCamera.id);
  };

  // Manage camera lifecycle based on mode and scan status
  useEffect(() => {
    if (activeMode === 'camera' && !scanResult && !isSuccess) {
      const timer = setTimeout(() => {
        startCamera();
      }, 150);
      return () => {
        clearTimeout(timer);
        stopCamera();
      };
    } else {
      stopCamera();
    }
  }, [activeMode, scanResult, isSuccess]);

  // Code detected handler
  const handleCodeDetected = async (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;
    setScanResult(trimmed);
    setLoadingDoc(true);

    try {
      const res = await fetchApi(`/api/scan/lookup/${encodeURIComponent(trimmed)}`);
      if (res.ok) {
        const data = await res.json();
        setDocDetails(data);
      } else {
        setDocDetails(null);
      }
    } catch {
      setDocDetails(null);
    } finally {
      setLoadingDoc(false);
    }
  };

  // Process Document Scanning Update
  const processScan = async () => {
    if (!scanResult) return;
    setProcessing(true);
    try {
      const res = await fetchApi('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentNumber: scanResult }),
      });
      if (res.ok) {
        const data = await res.json();
        setSuccessDoc(data);
        setIsSuccess(true);
      } else {
        const error = await res.json();
        toast.error(error.error || 'Gagal memproses pelacakan dokumen');
      }
    } catch {
      toast.error('Kesalahan jaringan saat mengirim data');
    } finally {
      setProcessing(false);
    }
  };

  // Handle File Upload Scan
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadLoading(true);
    try {
      let qrCode = html5QrCodeRef.current;
      if (!qrCode) {
        qrCode = new Html5Qrcode('qr-reader-viewport');
        html5QrCodeRef.current = qrCode;
      }
      const decodedText = await qrCode.scanFile(file, true);
      playScanBeep();
      handleCodeDetected(decodedText);
    } catch {
      toast.error('QR Code atau Barcode tidak terdeteksi pada gambar yang diunggah');
    } finally {
      setUploadLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle Manual Submit
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) {
      toast.error('Masukkan nomor dokumen terlebih dahulu');
      return;
    }
    handleCodeDetected(manualCode.trim());
  };

  const handleReset = () => {
    setScanResult(null);
    setDocDetails(null);
    setIsSuccess(false);
    setSuccessDoc(null);
    setManualCode('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="h-full flex flex-col max-w-md mx-auto"
    >
      {/* Header */}
      <div className="mb-4 shrink-0">
        <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <ScanLine className="text-[#800000]" size={22} />
          Scan & Tracking Dokumen
        </h2>
        <p className="text-xs text-slate-500 mt-0.5 font-medium">
          Arahkan kamera ke QR Code, unggah foto, atau masukkan ID dokumen
        </p>
      </div>

      {/* Mode Selector Tabs */}
      {!scanResult && !isSuccess && (
        <div className="flex bg-slate-200/70 p-1 rounded-xl mb-4 shrink-0 gap-1">
          <button
            onClick={() => setActiveMode('camera')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeMode === 'camera'
                ? 'bg-white text-[#800000] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera size={15} />
            <span>Kamera</span>
          </button>
          <button
            onClick={() => setActiveMode('upload')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeMode === 'upload'
                ? 'bg-white text-[#800000] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload size={15} />
            <span>Unggah Foto</span>
          </button>
          <button
            onClick={() => setActiveMode('manual')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeMode === 'manual'
                ? 'bg-white text-[#800000] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Keyboard size={15} />
            <span>Input ID</span>
          </button>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* 1. SCANNING MODES */}
          {!scanResult && !isSuccess && (
            <motion.div
              key={activeMode}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="flex-1 flex flex-col"
            >
              {/* CAMERA MODE */}
              {activeMode === 'camera' && (
                <div className="flex-1 flex flex-col items-center justify-between">
                  <div className="w-full bg-black rounded-3xl shadow-lg overflow-hidden relative border border-slate-800 flex flex-col items-center justify-center min-h-[320px] max-h-[420px] aspect-square">
                    {/* Viewport element for Html5Qrcode */}
                    <div
                      id="qr-reader-viewport"
                      className="w-full h-full object-cover [&_video]:w-full [&_video]:h-full [&_video]:object-cover"
                    ></div>

                    {/* Viewfinder Target & Laser Overlay */}
                    {isCameraRunning && (
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="w-[68%] h-[68%] border-2 border-white/60 rounded-2xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                          {/* Corner Accents */}
                          <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-[#ff3b30] rounded-tl-lg"></div>
                          <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-[#ff3b30] rounded-tr-lg"></div>
                          <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-[#ff3b30] rounded-bl-lg"></div>
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-[#ff3b30] rounded-br-lg"></div>

                          {/* Animated Red Laser Line */}
                          <div className="w-full h-0.5 bg-red-500 shadow-[0_0_12px_#ff0000] absolute animate-[scan_2s_ease-in-out_infinite]"></div>
                        </div>
                      </div>
                    )}

                    {/* Camera Control Overlays */}
                    {isCameraRunning && (
                      <div className="absolute top-3 right-3 flex gap-2 z-20">
                        {torchSupported && (
                          <button
                            onClick={toggleTorch}
                            className={`p-2.5 rounded-full backdrop-blur-md transition-all ${
                              torchOn
                                ? 'bg-amber-400 text-slate-900 shadow-lg shadow-amber-400/50'
                                : 'bg-black/50 text-white hover:bg-black/70'
                            }`}
                            title="Nyalakan Lampu"
                          >
                            {torchOn ? <Zap size={18} /> : <ZapOff size={18} />}
                          </button>
                        )}
                        {cameras.length > 1 && (
                          <button
                            onClick={switchCamera}
                            className="p-2.5 rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-black/70 transition-all active:rotate-180"
                            title="Ganti Kamera"
                          >
                            <RefreshCw size={18} />
                          </button>
                        )}
                      </div>
                    )}

                    {/* Error State */}
                    {cameraPermissionError && (
                      <div className="absolute inset-0 bg-slate-900/95 p-6 flex flex-col items-center justify-center text-center z-30">
                        <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mb-3">
                          <AlertTriangle size={24} />
                        </div>
                        <h4 className="text-white font-bold text-sm mb-1">Akses Kamera Terhambat</h4>
                        <p className="text-slate-400 text-xs mb-4 leading-relaxed max-w-xs">
                          {cameraPermissionError}
                        </p>
                        <div className="flex flex-col gap-2 w-full max-w-xs">
                          <button
                            onClick={() => startCamera()}
                            className="bg-[#800000] text-white py-2.5 px-4 rounded-xl text-xs font-bold hover:bg-[#600000] transition active:scale-95"
                          >
                            Coba Buka Kamera Lagi
                          </button>
                          <button
                            onClick={() => setActiveMode('manual')}
                            className="bg-white/10 text-white py-2.5 px-4 rounded-xl text-xs font-bold hover:bg-white/20 transition"
                          >
                            Gunakan Input Manual
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 text-center">
                    <p className="text-xs text-slate-500 font-medium flex items-center justify-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                      Posisikan QR code / Barcode di dalam kotak merah
                    </p>
                  </div>
                </div>
              )}

              {/* UPLOAD FILE MODE */}
              {activeMode === 'upload' && (
                <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white rounded-3xl border border-slate-200 text-center shadow-sm">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="w-16 h-16 bg-[#800000]/10 text-[#800000] rounded-2xl flex items-center justify-center mb-4">
                    <Upload size={32} />
                  </div>
                  <h3 className="text-base font-bold text-slate-800 mb-1">
                    Unggah Gambar QR / Barcode
                  </h3>
                  <p className="text-xs text-slate-500 mb-6 max-w-xs">
                    Pilih gambar berisi kode dokumen dari galeri atau ambil foto langsung dari file
                  </p>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadLoading}
                    className="w-full max-w-xs bg-[#800000] text-white py-3.5 rounded-xl font-bold text-sm shadow-md hover:bg-[#600000] transition active:scale-95 flex items-center justify-center gap-2"
                  >
                    {uploadLoading ? (
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Upload size={18} />
                        <span>Pilih Foto dari Perangkat</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* MANUAL INPUT MODE */}
              {activeMode === 'manual' && (
                <form
                  onSubmit={handleManualSubmit}
                  className="flex-1 flex flex-col justify-between p-6 bg-white rounded-3xl border border-slate-200 shadow-sm"
                >
                  <div>
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-3">
                      <Keyboard size={24} />
                    </div>
                    <h3 className="text-base font-bold text-slate-800 mb-1">
                      Input Manual Nomor Dokumen
                    </h3>
                    <p className="text-xs text-slate-500 mb-5">
                      Ketik nomor resi atau ID pelacakan dokumen
                    </p>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Nomor Dokumen / Tracking ID
                        </label>
                        <input
                          type="text"
                          value={manualCode}
                          onChange={(e) => setManualCode(e.target.value)}
                          placeholder="Contoh: DAG-2026-000001"
                          className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-800 uppercase focus:bg-white focus:border-[#800000] focus:ring-1 focus:ring-[#800000] outline-none transition-all"
                          autoFocus
                        />
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-[11px] text-slate-500 font-medium">
                          💡 <b>Tips:</b> Nomor dokumen dapat dilihat pada label fisik atau barcode
                          surat jalan.
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!manualCode.trim()}
                    className="w-full bg-[#800000] text-white py-3.5 rounded-xl font-bold text-sm shadow-md hover:bg-[#600000] transition active:scale-95 disabled:opacity-50 mt-6"
                  >
                    Periksa & Lanjutkan
                  </button>
                </form>
              )}
            </motion.div>
          )}

          {/* 2. SCANNED RESULT CONFIRMATION */}
          {scanResult && !isSuccess && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="flex-1 flex flex-col justify-between"
            >
              <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
                      <ScanLine size={18} />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Kode Terdeteksi
                      </span>
                      <span className="text-base font-black font-mono text-[#800000] break-all">
                        {scanResult}
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-md text-[10px] font-bold">
                    Siap Update
                  </span>
                </div>

                {loadingDoc ? (
                  <div className="py-6 flex flex-col items-center justify-center text-slate-400 text-xs">
                    <div className="w-6 h-6 border-2 border-[#800000]/20 border-t-[#800000] rounded-full animate-spin mb-2"></div>
                    Memeriksa data dokumen di server...
                  </div>
                ) : docDetails ? (
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-2.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Jenis Dokumen:</span>
                      <span className="font-bold text-slate-800">
                        {docDetails.documentType?.name || 'Dokumen'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Rute Pengiriman:</span>
                      <span className="font-bold text-slate-800 flex items-center gap-1">
                        <span>{docDetails.originLocation?.code || 'ASAL'}</span>
                        <ArrowRight size={12} className="text-slate-400" />
                        <span>{docDetails.destinationLocation?.code || 'TUJUAN'}</span>
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Status Terakhir:</span>
                      <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded font-bold text-[10px]">
                        {docDetails.status}
                      </span>
                    </div>
                    {docDetails.currentHolder && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-medium">Pemegang Terakhir:</span>
                        <span className="font-bold text-slate-700">{docDetails.currentHolder}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200/60 p-3 rounded-xl text-amber-800 text-xs flex items-start gap-2">
                    <FileText size={16} className="shrink-0 mt-0.5 text-amber-600" />
                    <span>
                      Dokumen baru atau belum terdaftar secara rinci. Sistem akan mencatat pelacakan
                      secara langsung.
                    </span>
                  </div>
                )}

                <div className="pt-2 space-y-2.5">
                  <button
                    onClick={processScan}
                    disabled={processing}
                    className="w-full bg-[#800000] text-white py-3.5 rounded-xl font-bold shadow-md hover:bg-[#600000] transition active:scale-[0.98] disabled:opacity-70 flex justify-center items-center gap-2 text-sm"
                  >
                    {processing ? (
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <CheckCircle2 size={18} />
                        <span>Konfirmasi & Perbarui Status</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleReset}
                    disabled={processing}
                    className="w-full bg-slate-100 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-200 transition text-xs"
                  >
                    Batal & Scan Ulang
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* 3. SUCCESS STATE */}
          {isSuccess && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col justify-center items-center text-center p-6 bg-white rounded-3xl border border-slate-200 shadow-sm"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', bounce: 0.5 }}
                className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4 text-green-600"
              >
                <CheckCircle2 size={44} />
              </motion.div>

              <h3 className="text-xl font-black text-slate-800 mb-1">Berhasil Discan!</h3>
              <p className="text-xs text-slate-500 font-medium mb-4 max-w-xs">
                Status pelacakan dokumen telah berhasil diperbarui ke server.
              </p>

              {successDoc && (
                <div className="w-full bg-slate-50 p-3.5 rounded-2xl border border-slate-100 mb-6 text-xs space-y-1.5">
                  <div className="text-slate-400 font-bold uppercase text-[10px]">
                    Nomor Dokumen
                  </div>
                  <div className="font-mono font-black text-[#800000] text-sm">
                    {successDoc.documentNumber}
                  </div>
                  <div className="inline-block mt-1 px-2.5 py-1 bg-green-100 text-green-800 rounded-md font-bold text-[11px]">
                    Status Baru: {successDoc.status}
                  </div>
                </div>
              )}

              <button
                onClick={handleReset}
                className="bg-[#800000] text-white py-3.5 px-6 rounded-xl font-bold text-sm hover:bg-[#600000] transition active:scale-95 shadow-md shadow-[#800000]/20 w-full"
              >
                Scan Dokumen Berikutnya
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Global Style for Keyframe Animation */}
      <style>{`
        @keyframes scan {
          0% { top: 4%; opacity: 0.8; }
          50% { top: 96%; opacity: 1; }
          100% { top: 4%; opacity: 0.8; }
        }
      `}</style>
    </motion.div>
  );
}
