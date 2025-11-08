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
  DragCancelEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Task, TaskStatus } from '@/types/tasks/task';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from './TaskCard';
import { useTranslation } from 'react-i18next';

interface KanbanBoardProps {
  tasks: Task[];
  onTaskMove: (taskId: string, newStatus: TaskStatus, newOrder: number) => void;
  onTaskClick: (task: Task) => void;
}

const statusOrder = Object.values(TaskStatus) as TaskStatus[];

export function KanbanBoard({ tasks, onTaskMove, onTaskClick }: KanbanBoardProps) {
  const { t } = useTranslation();
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
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

    statusOrder.forEach((status) => {
      grouped[status].sort((a, b) => a.order - b.order);
    });

    return grouped;
  }, [tasks]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t._id === active.id);
    setActiveTask(task || null);
  };

  const resolveStatusFromOverId = (overId: string | undefined): TaskStatus | null => {
    if (!overId) return null;
    if (statusOrder.includes(overId as TaskStatus)) {
      return overId as TaskStatus;
    }
    const overTask = tasks.find((t) => t._id === overId);
    return overTask ? overTask.status : null;
  };

  const calculateNewOrder = (
    task: Task,
    newStatus: TaskStatus,
    overId: string | undefined,
  ): number | null => {
    const sourceColumn = tasksByStatus[task.status];
    const destinationColumn = tasksByStatus[newStatus];

    if (task.status === newStatus) {
      const currentIndex = sourceColumn.findIndex((t) => t._id === task._id);
      if (currentIndex === -1) return null;

      let targetIndex: number;
      if (!overId || overId === newStatus) {
        targetIndex = destinationColumn.length - 1;
      } else if (overId === task._id) {
        return null;
      } else {
        targetIndex = destinationColumn.findIndex((t) => t._id === overId);
        if (targetIndex === -1) {
          targetIndex = destinationColumn.length - 1;
        }
      }

      if (targetIndex === currentIndex) {
        return null;
      }

      if (targetIndex > currentIndex) {
        return targetIndex;
      }
      return targetIndex;
    }

    const filteredDestination =
      task.status === newStatus
        ? destinationColumn.filter((t) => t._id !== task._id)
        : destinationColumn;

    if (!overId || overId === newStatus) {
      return filteredDestination.length;
    }

    const foundIndex = filteredDestination.findIndex((t) => t._id === overId);
    return foundIndex === -1 ? filteredDestination.length : foundIndex;
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const task = tasks.find((t) => t._id === taskId);
    if (!task) return;

    const overId = over.id as string | undefined;
    const newStatus = resolveStatusFromOverId(overId);
    if (!newStatus) return;

    const newOrder = calculateNewOrder(task, newStatus, overId);
    if (newOrder === null) return;

    onTaskMove(taskId, newStatus, newOrder);
  };

  const handleDragCancel = (_event: DragCancelEvent) => {
    setActiveTask(null);
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
      onDragCancel={handleDragCancel}
    >
      <div className="flex h-full gap-5 overflow-x-auto px-6 pb-6 pt-4">
        {statusOrder.map((status) => (
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
        {activeTask ? <TaskCard task={activeTask} isDragging onClick={() => {}} /> : null}
      </DragOverlay>
    </DndContext>
  );
}