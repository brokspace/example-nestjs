export const TASK_STATUSES = ['todo', 'in_progress', 'done'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  ownerId: string;
  dueDate?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Allowed status changes. A finished task can only be reopened as
 * in_progress, never sent straight back to todo.
 */
export const STATUS_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  todo: ['in_progress', 'done'],
  in_progress: ['todo', 'done'],
  done: ['in_progress'],
};
