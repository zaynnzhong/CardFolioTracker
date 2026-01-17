import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Upload, X, Loader2, Check, AlertCircle, RefreshCw, Sparkles } from 'lucide-react';
import { scanCard, CardScanResult } from '../services/cardsight';
import { Sport } from '../types';
import { Camera as CapCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

interface ScannedCardData {
  player: string;
  year: number;
  brand: string;
  series: string;
  insert: string;
  parallel?: string;
  serialNumber?: string;
}

interface CardScannerProps {
  onScanComplete: (cardData: ScannedCardData, imageFile: File) => void;
  onClose: () => void;
}

export const CardScanner: React.FC<CardScannerProps> = ({ onScanComplete, onClose }) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<CardScanResult | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Set video srcObject when camera stream is available and video element is rendered
  useEffect(() => {
    if (cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream, showCamera]);

  // Handle file selection
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
      setScanResult(null);
    }
  }, []);

  // Start camera - use native on iOS/Android, web API on browser
  const startCamera = useCallback(async () => {
    const isNative = Capacitor.isNativePlatform();

    if (isNative) {
      // Use Capacitor Camera plugin on iOS/Android
      try {
        const photo = await CapCamera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.Base64,
          source: CameraSource.Camera,
          correctOrientation: true
        });

        if (photo.base64String) {
          // Convert base64 to File
          const base64Data = `data:image/${photo.format};base64,${photo.base64String}`;
          setImagePreview(base64Data);

          // Convert to File for scanning
          const response = await fetch(base64Data);
          const blob = await response.blob();
          const file = new File([blob], `card-scan.${photo.format}`, { type: `image/${photo.format}` });
          setImageFile(file);
          setScanResult(null);
        }
      } catch (error: any) {
        console.error('Native camera error:', error);
        if (error.message !== 'User cancelled photos app') {
          alert('Unable to access camera. Please use file upload instead.');
        }
      }
    } else {
      // Use web getUserMedia on browser
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
        });
        setCameraStream(stream);
        setShowCamera(true);
        // srcObject is set via useEffect after video element renders
      } catch (error) {
        console.error('Camera error:', error);
        alert('Unable to access camera. Please use file upload instead.');
      }
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  }, [cameraStream]);

  // Capture photo from camera
  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'card-scan.jpg', { type: 'image/jpeg' });
            setImageFile(file);
            setImagePreview(canvas.toDataURL('image/jpeg'));
            stopCamera();
            setScanResult(null);
          }
        }, 'image/jpeg', 0.9);
      }
    }
  }, [stopCamera]);

  // Scan the card
  const handleScan = useCallback(async () => {
    if (!imageFile) return;

    setScanning(true);
    setScanResult(null);

    try {
      const result = await scanCard(imageFile);
      setScanResult(result);
    } catch (error) {
      console.error('Scan error:', error);
      setScanResult({
        success: false,
        confidence: null,
        card: null,
        allDetections: [],
        error: 'Failed to scan card. Please try again.'
      });
    } finally {
      setScanning(false);
    }
  }, [imageFile]);

  // Accept the scan result and pass data to parent
  const handleAccept = useCallback(() => {
    if (!scanResult?.card || !imageFile) return;

    const card = scanResult.card;

    // Parse serial number from parallel if it has numberedTo
    let serialNumber: string | undefined;
    if (card.parallel?.numberedTo) {
      serialNumber = `/${card.parallel.numberedTo}`;
    }

    const cardData: ScannedCardData = {
      player: card.name,
      year: parseInt(card.year) || new Date().getFullYear(),
      brand: card.manufacturer,
      series: card.releaseName || card.setName,
      insert: card.setName || 'Base',
      parallel: card.parallel?.name,
      serialNumber
    };

    onScanComplete(cardData, imageFile);
  }, [scanResult, imageFile, onScanComplete]);

  // Reset the scanner
  const handleReset = useCallback(() => {
    setImagePreview(null);
    setImageFile(null);
    setScanResult(null);
    stopCamera();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [stopCamera]);

  // Get confidence color
  const getConfidenceColor = (confidence: string | null) => {
    switch (confidence) {
      case 'High': return 'text-green-400';
      case 'Medium': return 'text-yellow-400';
      case 'Low': return 'text-orange-400';
      default: return 'text-slate-400';
    }
  };

  const getConfidenceBg = (confidence: string | null) => {
    switch (confidence) {
      case 'High': return 'bg-green-500/20 border-green-500/30';
      case 'Medium': return 'bg-yellow-500/20 border-yellow-500/30';
      case 'Low': return 'bg-orange-500/20 border-orange-500/30';
      default: return 'bg-slate-500/20 border-slate-500/30';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-crypto-dark border border-slate-700 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-crypto-dark border-b border-slate-700 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-crypto-lime" />
            <h2 className="text-lg font-semibold text-white">AI Card Scanner</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Camera View */}
          {showCamera && (
            <div className="relative rounded-xl overflow-hidden bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full aspect-[3/4] object-cover"
              />
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                <button
                  onClick={stopCamera}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={capturePhoto}
                  className="px-6 py-2 bg-crypto-lime hover:bg-crypto-lime/90 text-black font-semibold rounded-lg transition-colors"
                >
                  Capture
                </button>
              </div>
              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}

          {/* Image Preview or Upload Area */}
          {!showCamera && (
            <>
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Card preview"
                    className="w-full aspect-[3/4] object-contain rounded-xl bg-slate-800"
                  />
                  <button
                    onClick={handleReset}
                    className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-black/80 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-600 rounded-xl p-8 text-center">
                  <div className="space-y-4">
                    <div className="flex justify-center gap-4">
                      <button
                        onClick={startCamera}
                        className="flex flex-col items-center gap-2 p-4 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
                      >
                        <Camera className="w-8 h-8 text-crypto-lime" />
                        <span className="text-sm text-slate-300">Take Photo</span>
                      </button>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex flex-col items-center gap-2 p-4 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
                      >
                        <Upload className="w-8 h-8 text-crypto-lime" />
                        <span className="text-sm text-slate-300">Upload</span>
                      </button>
                    </div>
                    <p className="text-slate-500 text-sm">
                      Take a photo or upload an image of your card
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              )}
            </>
          )}

          {/* Scan Button */}
          {imagePreview && !showCamera && !scanResult && (
            <button
              onClick={handleScan}
              disabled={scanning}
              className="w-full py-3 bg-crypto-lime hover:bg-crypto-lime/90 disabled:bg-crypto-lime/50 text-black font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              {scanning ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Identify Card
                </>
              )}
            </button>
          )}

          {/* Scan Results */}
          {scanResult && (
            <div className="space-y-4">
              {scanResult.success && scanResult.card ? (
                <>
                  {/* Success Result */}
                  <div className={`p-4 rounded-xl border ${getConfidenceBg(scanResult.confidence)}`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-slate-400">Confidence</span>
                      <span className={`font-semibold ${getConfidenceColor(scanResult.confidence)}`}>
                        {scanResult.confidence}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400 text-sm">Player</span>
                        <span className="text-white font-medium">{scanResult.card.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 text-sm">Year</span>
                        <span className="text-white">{scanResult.card.year}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 text-sm">Brand</span>
                        <span className="text-white">{scanResult.card.manufacturer}</span>
                      </div>
                      {scanResult.card.releaseName && (
                        <div className="flex justify-between">
                          <span className="text-slate-400 text-sm">Release</span>
                          <span className="text-white">{scanResult.card.releaseName}</span>
                        </div>
                      )}
                      {scanResult.card.setName && (
                        <div className="flex justify-between">
                          <span className="text-slate-400 text-sm">Set</span>
                          <span className="text-white">{scanResult.card.setName}</span>
                        </div>
                      )}
                      {scanResult.card.number && (
                        <div className="flex justify-between">
                          <span className="text-slate-400 text-sm">Number</span>
                          <span className="text-white">#{scanResult.card.number}</span>
                        </div>
                      )}
                      {scanResult.card.parallel && (
                        <div className="flex justify-between">
                          <span className="text-slate-400 text-sm">Parallel</span>
                          <span className="text-crypto-lime">
                            {scanResult.card.parallel.name}
                            {scanResult.card.parallel.numberedTo && ` /${scanResult.card.parallel.numberedTo}`}
                          </span>
                        </div>
                      )}
                    </div>

                    {scanResult.processingTime && (
                      <div className="mt-3 pt-3 border-t border-slate-600">
                        <span className="text-xs text-slate-500">
                          Processed in {scanResult.processingTime}ms
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleReset}
                      className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl flex items-center justify-center gap-2 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Retry
                    </button>
                    <button
                      onClick={handleAccept}
                      className="flex-1 py-3 bg-crypto-lime hover:bg-crypto-lime/90 text-black font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      Use This
                    </button>
                  </div>

                  {/* Other Detections */}
                  {scanResult.allDetections.length > 1 && (
                    <div className="mt-4">
                      <p className="text-sm text-slate-400 mb-2">Other matches:</p>
                      <div className="space-y-2">
                        {scanResult.allDetections.slice(1).map((detection, index) => (
                          detection.card && (
                            <button
                              key={index}
                              onClick={() => {
                                setScanResult({
                                  ...scanResult,
                                  confidence: detection.confidence,
                                  card: detection.card
                                });
                              }}
                              className="w-full p-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-left transition-colors"
                            >
                              <div className="flex justify-between items-center">
                                <span className="text-white text-sm">
                                  {detection.card.year} {detection.card.name}
                                </span>
                                <span className={`text-xs ${getConfidenceColor(detection.confidence)}`}>
                                  {detection.confidence}
                                </span>
                              </div>
                              <span className="text-slate-400 text-xs">
                                {detection.card.manufacturer} {detection.card.setName}
                              </span>
                            </button>
                          )
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* Error or No Detection Result */
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <div>
                      <p className="text-red-400 font-medium">
                        {scanResult.error || 'No cards detected'}
                      </p>
                      <p className="text-slate-400 text-sm mt-1">
                        Try taking a clearer photo with good lighting
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleReset}
                    className="w-full mt-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Powered by CardSight */}
          <div className="text-center pt-2 space-y-1">
            <span className="text-xs text-slate-500">
              Powered by CardSight AI
            </span>
            <p className="text-[10px] text-amber-500/70">
              ⚠️ Currently supports baseball cards only
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
