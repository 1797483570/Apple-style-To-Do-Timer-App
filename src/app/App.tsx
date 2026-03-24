import { useState } from 'react';
import { PomodoroTimer } from './components/PomodoroTimer';
import { TodoList } from './components/TodoList';
import { TabBar } from './components/TabBar';
import { TimeSettings } from './components/TimeSettings';
import { motion, AnimatePresence } from 'motion/react';
import { toast, Toaster } from 'sonner';
import { useTheme } from '@/hooks/useTheme';
import { Sun, Moon } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'timer' | 'todo'>('timer');
  const [showSettings, setShowSettings] = useState(false);
  const [focusDuration, setFocusDuration] = useState(25 * 60); // 25 minutes in seconds
  const [breakDuration, setBreakDuration] = useState(5 * 60); // 5 minutes in seconds
  const { theme, toggleTheme } = useTheme();

  const handleSessionComplete = () => {
    toast.success('🍅 番茄钟完成！', {
      description: '干得好！休息一下吧',
      duration: 3000,
    });
  };

  const handleTaskComplete = () => {
    toast.success('✓ 任务完成！', {
      description: '继续保持！',
      duration: 2000,
    });
  };

  const handleSaveSettings = (newFocusDuration: number, newBreakDuration: number) => {
    setFocusDuration(newFocusDuration);
    setBreakDuration(newBreakDuration);
    toast.success('设置已保存', {
      duration: 2000,
    });
  };

  return (
    <div className="size-full min-h-screen bg-background overflow-hidden">
      <Toaster position="top-center" richColors />
      
      {/* Main Content */}
      <div className="max-w-md mx-auto px-6 pt-16 pb-24 h-full flex flex-col">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 relative"
        >
          <h1 className="text-4xl tracking-tight mb-2">
            {activeTab === 'timer' ? '番茄钟' : '待办事项'}
          </h1>
          <p className="text-foreground/50">
            {activeTab === 'timer'
              ? '专注工作，高效生活'
              : '记录任务，井然有序'}
          </p>
          <button
            onClick={toggleTheme}
            className="absolute top-0 right-0 p-2 rounded-full hover:bg-foreground/5 transition-colors"
            aria-label="切换主题"
          >
            {theme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </button>
        </motion.div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {/* Timer Tab */}
          <motion.div
            initial={false}
            animate={{
              opacity: activeTab === 'timer' ? 1 : 0,
              x: activeTab === 'timer' ? 0 : -20,
            }}
            transition={{ duration: 0.3 }}
            className="flex items-center justify-center min-h-full py-8"
            style={{
              display: activeTab === 'timer' ? 'flex' : 'none',
            }}
          >
            <PomodoroTimer 
              onSessionComplete={handleSessionComplete}
              focusDuration={focusDuration}
              breakDuration={breakDuration}
              onOpenSettings={() => setShowSettings(true)}
            />
          </motion.div>

          {/* Todo Tab */}
          <motion.div
            initial={false}
            animate={{
              opacity: activeTab === 'todo' ? 1 : 0,
              x: activeTab === 'todo' ? 0 : 20,
            }}
            transition={{ duration: 0.3 }}
            className="py-4"
            style={{
              display: activeTab === 'todo' ? 'block' : 'none',
            }}
          >
            <TodoList onTaskComplete={handleTaskComplete} />
          </motion.div>
        </div>
      </div>

      {/* Tab Bar */}
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <TimeSettings
            focusDuration={focusDuration}
            breakDuration={breakDuration}
            onSave={handleSaveSettings}
            onClose={() => setShowSettings(false)}
          />
        )}
      </AnimatePresence>

      {/* Custom Scrollbar Styles */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .safe-area-bottom {
          padding-bottom: env(safe-area-inset-bottom);
        }
      `}</style>
    </div>
  );
}