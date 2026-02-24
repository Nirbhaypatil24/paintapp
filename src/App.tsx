/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera as CameraIcon, 
  Download, 
  Share2, 
  RefreshCcw, 
  ChevronLeft, 
  Sparkles,
  Layers
} from 'lucide-react';
import { cn } from './lib/utils';
import { Camera } from './components/Camera';
import { transformToWatercolor } from './services/geminiService';
import confetti from 'canvas-confetti';

type AppState = 'idle' | 'camera' | 'processing' | 'preview';

export default function App() {
  const [state, setState] = useState<AppState>('idle');
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [transformedImage, setTransformedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  const handleCapture = async (imageData: string) => {
    setOriginalImage(imageData);
    setState('processing');
    setError(null);

    try {
      const result = await transformToWatercolor(imageData);
      setTransformedImage(result);
      setState('preview');
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#1A535C']
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to transform image. Please try again.");
      setState('camera');
    }
  };

  const reset = () => {
    setOriginalImage(null);
    setTransformedImage(null);
    setState('camera');
    setShowComparison(false);
  };

  const downloadImage = () => {
    if (!transformedImage) return;
    const link = document.createElement('a');
    link.href = transformedImage;
    link.download = `watercolor-${Date.now()}.png`;
    link.click();
  };

  const shareImage = async () => {
    if (!transformedImage) return;
    try {
      const blob = await (await fetch(transformedImage)).blob();
      const file = new File([blob], 'watercolor.png', { type: 'image/png' });
      if (navigator.share) {
        await navigator.share({
          files: [file],
          title: 'My Watercolor Masterpiece',
          text: 'Check out this watercolor painting I made with Aquarelle AI!',
        });
      } else {
        alert("Sharing is not supported on this browser.");
      }
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#FDFCFB] text-[#1A1A1A] font-sans selection:bg-emerald-100 overflow-hidden">
      <AnimatePresence mode="wait">
        {state === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full flex flex-col items-center justify-center p-8 text-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="mb-12 relative"
            >
              <div className="absolute -inset-4 bg-emerald-100 rounded-full blur-2xl opacity-50 animate-pulse" />
              <Sparkles className="w-24 h-24 text-emerald-600 relative" strokeWidth={1.5} />
            </motion.div>
            
            <h1 className="text-5xl font-serif italic mb-4 tracking-tight">Aquarelle AI</h1>
            <p className="text-lg text-stone-500 mb-12 max-w-xs mx-auto leading-relaxed">
              Capture the world through the lens of a watercolor artist.
            </p>
            
            <button
              onClick={() => setState('camera')}
              className="group relative px-8 py-4 bg-[#1A1A1A] text-white rounded-full font-medium overflow-hidden transition-all hover:scale-105 active:scale-95"
            >
              <span className="relative z-10 flex items-center gap-2">
                Open Studio <CameraIcon size={20} />
              </span>
              <div className="absolute inset-0 bg-emerald-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </button>
          </motion.div>
        )}

        {state === 'camera' && (
          <motion.div
            key="camera"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full relative"
          >
            <Camera onCapture={handleCapture} isActive={state === 'camera'} />
            
            <button
              onClick={() => setState('idle')}
              className="absolute top-12 left-6 p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-colors"
            >
              <ChevronLeft size={24} />
            </button>

            {error && (
              <div className="absolute top-24 left-6 right-6 p-4 bg-red-500/90 backdrop-blur-md text-white rounded-2xl text-sm text-center shadow-lg">
                {error}
              </div>
            )}
          </motion.div>
        )}

        {state === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full flex flex-col items-center justify-center p-8 bg-white"
          >
            <div className="relative w-64 h-64 mb-12">
              <motion.div
                animate={{ 
                  rotate: 360,
                  borderRadius: ["40% 60% 70% 30% / 40% 50% 60% 50%", "60% 40% 30% 70% / 50% 60% 40% 60%", "40% 60% 70% 30% / 40% 50% 60% 50%"]
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-emerald-50 border-2 border-emerald-200"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Sparkles className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
                  </motion.div>
                  <p className="text-xs font-mono uppercase tracking-widest text-emerald-800">Painting...</p>
                </div>
              </div>
            </div>
            <h2 className="text-2xl font-serif italic mb-2">Mixing Colors</h2>
            <p className="text-stone-400 text-sm animate-pulse">Our AI artist is working on your masterpiece</p>
          </motion.div>
        )}

        {state === 'preview' && transformedImage && (
          <motion.div
            key="preview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full flex flex-col"
          >
            <div className="relative flex-1 bg-stone-100 overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="relative w-full max-w-md aspect-[3/4] bg-white shadow-2xl rounded-sm p-4 transform rotate-1">
                  <div className="relative w-full h-full overflow-hidden bg-stone-50">
                    <img 
                      src={showComparison ? originalImage! : transformedImage} 
                      className="w-full h-full object-cover"
                      alt="Result"
                    />
                    
                    {/* Artistic overlay */}
                    <div className="absolute inset-0 pointer-events-none opacity-20 mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]" />
                  </div>
                  <div className="mt-4 flex justify-between items-center px-1">
                    <span className="text-[10px] font-mono text-stone-400 uppercase tracking-tighter">
                      {showComparison ? 'Original Draft' : 'Watercolor Final'}
                    </span>
                    <span className="text-[10px] font-mono text-stone-400 uppercase tracking-tighter">
                      Aquarelle AI Studio © 2024
                    </span>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="absolute top-12 left-6 right-6 flex justify-between items-center">
                <button
                  onClick={reset}
                  className="p-3 bg-white/80 backdrop-blur-md rounded-full text-stone-800 shadow-sm hover:bg-white transition-colors"
                >
                  <RefreshCcw size={20} />
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowComparison(!showComparison)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all shadow-sm",
                      showComparison ? "bg-emerald-600 text-white" : "bg-white/80 backdrop-blur-md text-stone-800"
                    )}
                  >
                    <Layers size={16} /> {showComparison ? 'Show Result' : 'Compare'}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 pb-12 flex justify-center gap-6 border-t border-stone-100">
              <button
                onClick={downloadImage}
                className="flex flex-col items-center gap-2 group"
              >
                <div className="w-14 h-14 rounded-full bg-stone-50 flex items-center justify-center text-stone-800 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-all">
                  <Download size={24} />
                </div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400">Save</span>
              </button>

              <button
                onClick={shareImage}
                className="flex flex-col items-center gap-2 group"
              >
                <div className="w-14 h-14 rounded-full bg-stone-50 flex items-center justify-center text-stone-800 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-all">
                  <Share2 size={24} />
                </div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400">Share</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
