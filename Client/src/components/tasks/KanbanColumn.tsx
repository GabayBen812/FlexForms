import { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Task, TaskStatus } from '@/types/tasks/task';
import { TaskCard } from './TaskCard';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  status: TaskStatus;
  title: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

export function KanbanColumn({ status, title, tasks, onTaskClick }: KanbanColumnProps) {
  const { t } = useTranslation();
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  const taskIds = useMemo(() => tasks.map((t) => t._id), [tasks]);

  return (
    <div className="flex h-full min-w-[310px] flex-col rounded-2xl border border-border/60 bg-muted/40 p-4 shadow-sm backdrop-blur">
      <div className="flex items-center justify-between pb-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground/80">{t('tasks:column_hint')}</p>
        </div>
        <Badge variant="secondary" className="rounded-full bg-background px-3 py-1 text-xs">
          {tasks.length}
        </Badge>
      </div>
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={cn(
            'relative flex-1 space-y-3 overflow-y-auto rounded-xl border border-dashed border-transparent p-1 transition-colors',
            isOver && 'border-primary/30 bg-primary/5'
          )}
        >
          {tasks.map((task) => (
            <TaskCard key={task._id} task={task} onClick={() => onTaskClick(task)} />
          ))}
          {tasks.length === 0 && (
            <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-muted-foreground/30 bg-background/40 px-4 text-center text-xs text-muted-foreground">
              <span className="font-medium text-muted-foreground/90">{t('tasks:empty_column')}</span>
              <span>{t('tasks:empty_column_hint')}</span>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}





