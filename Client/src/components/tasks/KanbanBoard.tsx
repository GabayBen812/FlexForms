import { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { Task, TaskStatus } from '@/types/tasks/task';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from './TaskCard';
import { useTranslation } from 'react-i18next';

interface KanbanBoardProps {
  tasks: Task[];
  onTaskMove: (taskId: string, newStatus: TaskStatus, newOrder: number) => void;
  onTaskClick: (task: Task) => void;
}

export function KanbanBoard({ tasks, onTaskMove, onTaskClick }: KanbanBoardProps) {
  const { t } = useTranslation();
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      [TaskStatus.TODO]: [],
      [TaskStatus.IN_PROGRESS]: [],
      [TaskStatus.IN_REVIEW]: [],
      [TaskStatus.DONE]: [],
    };

    tasks.forEach((task) => {
      grouped[task.status].push(task);
    });

    // Sort by order within each status
    Object.keys(grouped).forEach((status) => {
      grouped[status as TaskStatus].sort((a, b) => a.order - b.order);
    });

    return grouped;
  }, [tasks]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t._id === active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const task = tasks.find((t) => t._id === taskId);
    if (!task) return;

    const overId = over.id as string;
    
    // Check if dropped on a column
    const statusKeys = Object.values(TaskStatus) as TaskStatus[];
    let newStatus = statusKeys.find((status) => status === overId);
    
    // If not dropped on a status column, check if dropped on another task
    if (!newStatus) {
      const overTask = tasks.find((t) => t._id === overId);
      if (overTask) {
        newStatus = overTask.status;
      } else {
        return;
      }
    }

    // If dropped on same column, calculate new order based on position
    if (newStatus === task.status) {
      const tasksInColumn = tasksByStatus[task.status];
      const overTaskIndex = tasksInColumn.findIndex((t) => t._id === overId);
      
      if (overTaskIndex !== -1) {
        const newOrder = tasksInColumn[overTaskIndex].order;
        onTaskMove(taskId, newStatus, newOrder);
      }
      return;
    }

    // If dropped on different column
    if (newStatus !== task.status) {
      const tasksInNewColumn = tasksByStatus[newStatus];
      const newOrder = tasksInNewColumn.length > 0 
        ? Math.max(...tasksInNewColumn.map((t) => t.order)) + 1 
        : 0;
      onTaskMove(taskId, newStatus, newOrder);
    }
  };

  const statusLabels: Record<TaskStatus, string> = {
    [TaskStatus.TODO]: t('tasks:status.todo'),
    [TaskStatus.IN_PROGRESS]: t('tasks:status.in_progress'),
    [TaskStatus.IN_REVIEW]: t('tasks:status.in_review'),
    [TaskStatus.DONE]: t('tasks:status.done'),
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 p-4 overflow-x-auto h-full">
        {Object.values(TaskStatus).map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            title={statusLabels[status]}
            tasks={tasksByStatus[status]}
            onTaskClick={onTaskClick}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}

