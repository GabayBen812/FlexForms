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
import { Task, TaskStatus, CreateTaskDto } from '@/types/tasks/task';
import { User } from '@/types/users/user';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

const UNASSIGNED_VALUE = '__unassigned__';

const taskSchema = z.object({
  title: z.string().min(1, 'tasks:validation.title_required'),
  description: z.string().optional(),
  status: z.nativeEnum(TaskStatus),
  assignedTo: z.string(),
  priority: z.number().min(0).max(2),
  dueDate: z.string().optional(),
  tags: z.string().optional(),
});

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task;
  users: User[];
  onSubmit: (data: CreateTaskDto) => void;
}

export function TaskDialog({ open, onOpenChange, task, users, onSubmit }: TaskDialogProps) {
  const { t } = useTranslation();

  const form = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title || '',
      description: task?.description || '',
      status: task?.status || TaskStatus.TODO,
      assignedTo: task?.assignedTo?._id || UNASSIGNED_VALUE,
      priority: task?.priority ?? 0,
      dueDate: task?.dueDate ? task.dueDate.slice(0, 10) : '',
      tags: task?.tags?.join(', ') || '',
    },
  });

  const handleSubmit = (data: z.infer<typeof taskSchema>) => {
    const tags = data.tags
      ?.split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    const assignedToValue = data.assignedTo === UNASSIGNED_VALUE ? undefined : data.assignedTo;

    const cleanedData: CreateTaskDto = {
      title: data.title,
      description: data.description || undefined,
      status: data.status || TaskStatus.TODO,
      assignedTo: assignedToValue,
      priority: data.priority ?? 0,
      dueDate: data.dueDate && data.dueDate !== '' ? data.dueDate : undefined,
      tags: tags && tags.length > 0 ? tags : undefined,
    };

    onSubmit(cleanedData);
  };

  React.useEffect(() => {
    if (!open) {
      form.reset();
      return;
    }

    if (task) {
      form.reset({
        title: task.title || '',
        description: task.description || '',
        status: task.status || TaskStatus.TODO,
        assignedTo: task.assignedTo?._id || UNASSIGNED_VALUE,
        priority: task.priority ?? 0,
        dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
        tags: task.tags?.join(', ') || '',
      });
    } else {
      form.reset({
        title: '',
        description: '',
        status: TaskStatus.TODO,
        assignedTo: UNASSIGNED_VALUE,
        priority: 0,
        dueDate: '',
        tags: '',
      });
    }
  }, [open, task, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {task ? t('tasks:edit_task') : t('tasks:create_task')}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {task ? t('tasks:edit_task_description') : t('tasks:create_task_description')}
          </DialogDescription>
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
                      <FormLabel>{t('tasks:status')}</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value as TaskStatus)}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={TaskStatus.TODO}>{t('tasks:status.todo')}</SelectItem>
                          <SelectItem value={TaskStatus.IN_PROGRESS}>
                            {t('tasks:status.in_progress')}
                          </SelectItem>
                          <SelectItem value={TaskStatus.IN_REVIEW}>
                            {t('tasks:status.in_review')}
                          </SelectItem>
                          <SelectItem value={TaskStatus.DONE}>{t('tasks:status.done')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('tasks:priority')}</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(Number(value))}
                        value={String(field.value ?? 0)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">{t('tasks:priority.low')}</SelectItem>
                          <SelectItem value="1">{t('tasks:priority.medium')}</SelectItem>
                          <SelectItem value="2">{t('tasks:priority.high')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('tasks:due_date')}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
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
                        <Input
                          {...field}
                          placeholder={t('tasks:tags_placeholder') ?? ''}
                          className={cn('placeholder:text-muted-foreground')}
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
              <div className="flex justify-end gap-3 border-t pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="border-muted-foreground/30 text-muted-foreground hover:bg-muted"
                >
                  {t('common:cancel')}
                </Button>
                <Button type="submit" className="min-w-[120px]">
                  {t('common:save')}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

