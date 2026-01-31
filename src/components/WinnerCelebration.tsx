"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

// Confetti particle component
function Confetti({ delay }: { delay: number }) {
  const colors = ["#FF6B35", "#F7C59F", "#2EC4B6", "#FFCB47", "#E71D36"];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  const randomX = Math.random() * 400 - 200;
  const randomRotation = Math.random() * 720 - 360;

  return (
    <motion.div
      className="absolute w-3 h-3"
      style={{ backgroundColor: randomColor }}
      initial={{ 
        opacity: 1, 
        y: 0, 
        x: 0, 
        rotate: 0,
        scale: 1 
      }}
      animate={{ 
        opacity: 0, 
        y: 400, 
        x: randomX, 
        rotate: randomRotation,
        scale: 0.5 
      }}
      transition={{ 
        duration: 2,
        delay,
        ease: "easeOut"
      }}
    />
  );
}

// Trophy bounce animation
function TrophyIcon() {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ 
        type: "spring", 
        stiffness: 200, 
        damping: 15,
        delay: 0.2 
      }}
      className="text-8xl"
    >
      🏆
    </motion.div>
  );
}

// Main celebration component
export function WinnerCelebration({ 
  isVisible, 
  winnerName,
  onClose 
}: { 
  isVisible: boolean;
  winnerName: string;
  onClose: () => void;
}) {
  const [confettiPieces, setConfettiPieces] = useState<number[]>([]);

  useEffect(() => {
    if (isVisible) {
      // Generate confetti pieces
      setConfettiPieces(Array.from({ length: 50 }, (_, i) => i));
      
      // Auto-close after animation
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          {/* Confetti container */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2">
            {confettiPieces.map((i) => (
              <Confetti key={i} delay={Math.random() * 0.5} />
            ))}
          </div>

          {/* Main content card */}
          <motion.div
            className="relative bg-white border-4 border-black p-8 text-center"
            initial={{ scale: 0.5, y: 100, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, y: 50, opacity: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 20 
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <TrophyIcon />
            
            <motion.h2
              className="mt-4 text-3xl font-black uppercase"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              Winner!
            </motion.h2>
            
            <motion.p
              className="mt-2 text-xl font-bold text-orange-500"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, type: "spring" }}
            >
              {winnerName}
            </motion.p>

            {/* Pulsing glow effect */}
            <motion.div
              className="absolute inset-0 border-4 border-orange-400 -z-10"
              animate={{ 
                scale: [1, 1.05, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
