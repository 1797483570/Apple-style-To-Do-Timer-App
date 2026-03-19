import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PomodoroTimerProps {
  onSessionComplete?: () => void;
  focusDuration: number;
  breakDuration: number;
  onOpenSettings: () => void;
}

type TimerMode = 'focus' | 'break';

export function PomodoroTimer({ onSessionComplete, focusDuration, breakDuration, onOpenSettings }: PomodoroTimerProps) {
  const [mode, setMode] = useState<TimerMode>('focus');
  const [timeLeft, setTimeLeft] = useState(focusDuration);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(() => {
    // Load sessions count from localStorage
    const saved = localStorage.getItem('pomodoro-sessions');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [isResetting, setIsResetting] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const totalTime = mode === 'focus' ? focusDuration : breakDuration;
  // Progress represents remaining time percentage (100% = full circle, 0% = empty)
  const progress = (timeLeft / totalTime) * 100;

  // Save sessions count to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('pomodoro-sessions', sessions.toString());
  }, [sessions]);

  // Update timeLeft when durations change
  useEffect(() => {
    if (!isRunning) {
      setTimeLeft(mode === 'focus' ? focusDuration : breakDuration);
    }
  }, [focusDuration, breakDuration, mode, isRunning]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  const handleSessionComplete = () => {
    setIsRunning(false);
    if (mode === 'focus') {
      const newSessions = sessions + 1;
      setSessions(newSessions);
      onSessionComplete?.();
      // Auto switch to break
      switchMode('break');
    } else {
      // Switch back to focus
      switchMode('focus');
    }
  };

  const switchMode = (newMode: TimerMode) => {
    setMode(newMode);
    setTimeLeft(newMode === 'focus' ? focusDuration : breakDuration);
    setIsRunning(false);
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(mode === 'focus' ? focusDuration : breakDuration);
    setIsResetting(true);
    setTimeout(() => {
      setIsResetting(false);
    }, 1000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative w-full">
      {/* Settings Button */}
      <div className="absolute -top-4 right-0">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onOpenSettings}
          className="w-10 h-10 rounded-full bg-white/60 hover:bg-white/80 flex items-center justify-center transition-colors"
        >
          <Settings size={18} />
        </motion.button>
      </div>

      {/* Mode Display */}
      <div className="text-center mb-8">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`inline-block px-6 py-2.5 rounded-full ${
            mode === 'focus'
              ? 'bg-foreground text-background'
              : 'bg-emerald-500 text-white'
          }`}
        >
          {mode === 'focus' ? '专注' : '休息'}
        </motion.div>
      </div>

      {/* Timer Circle */}
      <div className="relative w-full aspect-square max-w-[280px] mx-auto mb-8">
        {/* Background Circle */}
        <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="rgba(0,0,0,0.05)"
            strokeWidth="8"
          />
          {/* Progress Circle - starts full and decreases */}
          <motion.circle
            key={`${mode}-circle`}
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 90}`}
            strokeDashoffset={2 * Math.PI * 90 * (1 - progress / 100)}
            transition={{ 
              duration: isResetting ? 0.8 : 0.3, 
              ease: isResetting ? 'easeOut' : 'easeInOut' 
            }}
            className={mode === 'focus' ? 'text-foreground' : 'text-emerald-500'}
          />
        </svg>

        {/* Timer Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={timeLeft}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="text-6xl tracking-tight"
            >
              {formatTime(timeLeft)}
            </motion.div>
          </AnimatePresence>
          <div className="text-sm text-foreground/50 mt-2">
            {sessions > 0 && `已完成 ${sessions} 个番茄钟`}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={toggleTimer}
          className="w-16 h-16 rounded-full bg-foreground text-background flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow"
        >
          {isRunning ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
        </motion.button>
        
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={resetTimer}
          className="w-12 h-12 rounded-full bg-white/60 hover:bg-white/80 flex items-center justify-center transition-colors"
        >
          <RotateCcw size={18} />
        </motion.button>
      </div>
    </div>
  );
}