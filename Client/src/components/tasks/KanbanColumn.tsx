import { useEffect, useMemo, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, PenLine, Palette, Trash2 } from 'lucide-react';
import { Task, TaskColumn } from '@/types/tasks/task';
import { TaskCard } from './TaskCard';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface KanbanColumnProps {
  column: TaskColumn;
  title: string;
  tasks: Task[];
  colorOptions: string[];
  onTaskClick: (task: Task) => void;
  onTaskDelete: (task: Task) => void;
  onRename: (name: string) => void;
  onColorChange: (color: string) => void;
  onDelete: () => void;
  canDelete: boolean;
  isDeletingTask?: boolean;
}

export function KanbanColumn({
  column,
  title,
  tasks,
  colorOptions,
  onTaskClick,
  onTaskDelete,
  onRename,
  onColorChange,
  onDelete,
  canDelete,
  isDeletingTask,
}: KanbanColumnProps) {
  const { t } = useTranslation();
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: column.key,
  });

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column._id,
    data: { type: 'column', columnKey: column.key },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const taskIds = useMemo(() => tasks.map((t) => t._id), [tasks]);
  const [isEditing, setIsEditing] = useState(false);
  const [nameValue, setNameValue] = useState(title);

  useEffect(() => {
    setNameValue(title);
  }, [title]);

  const handleRename = () => {
    setIsEditing(false);
    const trimmed = nameValue.trim();
    if (!trimmed) {
      setNameValue(title);
      return;
    }
    if (trimmed === title) {
      setNameValue(title);
      return;
    }
    setNameValue(trimmed);
    onRename(trimmed);
  };

  const containerStyle = useMemo(
    () => ({
      borderColor: column.color,
      backgroundColor: `${column.color}33`,
    }),
    [column.color],
  );

  const combinedStyle = {
    ...containerStyle,
    ...style,
  };

  return (
    <div
      ref={setNodeRef}
      style={combinedStyle}
      className={cn(
        'flex h-full min-w-[310px] flex-col rounded-2xl border bg-muted/40 p-4 shadow-sm backdrop-blur',
        isDragging && 'cursor-grabbing opacity-60',
      )}
    >
      <div className="flex items-start justify-between gap-3 pb-3">
        <div className="flex flex-col">
          {isEditing ? (
            <Input
              value={nameValue}
              onChange={(event) => setNameValue(event.target.value)}
              onBlur={handleRename}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  handleRename();
                } else if (event.key === 'Escape') {
                  setNameValue(title);
                  setIsEditing(false);
                }
              }}
              autoFocus
              className="h-8 text-base font-semibold"
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 text-left text-base font-semibold text-foreground transition-colors hover:text-primary"
            >
              {title}
              <PenLine className="h-3.5 w-3.5 opacity-60" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div
            {...attributes}
            {...listeners}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-muted-foreground transition hover:border-border hover:text-foreground active:cursor-grabbing"
            aria-label={t('tasks:drag_board')}
          >
            <GripVertical className="h-4 w-4" />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="inline-flex h-8 items-center gap-2 px-2 hover:bg-primary/5"
                aria-label={t('tasks:pick_color')}
              >
                <span
                  className="h-3.5 w-3.5 rounded-full border border-border/70"
                  style={{ backgroundColor: column.color }}
                />
                <Palette className="h-3 w-3 opacity-70" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-36">
              <div className="grid grid-cols-3 gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={cn(
                      'flex h-9 items-center justify-center rounded-md border transition-all hover:bg-primary/10',
                      column.color === color
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-transparent hover:ring-2 hover:ring-primary/15',
                    )}
                    onClick={() => onColorChange(color)}
                    aria-label={t('tasks:color_option')}
                  >
                    <span
                      className="h-5 w-5 rounded-full border border-border/70"
                      style={{ backgroundColor: color }}
                    />
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground transition hover:bg-primary/10 hover:text-destructive"
            onClick={onDelete}
            disabled={!canDelete}
            aria-label={t('tasks:delete_board')}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Badge variant="secondary" className="rounded-full bg-background px-3 py-1 text-xs">
            {tasks.length}
          </Badge>
        </div>
      </div>
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div
          ref={setDropRef}
          className={cn(
            'relative flex-1 space-y-3 overflow-y-auto rounded-xl border border-dashed border-transparent p-1 transition-colors',
            isOver && 'border-primary/30 bg-primary/5',
          )}
        >
          {tasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              onClick={() => onTaskClick(task)}
              onDelete={onTaskDelete}
              isDeleting={isDeletingTask}
            />
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
