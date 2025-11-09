import { useState, useMemo, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragCancelEvent,
  pointerWithin,
  rectIntersection,
  closestCorners,
  CollisionDetection,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { Task, TaskColumn } from '@/types/tasks/task';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from './TaskCard';
import { useTranslation } from 'react-i18next';

interface KanbanBoardProps {
  tasks: Task[];
  visibleTasks?: Task[];
  columns: TaskColumn[];
  colorOptions: string[];
  onTaskMove: (taskId: string, newStatus: string, newOrder: number) => void;
  onTaskClick: (task: Task) => void;
  onTaskDelete: (task: Task) => void;
  onColumnRename: (column: TaskColumn, name: string) => void;
  onColumnColorChange: (column: TaskColumn, color: string) => void;
  onColumnDelete: (column: TaskColumn) => void;
  onColumnReorder: (columnIds: string[]) => void;
  onAddColumn: () => void;
  onAddTaskToColumn: (column: TaskColumn) => void;
  isDeletingTask?: boolean;
}

export function KanbanBoard({
  tasks,
  columns,
  visibleTasks,
  colorOptions,
  onTaskMove,
  onTaskClick,
  onTaskDelete,
  onColumnRename,
  onColumnColorChange,
  onColumnDelete,
  onColumnReorder,
  onAddColumn,
  onAddTaskToColumn,
  isDeletingTask,
}: KanbanBoardProps) {
  const { t } = useTranslation();
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const collisionDetection = useCallback<CollisionDetection>((args) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }

    const rectCollisions = rectIntersection(args);
    if (rectCollisions.length > 0) {
      return rectCollisions;
    }

    return closestCorners(args);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const statusOrder = useMemo(() => columns.map((column) => column.key), [columns]);
  const columnIdOrder = useMemo(() => columns.map((column) => column._id), [columns]);

  const visibleTaskSet = useMemo(() => {
    if (!visibleTasks) return null;
    return new Set(visibleTasks.map((task) => task._id));
  }, [visibleTasks]);

  const tasksByStatus = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    statusOrder.forEach((key) => {
      grouped[key] = [];
    });

    tasks.forEach((task) => {
      if (!grouped[task.status]) {
        grouped[task.status] = [];
      }
      grouped[task.status].push(task);
    });

    Object.keys(grouped).forEach((key) => {
      grouped[key].sort((a, b) => a.order - b.order);
    });

    return grouped;
  }, [tasks, statusOrder]);

  const displayTasksByStatus = useMemo(() => {
    if (!visibleTaskSet) {
      return tasksByStatus;
    }
    return Object.keys(tasksByStatus).reduce<Record<string, Task[]>>((acc, statusKey) => {
      acc[statusKey] = (tasksByStatus[statusKey] ?? []).filter((task) =>
        visibleTaskSet.has(task._id),
      );
      return acc;
    }, {});
  }, [tasksByStatus, visibleTaskSet]);

  const labelMap = useMemo(() => {
    return columns.reduce<Record<string, string>>((acc, column) => {
      if (column.name.includes(':')) {
        const translated = t(column.name);
        acc[column.key] = translated === column.name ? column.name : translated;
      } else {
        acc[column.key] = column.name;
      }
      return acc;
    }, {});
  }, [columns, t]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t._id === active.id);
    setActiveTask(task || null);
  };

  const resolveStatusFromOverId = (overId: string | undefined): string | null => {
    if (!overId) return null;
    if (statusOrder.includes(overId)) {
      return overId;
    }
    const overTask = tasks.find((t) => t._id === overId);
    return overTask ? overTask.status : null;
  };

  const calculateNewOrder = (
    task: Task,
    newStatus: string,
    overId: string | undefined,
  ): number | null => {
    const sourceColumn = tasksByStatus[task.status] ?? [];
    const destinationColumn = tasksByStatus[newStatus] ?? [];

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

    const activeType = event.active.data.current?.type;
    if (activeType === 'column') {
      const activeId = active.id as string;
      const overId = over.id as string;
      if (activeId === overId) return;

      const oldIndex = columnIdOrder.indexOf(activeId);
      const newIndex = columnIdOrder.indexOf(overId);
      if (oldIndex === -1 || newIndex === -1) return;

      const newOrder = arrayMove(columnIdOrder, oldIndex, newIndex);
      onColumnReorder(newOrder);
      return;
    }

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

  if (!columns.length) {
    return (
      <div className="flex h-full items-center justify-center px-6 pb-6 pt-4">
        <AddColumnCard onAdd={onAddColumn} />
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex h-full gap-5 overflow-x-auto px-6 pb-6 pt-4">
        <SortableContext items={columnIdOrder}>
          {columns.map((column) => (
            <KanbanColumn
              key={column._id}
              column={column}
              title={labelMap[column.key] ?? column.name}
              tasks={displayTasksByStatus[column.key] ?? []}
              colorOptions={colorOptions}
              onTaskClick={onTaskClick}
               onTaskDelete={onTaskDelete}
              onRename={(name) => onColumnRename(column, name)}
              onColorChange={(color) => onColumnColorChange(column, color)}
              onDelete={() => onColumnDelete(column)}
              canDelete={columns.length > 1}
              onAddTask={() => onAddTaskToColumn(column)}
              isDeletingTask={isDeletingTask}
            />
          ))}
        </SortableContext>
        <AddColumnCard onAdd={onAddColumn} />
      </div>
      <DragOverlay>
        {activeTask ? (
          <TaskCard task={activeTask} isDragging onClick={() => {}} isDeleting={isDeletingTask} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function AddColumnCard({ onAdd }: { onAdd: () => void }) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onAdd}
      className="flex h-full w-[400px] min-w-[400px] flex-none flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/60 bg-muted/30 text-sm text-muted-foreground transition hover:border-primary/60 hover:bg-primary/5"
    >
      <div className="flex flex-col items-center gap-2">
        <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed border-border/60 bg-background text-primary">
          <Plus className="h-6 w-6" />
        </span>
        <span className="font-medium">{t('tasks:add_column')}</span>
      </div>
    </button>
  );
}