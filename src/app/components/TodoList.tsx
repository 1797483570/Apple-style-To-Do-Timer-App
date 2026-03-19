import { useState, useEffect, useRef } from 'react';
import { Plus, Check, Trash2, GripVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
};

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  completedAt?: number;
}

interface TodoListProps {
  onTaskComplete?: () => void;
}

const DRAG_TYPE = 'TODO_ITEM';

interface DragItem {
  id: string;
  index: number;
}

interface TodoItemProps {
  todo: Todo;
  index: number;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onMove: (dragIndex: number, hoverIndex: number) => void;
  currentTime: number;
}

function TodoItem({ todo, index, onToggle, onDelete, onMove, currentTime }: TodoItemProps) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag, dragPreview] = useDrag({
    type: DRAG_TYPE,
    item: { id: todo.id, index },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  const [{ isOver }, drop] = useDrop<DragItem, void, { isOver: boolean }>({
    accept: DRAG_TYPE,
    collect: (monitor) => ({ isOver: monitor.isOver() }),
    hover(item, monitor) {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;

      const hoverRect = ref.current.getBoundingClientRect();
      const hoverMiddleY = (hoverRect.bottom - hoverRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;
      const hoverClientY = clientOffset.y - hoverRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

      onMove(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  dragPreview(drop(ref));

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: isDragging ? 0.4 : 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -100, scale: 0.95 }}
      transition={{ layout: { duration: 0.2 }, opacity: { duration: 0.2 } }}
      className={`group ${isOver ? 'relative' : ''}`}
    >
      <div
        className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl backdrop-blur-sm transition-all ${
          todo.completed ? 'bg-white/30' : 'bg-white/60 hover:bg-white/80'
        } ${isOver ? 'ring-2 ring-foreground/20' : ''}`}
      >
        {/* Drag Handle */}
        <div
          ref={drag as unknown as React.RefObject<HTMLDivElement>}
          className="flex-shrink-0 cursor-grab active:cursor-grabbing text-foreground/20 hover:text-foreground/40 transition-colors"
        >
          <GripVertical size={16} />
        </div>

        {/* Checkbox */}
        <button
          onClick={() => onToggle(todo.id)}
          className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
            todo.completed
              ? 'bg-emerald-500 border-emerald-500'
              : 'border-foreground/30 hover:border-foreground/50'
          }`}
        >
          <AnimatePresence>
            {todo.completed && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Check size={14} className="text-background" />
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        {/* Text */}
        <span
          className={`flex-1 transition-all ${
            todo.completed ? 'line-through text-foreground/40' : 'text-foreground'
          }`}
        >
          {todo.text}
        </span>

        {/* Time Info */}
        <div className="flex-shrink-0 flex flex-col items-end mr-2">
          <span className="text-xs text-foreground/40">{formatTime(todo.createdAt)}</span>
          {todo.completed && todo.completedAt && (
            <span className="text-xs text-emerald-500">{formatTime(todo.completedAt)}</span>
          )}
        </div>

        {/* Delete Button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onDelete(todo.id)}
          className="flex-shrink-0 w-8 h-8 rounded-full hover:bg-red-500/10 flex items-center justify-center text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 size={16} />
        </motion.button>
      </div>
    </motion.div>
  );
}

export function TodoList({ onTaskComplete }: TodoListProps) {
  const [todos, setTodos] = useState<Todo[]>(() => {
    // Load from localStorage on initial mount
    const saved = localStorage.getItem('pomodoro-todos');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });
  const [inputValue, setInputValue] = useState('');
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Save to localStorage whenever todos change
  useEffect(() => {
    localStorage.setItem('pomodoro-todos', JSON.stringify(todos));
  }, [todos]);

  // Update current time every minute to refresh relative time display
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const addTodo = () => {
    if (inputValue.trim()) {
      const newTodo: Todo = {
        id: Date.now().toString(),
        text: inputValue.trim(),
        completed: false,
        createdAt: Date.now(),
      };
      setTodos([newTodo, ...todos]);
      setInputValue('');
    }
  };

  const toggleTodo = (id: string) => {
    setTodos(
      todos.map((todo) => {
        if (todo.id === id) {
          const newCompleted = !todo.completed;
          if (newCompleted) {
            onTaskComplete?.();
            return { ...todo, completed: newCompleted, completedAt: Date.now() };
          } else {
            return { ...todo, completed: newCompleted, completedAt: undefined };
          }
        }
        return todo;
      })
    );
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addTodo();
    }
  };

  const moveTodo = (dragIndex: number, hoverIndex: number) => {
    setTodos((prev) => {
      const next = [...prev];
      const [removed] = next.splice(dragIndex, 1);
      next.splice(hoverIndex, 0, removed);
      return next;
    });
  };

  const activeTodos = todos.filter((t) => !t.completed);
  const completedTodos = todos.filter((t) => t.completed);

  return (
    <DndProvider backend={HTML5Backend}>
    <div className="w-full">
      {/* Input */}
      <div className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="添加新任务..."
            className="flex-1 px-4 py-3 rounded-2xl bg-white/60 backdrop-blur-sm border-0 focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all placeholder:text-foreground/40"
          />
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={addTodo}
            className="w-12 h-12 rounded-2xl bg-foreground text-background flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow"
          >
            <Plus size={20} />
          </motion.button>
        </div>
      </div>

      {/* Stats */}
      {todos.length > 0 && (
        <div className="flex gap-4 mb-4 text-sm text-foreground/60">
          <span>{activeTodos.length} 个待办</span>
          <span>·</span>
          <span>{completedTodos.length} 个已完成</span>
        </div>
      )}

      {/* Todo List */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {todos.map((todo, index) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              index={index}
              onToggle={toggleTodo}
              onDelete={deleteTodo}
              onMove={moveTodo}
              currentTime={currentTime}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {todos.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 text-foreground/40"
        >
          <p>暂无任务</p>
          <p className="text-sm mt-1">添加一个新任务开始吧</p>
        </motion.div>
      )}
    </div>
    </DndProvider>
  );
}