import { Timer, CheckSquare } from 'lucide-react';
import { motion } from 'motion/react';

interface TabBarProps {
  activeTab: 'timer' | 'todo';
  onTabChange: (tab: 'timer' | 'todo') => void;
}

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-border safe-area-bottom">
      <div className="max-w-md mx-auto flex">
        <button
          onClick={() => onTabChange('timer')}
          className="flex-1 flex flex-col items-center gap-1 py-3 relative"
        >
          <Timer
            size={24}
            className={activeTab === 'timer' ? 'text-foreground' : 'text-foreground/40'}
          />
          <span
            className={`text-xs ${
              activeTab === 'timer' ? 'text-foreground' : 'text-foreground/40'
            }`}
          >
            番茄钟
          </span>
          {activeTab === 'timer' && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-foreground rounded-full"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
        </button>

        <button
          onClick={() => onTabChange('todo')}
          className="flex-1 flex flex-col items-center gap-1 py-3 relative"
        >
          <CheckSquare
            size={24}
            className={activeTab === 'todo' ? 'text-foreground' : 'text-foreground/40'}
          />
          <span
            className={`text-xs ${
              activeTab === 'todo' ? 'text-foreground' : 'text-foreground/40'
            }`}
          >
            待办
          </span>
          {activeTab === 'todo' && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-foreground rounded-full"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
        </button>
      </div>
    </div>
  );
}
