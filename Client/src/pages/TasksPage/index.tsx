import { useCallback, useEffect, useMemo, useRef, useState, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { OrganizationsContext } from '@/contexts/OrganizationsContext';
import { Button } from '@/components/ui/button';
import { KanbanBoard } from '@/components/tasks/KanbanBoard';
import { TaskDialog } from '@/components/tasks/TaskDialog';
import {
  fetchAllTasks,
  createTask,
  updateTask,
  moveTask,
  MoveTaskPayload,
  fetchTaskColumns,
  createTaskColumn,
  updateTaskColumn,
  deleteTaskColumn,
  reorderTaskColumns,
  deleteTask,
} from '@/api/tasks';
import { fetchUsersParams } from '@/api/users';
import { Task, TaskColumn, CreateTaskDto } from '@/types/tasks/task';
import { User } from '@/types/users/user';
import { useToast } from '@/hooks/use-toast';
import { showConfirm } from '@/utils/swal';

const COLOR_OPTIONS = ['#CBD5F5', '#FDE68A', '#FBCFE8', '#BBF7D0', '#BAE6FD', '#E9D5FF'];

export default function TasksPage() {
  const { t } = useTranslation();
  const { organization } = useContext(OrganizationsContext);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const tasksQueryKey = useMemo(() => ['tasks', organization?._id], [organization?._id]);
  const columnsQueryKey = useMemo(() => ['task-columns', organization?._id], [organization?._id]);
  const usersQueryKey = useMemo(() => ['users', organization?._id], [organization?._id]);

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: tasksQueryKey,
    queryFn: fetchAllTasks,
    enabled: !!organization?._id,
  });

  const { data: columns = [], isLoading: columnsLoading } = useQuery({
    queryKey: columnsQueryKey,
    queryFn: fetchTaskColumns,
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
    [usersData?.data],
  );

  const columnsRef = useRef<TaskColumn[]>([]);
  useEffect(() => {
    columnsRef.current = columns;
  }, [columns]);

  const reorderTasksOptimistic = useCallback(
    (currentTasks: Task[], payload: MoveTaskPayload, boardColumns: TaskColumn[]): Task[] => {
      if (!boardColumns.length) {
        return currentTasks;
      }

      const grouped = boardColumns.reduce<Record<string, Task[]>>((acc, column) => {
        acc[column.key] = [];
        return acc;
      }, {});

      const clonedTasks = currentTasks.map((task) => ({ ...task }));
      const movingTaskIndex = clonedTasks.findIndex((task) => task._id === payload.taskId);
      if (movingTaskIndex === -1) {
        return currentTasks;
      }

      const [movingTask] = clonedTasks.splice(movingTaskIndex, 1);

      const overflow: Task[] = [];
      clonedTasks.forEach((task) => {
        if (grouped[task.status]) {
          grouped[task.status].push(task);
        } else {
          overflow.push(task);
        }
      });

      Object.values(grouped).forEach((list) => list.sort((a, b) => a.order - b.order));

      if (!grouped[payload.newStatus]) {
        grouped[payload.newStatus] = [];
      }

      const destination = grouped[payload.newStatus];
      const insertionIndex = Math.min(payload.newOrder, destination.length);
      destination.splice(insertionIndex, 0, {
        ...movingTask,
        status: payload.newStatus,
      });

      Object.keys(grouped).forEach((statusKey) => {
        grouped[statusKey] = grouped[statusKey].map((task, index) => ({
          ...task,
          order: index,
        }));
      });

      return [
        ...boardColumns.flatMap((column) => grouped[column.key] ?? []),
        ...overflow,
      ];
    },
    [],
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
        const optimistic = reorderTasksOptimistic(previousTasks, variables, columnsRef.current);
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

  const updateColumnMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; color?: string } }) =>
      updateTaskColumn(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: columnsQueryKey });
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || t('tasks:column_update_failed');
      toast({
        title: t('common:error'),
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  const createColumnMutation = useMutation({
    mutationFn: createTaskColumn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: columnsQueryKey });
      toast({
        title: t('tasks:column_created'),
        description: t('tasks:column_created_successfully'),
      });
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || t('tasks:column_create_failed');
      toast({
        title: t('common:error'),
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  const deleteColumnMutation = useMutation({
    mutationFn: deleteTaskColumn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: columnsQueryKey });
      toast({
        title: t('tasks:delete_board'),
        description: t('tasks:column_deleted_successfully'),
      });
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message || error?.message || t('tasks:column_delete_failed');
      toast({
        title: t('common:error'),
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  const reorderColumnsMutation = useMutation({
    mutationFn: reorderTaskColumns,
    onMutate: async (newOrder: string[]) => {
      await queryClient.cancelQueries({ queryKey: columnsQueryKey });
      const previousColumns = queryClient.getQueryData<TaskColumn[]>(columnsQueryKey);

      if (previousColumns) {
        const mapping = new Map(previousColumns.map((column) => [column._id, column]));
        const reordered = newOrder
          .map((id) => mapping.get(id))
          .filter((column): column is TaskColumn => Boolean(column));
        queryClient.setQueryData(columnsQueryKey, reordered);
      }

      return { previousColumns };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousColumns) {
        queryClient.setQueryData(columnsQueryKey, context.previousColumns);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: columnsQueryKey });
    },
  });

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsDialogOpen(true);
  };

  const handleOpenCreateTask = () => {
    if (!columns.length) {
      toast({
        title: t('common:error'),
        description: t('tasks:no_columns_warning'),
        variant: 'destructive',
      });
      return;
    }
    setSelectedTask(null);
    setIsDialogOpen(true);
  };

  const handleTaskSubmit = (data: CreateTaskDto) => {
    if (selectedTask) {
      updateMutation.mutate({ id: selectedTask._id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleTaskMove = (taskId: string, newStatus: string, newOrder: number) => {
    moveMutation.mutate({ taskId, newStatus, newOrder });
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tasksQueryKey });
      setIsDialogOpen(false);
      setSelectedTask(null);
      toast({
        title: t('tasks:task_deleted'),
        description: t('tasks:task_deleted_successfully'),
      });
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message || error?.message || t('tasks:failed_to_delete_task');
      toast({
        title: t('common:error'),
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  const handleTaskDelete = useCallback(
    async (task: Task) => {
      if (deleteMutation.isPending) {
        return;
      }

      const confirmed = await showConfirm(t('tasks:delete_task_confirm'), t('tasks:delete_task'));
      if (!confirmed) return;

      deleteMutation.mutate(task._id);
    },
    [deleteMutation, t],
  );

  const handleRenameColumn = (column: TaskColumn, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast({
        title: t('common:error'),
        description: t('tasks:column_name_required'),
        variant: 'destructive',
      });
      return;
    }

    if (trimmed === column.name) {
      return;
    }

    updateColumnMutation.mutate({ id: column._id, data: { name: trimmed } });
  };

  const handleColorChange = (column: TaskColumn, color: string) => {
    if (color === column.color) return;
    updateColumnMutation.mutate({ id: column._id, data: { color } });
  };

  const handleCreateColumn = () => {
    if (createColumnMutation.isPending) return;
    const defaultName = t('tasks:new_board_default');
    const color = COLOR_OPTIONS[columns.length % COLOR_OPTIONS.length];
    createColumnMutation.mutate({ name: defaultName, color });
  };

  const handleColumnDelete = async (column: TaskColumn) => {
    if (columns.length <= 1) {
      toast({
        title: t('common:error'),
        description: t('tasks:cannot_delete_last_board'),
        variant: 'destructive',
      });
      return;
    }

    const confirmed = await showConfirm(t('tasks:delete_board_confirm'), t('tasks:delete_board'));
    if (!confirmed) return;

    deleteColumnMutation.mutate(column._id);
  };

  const handleColumnReorder = (orderedIds: string[]) => {
    reorderColumnsMutation.mutate(orderedIds);
  };

  if (tasksLoading || usersLoading || columnsLoading) {
    return <div className="p-4 text-muted-foreground">{t('common:loading')}...</div>;
  }

  return (
    <div className="flex h-full flex-col bg-muted/20">
      <div className="flex flex-col gap-5 border-b border-border/60 bg-background px-6 py-5 shadow-sm">
        <div className="flex flex-col">
          <h1 className="text-2xl font-semibold">{t('tasks:heading')}</h1>
        </div>
        <div className="flex justify-center">
          <Button
            onClick={handleOpenCreateTask}
            className="h-12 gap-3 rounded-xl px-8 text-base font-semibold shadow-sm transition hover:shadow-md"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            <Plus className="h-5 w-5" />
            {t('tasks:create_task')}
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <KanbanBoard
          tasks={tasks}
          columns={columns}
          colorOptions={COLOR_OPTIONS}
          onTaskMove={handleTaskMove}
          onTaskClick={handleTaskClick}
          onTaskDelete={handleTaskDelete}
          onColumnRename={handleRenameColumn}
          onColumnColorChange={handleColorChange}
          onColumnDelete={handleColumnDelete}
          onColumnReorder={handleColumnReorder}
          onAddColumn={handleCreateColumn}
          isDeletingTask={deleteMutation.isPending}
        />
      </div>
      <TaskDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        task={selectedTask || undefined}
        users={users}
        columns={columns}
        onSubmit={handleTaskSubmit}
        onDelete={
          selectedTask ? () => { void handleTaskDelete(selectedTask); } : undefined
        }
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}
