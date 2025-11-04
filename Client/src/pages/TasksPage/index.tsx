import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useContext } from 'react';
import { OrganizationsContext } from '@/contexts/OrganizationsContext';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { KanbanBoard } from '@/components/tasks/KanbanBoard';
import { TaskDialog } from '@/components/tasks/TaskDialog';
import { fetchAllTasks, createTask, updateTask, moveTask } from '@/api/tasks';
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

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', organization?._id],
    queryFn: fetchAllTasks,
    enabled: !!organization?._id,
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users', organization?._id],
    queryFn: async () => {
      if (!organization?._id) return { data: [] };
      const result = await fetchUsersParams({
        organizationId: organization._id,
      });
      return result;
    },
    enabled: !!organization?._id,
  });

  const users = (usersData?.data && Array.isArray(usersData.data) ? usersData.data : []) as User[];

  const createMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setIsDialogOpen(false);
      setSelectedTask(null);
      toast({
        title: t('tasks:task_created'),
        description: t('tasks:task_created_successfully'),
      });
    },
    onError: (error: any) => {
      console.error('Error creating task:', error);
      const errorMessage = error?.response?.data?.message || error?.message || t('tasks:failed_to_create_task');
      toast({
        title: t('common:error'),
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateTaskDto }) =>
      updateTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setIsDialogOpen(false);
      setSelectedTask(null);
      toast({
        title: t('tasks:task_updated'),
        description: t('tasks:task_updated_successfully'),
      });
    },
    onError: (error: any) => {
      console.error('Error updating task:', error);
      const errorMessage = error?.response?.data?.message || error?.message || t('tasks:failed_to_update_task');
      toast({
        title: t('common:error'),
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  const moveMutation = useMutation({
    mutationFn: ({ taskId, newStatus, newOrder }: {
      taskId: string;
      newStatus: TaskStatus;
      newOrder: number;
    }) => moveTask(taskId, newStatus, newOrder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: () => {
      toast({
        title: t('common:error'),
        description: t('tasks:failed_to_move_task'),
        variant: 'destructive',
      });
    },
  });

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsDialogOpen(true);
  };

  const handleTaskSubmit = (data: CreateTaskDto) => {
    console.log('Submitting task data:', data);
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
    return <div className="p-4">{t('common:loading')}...</div>;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-6 border-b">
        <h1 className="text-2xl font-semibold">{t('tasks')}</h1>
        <Button onClick={() => {
          setSelectedTask(null);
          setIsDialogOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          {t('tasks:create_task')}
        </Button>
      </div>
      <div className="flex-1 overflow-hidden">
        <KanbanBoard
          tasks={tasks}
          onTaskMove={handleTaskMove}
          onTaskClick={handleTaskClick}
        />
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
