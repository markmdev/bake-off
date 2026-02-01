'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CountdownTimerProps {
  targetTime: Date;
  label?: string;
}

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

function calculateTimeLeft(targetTime: Date): TimeLeft {
  const difference = targetTime.getTime() - new Date().getTime();
  
  if (difference <= 0) {
    return { hours: 0, minutes: 0, seconds: 0, total: 0 };
  }

  return {
    hours: Math.floor(difference / (1000 * 60 * 60)),
    minutes: Math.floor((difference / (1000 * 60)) % 60),
    seconds: Math.floor((difference / 1000) % 60),
    total: difference,
  };
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  const displayValue = value.toString().padStart(2, '0');
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative overflow-hidden">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={displayValue}
            initial={{ y: -80, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 80, opacity: 0, scale: 0.8 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30,
            }}
            className="bg-zinc-900 border-4 border-zinc-100 px-4 py-3 min-w-[80px] sm:min-w-[100px]"
          >
            <span className="text-4xl sm:text-6xl font-black text-zinc-100 tabular-nums">
              {displayValue}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>
      <span className="text-xs sm:text-sm font-bold text-zinc-400 mt-2 uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}

function Separator() {
  return (
    <motion.div
      animate={{ opacity: [1, 0.3, 1] }}
      transition={{ duration: 1, repeat: Infinity }}
      className="text-4xl sm:text-6xl font-black text-zinc-100 px-1 sm:px-2 self-start mt-3"
    >
      :
    </motion.div>
  );
}

export function CountdownTimer({ targetTime, label = "Time Remaining" }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calculateTimeLeft(targetTime));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Initial calculation
    setTimeLeft(calculateTimeLeft(targetTime));
    
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetTime));
    }, 1000);

    return () => clearInterval(timer);
  }, [targetTime]);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex flex-col items-center gap-4 p-6">
        <div className="h-[120px]" />
      </div>
    );
  }

  const isExpired = timeLeft.total <= 0;
  const isUrgent = timeLeft.total > 0 && timeLeft.total < 15 * 60 * 1000; // < 15 min

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-4 p-6"
    >
      <motion.h3
        className={`text-lg sm:text-xl font-bold uppercase tracking-wider ${
          isUrgent ? 'text-orange-400' : 'text-zinc-400'
        }`}
        animate={isUrgent ? { scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 0.5, repeat: isUrgent ? Infinity : 0 }}
      >
        {isExpired ? '🏁 Time\'s Up!' : label}
      </motion.h3>
      
      {!isExpired && (
        <div className="flex items-center gap-1 sm:gap-2">
          <TimeUnit value={timeLeft.hours} label="Hours" />
          <Separator />
          <TimeUnit value={timeLeft.minutes} label="Minutes" />
          <Separator />
          <TimeUnit value={timeLeft.seconds} label="Seconds" />
        </div>
      )}

      {isExpired && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="bg-orange-500 border-4 border-zinc-100 px-8 py-4"
        >
          <span className="text-3xl sm:text-5xl font-black text-zinc-900">
            SUBMISSIONS CLOSED
          </span>
        </motion.div>
      )}

      {isUrgent && !isExpired && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-orange-400 font-bold text-sm"
        >
          ⚡ Hurry! Less than 15 minutes left!
        </motion.p>
      )}
    </motion.div>
  );
}

// Pre-configured for hackathon deadline
export function HackathonCountdown() {
  // 5:45 PM PST today
  const today = new Date();
  const deadline = new Date(today);
  deadline.setHours(17, 45, 0, 0); // 5:45 PM local time
  
  // If it's already past 5:45 PM, show expired
  if (today > deadline) {
    deadline.setDate(deadline.getDate() + 1); // Tomorrow (fallback)
  }

  return (
    <CountdownTimer 
      targetTime={deadline} 
      label="⏰ Submission Deadline" 
    />
  );
}
