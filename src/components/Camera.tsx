import React, { useRef, useEffect, useState, useCallback } from 'react';
import { RefreshCw, Zap, ZapOff, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface CameraProps {
  onCapture: (imageData: string) => void;
  isActive: boolean;
}

export const Camera: React.FC<CameraProps> = ({ onCapture, isActive }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<{title: string, message: string} | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [hasFlash, setHasFlash] = useState(false);
  const [isFlashOn, setIsFlashOn] = useState(false);

  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const startCamera = useCallback(async () => {
    stopStream();
    setError(null);

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          aspectRatio: { ideal: 16/9 }
        },
        audio: false
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }

      // Check for flash/torch capability
      const track = newStream.getVideoTracks()[0];
      const capabilities = track.getCapabilities() as any;
      setHasFlash(!!capabilities.torch);

    } catch (err: any) {
      console.error("Camera access error:", err);
      if (err.name === 'NotAllowedError') {
        setError({
          title: "Permission Denied",
          message: "Please allow camera access in your browser settings to use Aquarelle AI."
        });
      } else if (err.name === 'NotFoundError') {
        setError({
          title: "No Camera Found",
          message: "We couldn't detect a camera on this device."
        });
      } else {
        setError({
          title: "Camera Error",
          message: "An unexpected error occurred while starting the camera."
        });
      }
    }
  }, [facingMode, stopStream]);

  useEffect(() => {
    if (isActive) {
      startCamera();
    } else {
      stopStream();
    }
    return stopStream;
  }, [isActive, facingMode]);

  const toggleFlash = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    try {
      await track.applyConstraints({
        advanced: [{ torch: !isFlashOn }]
      } as any);
      setIsFlashOn(!isFlashOn);
    } catch (err) {
      console.error("Flash toggle error:", err);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Use natural video dimensions to prevent stretching
      const width = video.videoWidth;
      const height = video.videoHeight;
      
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Mirror if using front camera
        if (facingMode === 'user') {
          ctx.translate(width, 0);
          ctx.scale(-1, 1);
        }
        
        ctx.drawImage(video, 0, 0, width, height);
        
        // Vibrate for feedback if supported
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }

        // Capture at high quality, we'll resize in the service if needed
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        onCapture(dataUrl);
      }
    }
  };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden flex items-center justify-center">
      {error ? (
        <div className="text-white text-center p-8 max-w-sm">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-serif mb-2">{error.title}</h3>
          <p className="text-stone-400 text-sm mb-6 leading-relaxed">{error.message}</p>
          <button 
            onClick={startCamera}
            className="w-full py-3 bg-white text-black rounded-xl font-medium active:scale-95 transition-transform"
          >
            Try Again
          </button>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={cn(
              "w-full h-full object-cover transition-opacity duration-500",
              stream ? "opacity-100" : "opacity-0",
              facingMode === 'user' && "scale-x-[-1]"
            )}
          />
          <canvas ref={canvasRef} className="hidden" />
          
          {/* Overlay UI */}
          <div className="absolute inset-0 pointer-events-none border-[16px] border-black/10" />
          
          <div className="absolute top-12 right-6 flex flex-col gap-4 pointer-events-auto">
            {hasFlash && (
              <button
                onClick={toggleFlash}
                className="p-3 bg-black/40 backdrop-blur-xl rounded-full text-white border border-white/10"
              >
                {isFlashOn ? <Zap size={20} className="text-yellow-400 fill-yellow-400" /> : <ZapOff size={20} />}
              </button>
            )}
          </div>

          <div className="absolute bottom-12 left-0 right-0 flex justify-center items-center gap-10 px-6 pointer-events-auto">
            <button
              onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')}
              className="p-4 bg-white/10 backdrop-blur-xl rounded-full text-white border border-white/10 hover:bg-white/20 active:scale-90 transition-all"
              aria-label="Switch Camera"
            >
              <RefreshCw size={24} />
            </button>

            <button
              onClick={capturePhoto}
              className="group relative"
              aria-label="Capture Photo"
            >
              <div className="absolute inset-0 bg-white/20 rounded-full scale-150 blur-md group-active:scale-100 transition-transform duration-300" />
              <div className="relative w-20 h-20 bg-white rounded-full flex items-center justify-center border-[6px] border-white/30 shadow-2xl group-active:scale-90 transition-transform">
                <div className="w-14 h-14 rounded-full border border-black/5 bg-stone-50" />
              </div>
            </button>

            <div className="w-14 h-14" /> {/* Spacer */}
          </div>
        </>
      )}
    </div>
  );
};
