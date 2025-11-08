import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, Tag as TagIcon, UserRound } from 'lucide-react';
import { Task } from '@/types/tasks/task';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDateForDisplay } from '@/lib/dateUtils';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  isDragging?: boolean;
}

export function TaskCard({ task, onClick, isDragging }: TaskCardProps) {
  const { t } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging || isDragging ? 0.5 : 1,
  };

  const priorityStyles: Record<number, { label: string; className: string }> = {
    0: { label: t('tasks:priority.low'), className: 'bg-emerald-100 text-emerald-700' },
    1: { label: t('tasks:priority.medium'), className: 'bg-amber-100 text-amber-700' },
    2: { label: t('tasks:priority.high'), className: 'bg-rose-100 text-rose-700' },
  };

  const priority = priorityStyles[task.priority ?? 0];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'group relative flex cursor-pointer flex-col rounded-xl border border-border/60 bg-background/95 p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg',
        isSortableDragging && 'border-primary/40 shadow-xl',
        isDragging && 'border-dashed border-primary/60'
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h4 className="line-clamp-2 text-sm font-semibold leading-tight text-foreground">
            {task.title}
          </h4>
          {task.description && (
            <p className="line-clamp-2 text-xs text-muted-foreground">{task.description}</p>
          )}
        </div>
        {priority && (
          <Badge
            variant="secondary"
            className={cn(
              'shrink-0 border-0 text-[11px] font-medium uppercase tracking-wide',
              priority.className
            )}
          >
            {priority.label}
          </Badge>
        )}
      </div>

      {(task.tags && task.tags.length > 0) && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {task.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="border-dashed text-[11px] font-medium">
              <TagIcon className="mr-1 h-3 w-3 text-primary/80" />
              {tag}
            </Badge>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          {task.assignedTo ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-7 w-7 border border-border/50 bg-muted">
                <AvatarFallback className="text-[10px] font-semibold uppercase">
                  {getInitials(task.assignedTo.name)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline-flex items-center gap-1">
                <UserRound className="h-3.5 w-3.5" />
                {task.assignedTo.name}
              </span>
            </div>
          ) : (
            <span className="inline-flex items-center gap-1 text-muted-foreground/80">
              <UserRound className="h-3.5 w-3.5" />
              {t('tasks:unassigned')}
            </span>
          )}
        </div>
        {task.dueDate && (
          <span className="inline-flex items-center gap-1 whitespace-nowrap">
            <Calendar className="h-3.5 w-3.5" />
            {formatDateForDisplay(task.dueDate)}
          </span>
        )}
      </div>
    </div>
  );
}





