import React, { useState, useEffect, useCallback } from 'react';
import {
  format,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { taskService } from '../../tasks/services/task.service';
import { Task, PriorityLevel } from '../../../types/task.types';
import { Button } from '../../../components/ui/Button';
import { TaskDetailModal } from '../../tasks/components/TaskDetailModal';

export const CalendarPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await taskService.getMyTasks({ limit: 100 });
      const list = Array.isArray(res) ? res : (res?.items || []);
      setTasks(list);
    } catch {
      toast.error('Failed to load deadline calendar');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const getPriorityColor = (priority: PriorityLevel) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900';
      case 'HIGH':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900';
      case 'MEDIUM':
        return 'bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-950/50 dark:text-primary-300 dark:border-primary-900';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  const handleOpenTask = (task: Task) => {
    setSelectedTaskId(task.id);
    setIsModalOpen(true);
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <CalendarIcon className="w-6 h-6 text-primary-600" />
            Deadline Calendar
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track milestone deadlines and scheduled deliverables across the month.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>

          <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-l-lg transition-colors"
              title="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-bold text-slate-800 dark:text-slate-200 min-w-32 text-center">
              {format(currentDate, 'MMMM yyyy')}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-r-lg transition-colors"
              title="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Month Grid */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600 mb-2" />
          <span className="text-xs">Loading calendar events...</span>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          {/* Weekday Header */}
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 text-center py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
            {weekDays.map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 dark:divide-slate-800/80">
            {days.map((day) => {
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isCurrentDay = isToday(day);

              // Find tasks due on this day
              const dayTasks = tasks.filter(
                (t) => t.dueDate && isSameDay(new Date(t.dueDate), day)
              );

              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[110px] p-2 flex flex-col justify-between transition-colors ${
                    !isCurrentMonth ? 'bg-slate-50/40 dark:bg-slate-950/20 text-slate-300 dark:text-slate-600' : ''
                  } ${isCurrentDay ? 'bg-primary-50/30 dark:bg-primary-950/20' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-semibold h-6 w-6 rounded-full flex items-center justify-center ${
                        isCurrentDay
                          ? 'bg-primary-600 text-white font-bold'
                          : isCurrentMonth
                          ? 'text-slate-700 dark:text-slate-300'
                          : 'text-slate-400 dark:text-slate-600'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>

                    {dayTasks.length > 0 && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        {dayTasks.length}
                      </span>
                    )}
                  </div>

                  {/* Task Chips for Day */}
                  <div className="space-y-1 overflow-y-auto max-h-20">
                    {dayTasks.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleOpenTask(t)}
                        className={`w-full text-left truncate text-[11px] px-1.5 py-0.5 rounded border transition-shadow hover:shadow-xs font-medium block ${getPriorityColor(
                          t.priority
                        )}`}
                      >
                        {t.title}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      <TaskDetailModal
        taskId={selectedTaskId}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTaskId(null);
        }}
        onTaskUpdated={loadTasks}
        onTaskDeleted={loadTasks}
      />
    </div>
  );
};

export default CalendarPage;
