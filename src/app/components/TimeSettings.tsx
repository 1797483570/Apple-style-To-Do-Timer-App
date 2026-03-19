import { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';

interface TimeSettingsProps {
  focusDuration: number;
  breakDuration: number;
  onSave: (focusDuration: number, breakDuration: number) => void;
  onClose: () => void;
}

export function TimeSettings({ focusDuration, breakDuration, onSave, onClose }: TimeSettingsProps) {
  const [localFocusDuration, setLocalFocusDuration] = useState(focusDuration);
  const [localBreakDuration, setLocalBreakDuration] = useState(breakDuration);
  const [activeKnob, setActiveKnob] = useState<'focus' | 'break' | null>(null);

  const focusRef = useRef<HTMLDivElement>(null);
  const breakRef = useRef<HTMLDivElement>(null);

  const handleSave = () => {
    onSave(localFocusDuration, localBreakDuration);
    onClose();
  };

  const handleKnobDrag = (
    ref: React.RefObject<HTMLDivElement>,
    type: 'focus' | 'break'
  ) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const deltaX = clientX - centerX;
      const deltaY = clientY - centerY;
      
      // Calculate angle in degrees (0-360)
      let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
      angle = (angle + 90 + 360) % 360; // Adjust so 0° is at top

      // Convert angle to minutes (0-60 minutes for one hour)
      const minutes = Math.round((angle / 360) * 60);
      const duration = minutes * 60; // Convert to seconds

      if (type === 'focus') {
        setLocalFocusDuration(duration);
      } else {
        setLocalBreakDuration(duration);
      }
    };

    const handleEnd = () => {
      setActiveKnob(null);
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove);
    document.addEventListener('touchend', handleEnd);
  };

  const formatMinutes = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return mins;
  };

  const getKnobAngle = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    // Clamp to max 60 minutes
    const clampedMinutes = Math.min(minutes, 60);
    return (clampedMinutes / 60) * 360; // 360 degrees for 60 minutes
  };

  // Generate arc path - starts at 12 o'clock, ends at knob position
  const getArcPath = (seconds: number) => {
    const angle = getKnobAngle(seconds);
    const centerX = 96;
    const centerY = 96;
    const radius = 86; // Same as background circle
    
    // Start point at 12 o'clock (top)
    const startX = centerX;
    const startY = centerY - radius;
    
    // End point at angle
    const angleRad = (angle - 90) * (Math.PI / 180); // -90 to start from top
    const endX = centerX + radius * Math.cos(angleRad);
    const endY = centerY + radius * Math.sin(angleRad);
    
    // Large arc flag: 1 if angle > 180
    const largeArcFlag = angle > 180 ? 1 : 0;
    
    // If angle is 0, don't draw anything
    if (angle === 0) {
      return '';
    }
    
    // Create arc path
    return `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center px-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <h2 className="text-2xl mb-6">时长设置</h2>

        {/* Focus Time Dial */}
        <div className="mb-8">
          <div className="text-sm text-foreground/60 mb-3">专注时长</div>
          <div className="relative w-48 h-48 mx-auto" ref={focusRef}>
            {/* Dial Background */}
            <svg className="w-full h-full" viewBox="0 0 192 192">
              {/* Background circle */}
              <circle
                cx="96"
                cy="96"
                r="86"
                fill="none"
                stroke="rgba(0,0,0,0.05)"
                strokeWidth="12"
              />
              {/* Hour markers */}
              {Array.from({ length: 12 }).map((_, i) => {
                const angle = (i * 30 - 90) * (Math.PI / 180);
                const x1 = 96 + 73 * Math.cos(angle);
                const y1 = 96 + 73 * Math.sin(angle);
                const x2 = 96 + 80 * Math.cos(angle);
                const y2 = 96 + 80 * Math.sin(angle);
                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="rgba(0,0,0,0.2)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                );
              })}
              {/* Progress arc - stays on track */}
              {localFocusDuration > 0 && (
                <path
                  d={getArcPath(localFocusDuration)}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="12"
                  strokeLinecap="round"
                  className="text-foreground"
                />
              )}
            </svg>

            {/* Center Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="text-4xl">{formatMinutes(localFocusDuration)}</div>
              <div className="text-sm text-foreground/50">分钟</div>
            </div>

            {/* Draggable Knob */}
            <motion.div
              className="absolute bg-foreground rounded-full shadow-lg cursor-grab active:cursor-grabbing z-10"
              style={{
                width: '16px',
                height: '16px',
                left: '50%',
                top: '50%',
                x: '-50%',
                y: '-50%',
              }}
              animate={{
                rotate: getKnobAngle(localFocusDuration),
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onMouseDown={() => {
                setActiveKnob('focus');
                handleKnobDrag(focusRef, 'focus');
              }}
              onTouchStart={() => {
                setActiveKnob('focus');
                handleKnobDrag(focusRef, 'focus');
              }}
            >
              <div
                className="absolute w-1 bg-foreground rounded-full"
                style={{
                  height: '80px',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -100%)',
                  transformOrigin: 'bottom center',
                }}
              />
            </motion.div>
          </div>
        </div>

        {/* Break Time Dial */}
        <div className="mb-8">
          <div className="text-sm text-foreground/60 mb-3">休息时长</div>
          <div className="relative w-48 h-48 mx-auto" ref={breakRef}>
            {/* Dial Background */}
            <svg className="w-full h-full" viewBox="0 0 192 192">
              {/* Background circle */}
              <circle
                cx="96"
                cy="96"
                r="86"
                fill="none"
                stroke="rgba(0,0,0,0.05)"
                strokeWidth="12"
              />
              {/* Hour markers */}
              {Array.from({ length: 12 }).map((_, i) => {
                const angle = (i * 30 - 90) * (Math.PI / 180);
                const x1 = 96 + 73 * Math.cos(angle);
                const y1 = 96 + 73 * Math.sin(angle);
                const x2 = 96 + 80 * Math.cos(angle);
                const y2 = 96 + 80 * Math.sin(angle);
                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="rgba(0,0,0,0.2)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                );
              })}
              {/* Progress arc - stays on track */}
              {localBreakDuration > 0 && (
                <path
                  d={getArcPath(localBreakDuration)}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="12"
                  strokeLinecap="round"
                  className="text-emerald-500"
                />
              )}
            </svg>

            {/* Center Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="text-4xl">{formatMinutes(localBreakDuration)}</div>
              <div className="text-sm text-foreground/50">分钟</div>
            </div>

            {/* Draggable Knob */}
            <motion.div
              className="absolute bg-emerald-500 rounded-full shadow-lg cursor-grab active:cursor-grabbing z-10"
              style={{
                width: '16px',
                height: '16px',
                left: '50%',
                top: '50%',
                x: '-50%',
                y: '-50%',
              }}
              animate={{
                rotate: getKnobAngle(localBreakDuration),
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onMouseDown={() => {
                setActiveKnob('break');
                handleKnobDrag(breakRef, 'break');
              }}
              onTouchStart={() => {
                setActiveKnob('break');
                handleKnobDrag(breakRef, 'break');
              }}
            >
              <div
                className="absolute w-1 bg-emerald-500 rounded-full"
                style={{
                  height: '80px',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -100%)',
                  transformOrigin: 'bottom center',
                }}
              />
            </motion.div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 rounded-2xl bg-white/60 hover:bg-white/80 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-6 py-3 rounded-2xl bg-foreground text-background hover:shadow-lg transition-shadow flex items-center justify-center gap-2"
          >
            <Check size={18} />
            保存
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}