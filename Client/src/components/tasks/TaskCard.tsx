import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '@/types/tasks/task';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDateForDisplay } from '@/lib/dateUtils';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  isDragging?: boolean;
}

export function TaskCard({ task, onClick, isDragging }: TaskCardProps) {
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

  const priorityColors = {
    0: 'bg-green-500',
    1: 'bg-yellow-500',
    2: 'bg-red-500',
  };

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
      onClick={onClick}
      className={cn(
        'bg-background border rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow',
        isSortableDragging && 'shadow-lg'
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-sm flex-1">{task.title}</h4>
        {task.priority !== undefined && (
          <div
            className={cn(
              'w-2 h-2 rounded-full ml-2',
              priorityColors[task.priority as keyof typeof priorityColors]
            )}
          />
        )}
      </div>
      {task.description && (
        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
          {task.description}
        </p>
      )}
      <div className="flex items-center justify-between mt-2">
        {task.assignedTo && (
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs">
              {getInitials(task.assignedTo.name)}
            </AvatarFallback>
          </Avatar>
        )}
        {task.dueDate && (
          <span className="text-xs text-muted-foreground">
            {formatDateForDisplay(task.dueDate)}
          </span>
        )}
      </div>
    </div>
  );
}


