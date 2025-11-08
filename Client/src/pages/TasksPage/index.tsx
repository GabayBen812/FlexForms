import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useContext } from 'react';
import { OrganizationsContext } from '@/contexts/OrganizationsContext';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { KanbanBoard } from '@/components/tasks/KanbanBoard';
import { TaskDialog } from '@/components/tasks/TaskDialog';
import { fetchAllTasks, createTask, updateTask, moveTask, MoveTaskPayload } from '@/api/tasks';
import { fetchUsersParams } from '@/api/users';
import { Task, TaskStatus, CreateTaskDto } from '@/types/tasks/task';
import { User } from '@/types/users/user';
import { useToast } from '@/hooks/use-toast';

export default function TasksPage() {
  const { t } = useTranslation();
  const { organization } = useContext(OrganizationsContext);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const tasksQueryKey = useMemo(() => ['tasks', organization?._id], [organization?._id]);
  const usersQueryKey = useMemo(() => ['users', organization?._id], [organization?._id]);

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: tasksQueryKey,
    queryFn: fetchAllTasks,
    enabled: !!organization?._id,
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: usersQueryKey,
    queryFn: async () => {
      if (!organization?._id) return { data: [] };
      return fetchUsersParams({ organizationId: organization._id });
    },
    enabled: !!organization?._id,
  });

  const users = useMemo(
    () => ((usersData?.data && Array.isArray(usersData.data) ? usersData.data : []) as User[]),
    [usersData?.data]
  );

  const reorderTasksOptimistic = useCallback(
    (currentTasks: Task[], payload: MoveTaskPayload): Task[] => {
      const statuses = Object.values(TaskStatus) as TaskStatus[];
      const grouped: Record<TaskStatus, Task[]> = statuses.reduce(
        (acc, status) => {
          acc[status] = [];
          return acc;
        },
        {} as Record<TaskStatus, Task[]>
      );

      const clonedTasks = currentTasks.map((task) => ({ ...task }));
      const movingTaskIndex = clonedTasks.findIndex((task) => task._id === payload.taskId);
      if (movingTaskIndex === -1) {
        return currentTasks;
      }

      const [movingTask] = clonedTasks.splice(movingTaskIndex, 1);

      clonedTasks.forEach((task) => {
        grouped[task.status].push(task);
      });

      statuses.forEach((status) => {
        grouped[status].sort((a, b) => a.order - b.order);
      });

      const destinationColumn = grouped[payload.newStatus];
      const insertionIndex =
        payload.newOrder > destinationColumn.length ? destinationColumn.length : payload.newOrder;

      destinationColumn.splice(insertionIndex, 0, {
        ...movingTask,
        status: payload.newStatus,
      });

      statuses.forEach((status) => {
        grouped[status] = grouped[status].map((task, index) => ({
          ...task,
          order: index,
        }));
      });

      return statuses.flatMap((status) => grouped[status]);
    },
    []
  );

  const createMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tasksQueryKey });
      setIsDialogOpen(false);
      setSelectedTask(null);
      toast({
        title: t('tasks:task_created'),
        description: t('tasks:task_created_successfully'),
      });
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message || error?.message || t('tasks:failed_to_create_task');
      toast({
        title: t('common:error'),
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateTaskDto }) => updateTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tasksQueryKey });
      setIsDialogOpen(false);
      setSelectedTask(null);
      toast({
        title: t('tasks:task_updated'),
        description: t('tasks:task_updated_successfully'),
      });
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message || error?.message || t('tasks:failed_to_update_task');
      toast({
        title: t('common:error'),
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  const moveMutation = useMutation({
    mutationFn: moveTask,
    onMutate: async (variables: MoveTaskPayload) => {
      await queryClient.cancelQueries({ queryKey: tasksQueryKey });
      const previousTasks = queryClient.getQueryData<Task[]>(tasksQueryKey);

      if (previousTasks) {
        const optimistic = reorderTasksOptimistic(previousTasks, variables);
        queryClient.setQueryData(tasksQueryKey, optimistic);
      }

      return { previousTasks };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(tasksQueryKey, context.previousTasks);
      }
      toast({
        title: t('common:error'),
        description: t('tasks:failed_to_move_task'),
        variant: 'destructive',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: tasksQueryKey });
    },
  });

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsDialogOpen(true);
  };

  const handleTaskSubmit = (data: CreateTaskDto) => {
    if (selectedTask) {
      updateMutation.mutate({ id: selectedTask._id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleTaskMove = (taskId: string, newStatus: TaskStatus, newOrder: number) => {
    moveMutation.mutate({ taskId, newStatus, newOrder });
  };

  if (tasksLoading || usersLoading) {
    return <div className="p-4 text-muted-foreground">{t('common:loading')}...</div>;
  }

  return (
    <div className="flex h-full flex-col bg-muted/20">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 bg-background px-6 py-5 shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold">{t('tasks:heading')}</h1>
          <p className="text-sm text-muted-foreground">{t('tasks:heading_subtitle')}</p>
        </div>
        <Button
          onClick={() => {
            setSelectedTask(null);
            setIsDialogOpen(true);
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          {t('tasks:create_task')}
        </Button>
      </div>
      <div className="flex-1 overflow-hidden">
        <KanbanBoard tasks={tasks} onTaskMove={handleTaskMove} onTaskClick={handleTaskClick} />
      </div>
      <TaskDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        task={selectedTask || undefined}
        users={users}
        onSubmit={handleTaskSubmit}
      />
    </div>
  );
}
