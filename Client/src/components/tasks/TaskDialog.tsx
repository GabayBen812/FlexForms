import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Task, CreateTaskDto, TaskColumn } from '@/types/tasks/task';
import { User } from '@/types/users/user';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Trash2, X } from 'lucide-react';

const UNASSIGNED_VALUE = '__unassigned__';

const taskSchema = z.object({
  title: z.string().min(1, 'tasks:validation.title_required'),
  description: z.string().optional(),
  status: z.string().min(1),
  assignedTo: z.string(),
  tags: z.array(z.string().min(1)).default([]),
});

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task;
  users: User[];
  columns: TaskColumn[];
  onSubmit: (data: CreateTaskDto) => void;
  onDelete?: () => void;
  isSubmitting?: boolean;
  isDeleting?: boolean;
}

export function TaskDialog({
  open,
  onOpenChange,
  task,
  users,
  columns,
  onSubmit,
  onDelete,
  isSubmitting,
  isDeleting,
}: TaskDialogProps) {
  const { t } = useTranslation();

  const firstColumnKey = columns[0]?.key ?? '';
  const defaultStatus = task?.status || firstColumnKey;

  const form = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title || '',
      description: task?.description || '',
      status: defaultStatus,
      assignedTo: task?.assignedTo?._id || UNASSIGNED_VALUE,
      tags: task?.tags ?? [],
    },
  });

  const handleSubmit = (data: z.infer<typeof taskSchema>) => {
    const assignedToValue = data.assignedTo === UNASSIGNED_VALUE ? undefined : data.assignedTo;

    const cleanedData: CreateTaskDto = {
      title: data.title,
      description: data.description || undefined,
      status: data.status,
      assignedTo: assignedToValue,
      tags: data.tags && data.tags.length > 0 ? data.tags : undefined,
    };

    onSubmit(cleanedData);
  };

  React.useEffect(() => {
    const nextDefaultStatus = task?.status || columns[0]?.key || '';

    if (!open) {
      form.reset();
      return;
    }

    if (task) {
      form.reset({
        title: task.title || '',
        description: task.description || '',
        status: nextDefaultStatus,
        assignedTo: task.assignedTo?._id || UNASSIGNED_VALUE,
        tags: task.tags ?? [],
      });
    } else {
      form.reset({
        title: '',
        description: '',
        status: nextDefaultStatus,
        assignedTo: UNASSIGNED_VALUE,
        tags: [],
      });
    }
  }, [open, task, form, firstColumnKey]);

  const renderColumnName = (column: TaskColumn) => {
    if (column.name.includes(':')) {
      const translated = t(column.name);
      if (translated !== column.name) {
        return translated;
      }
    }
    return column.name;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {task ? t('tasks:edit_task') : t('tasks:create_task')}
          </DialogTitle>
          
        </DialogHeader>
        <div className="p-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('tasks:title')}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={t('tasks:title_placeholder') ?? ''} />
                      </FormControl>
                      <FormMessage className="text-xs text-red-500">
                        {form.formState.errors.title?.message &&
                          t(form.formState.errors.title.message)}
                      </FormMessage>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="assignedTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('tasks:assign_to')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('tasks:select_user')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={UNASSIGNED_VALUE}>{t('tasks:unassigned')}</SelectItem>
                          {users.map((user) => (
                            <SelectItem key={user._id} value={user._id}>
                              {user.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('tasks:status_label')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!columns.length}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('tasks:select_board')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {columns.map((column) => (
                            <SelectItem key={column.key} value={column.key}>
                              {renderColumnName(column)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('tasks:tags')}</FormLabel>
                      <FormControl>
                        <TagInput
                          value={field.value ?? []}
                          onChange={field.onChange}
                          placeholder={t('tasks:tags_placeholder') ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('tasks:description')}</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={4}
                        placeholder={t('tasks:description_placeholder') ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div
                className={cn(
                  'flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center',
                  task && onDelete ? 'sm:justify-between' : 'sm:justify-end',
                )}
              >
                {task && onDelete && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={onDelete}
                    disabled={isDeleting}
                    className="inline-flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    {t('tasks:delete_task')}
                  </Button>
                )}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="border-muted-foreground/30 text-muted-foreground hover:bg-muted"
                  >
                    {t('common:cancel')}
                  </Button>
                  <Button type="submit" className="min-w-[120px]" disabled={isSubmitting}>
                    {t('common:save')}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

function TagInput({ value, onChange, placeholder }: TagInputProps) {
  const [inputValue, setInputValue] = React.useState('');
  const { t } = useTranslation();
  const chipClassName =
    'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed) return;
    if (value.includes(trimmed)) return;
    onChange([...value, trimmed]);
    setInputValue('');
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((item) => item !== tag));
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addTag(inputValue);
    } else if (event.key === 'Backspace' && inputValue === '' && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  return (
    <div
      className={cn(
        'flex min-h-[42px] flex-wrap items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20',
      )}
    >
      {value.map((tag) => (
        <span key={tag} className={chipClassName}>
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className="rounded-full p-0.5 transition hover:bg-white/20"
            aria-label={t('tasks:remove_tag')}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        value={inputValue}
        onChange={(event) => setInputValue(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={value.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[120px] border-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}

