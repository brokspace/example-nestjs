import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AuthUser } from '../auth/auth-user';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { STATUS_TRANSITIONS, Task, TaskStatus } from './task.entity';

/**
 * Task storage and rules. Members see and change only their own tasks;
 * admins see and change everyone's.
 */
@Injectable()
export class TasksService {
  private readonly tasks = new Map<string, Task>();

  findAll(user: AuthUser, status?: TaskStatus): Task[] {
    return [...this.tasks.values()]
      .filter((task) => canAccess(user, task))
      .filter((task) => !status || task.status === status)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  findOne(user: AuthUser, id: string): Task {
    const task = this.tasks.get(id);
    if (!task) {
      throw new NotFoundException(`task ${id} not found`);
    }
    if (!canAccess(user, task)) {
      throw new ForbiddenException('not your task');
    }
    return task;
  }

  create(user: AuthUser, dto: CreateTaskDto): Task {
    const now = new Date();
    const task: Task = {
      id: randomUUID(),
      title: dto.title,
      description: dto.description,
      dueDate: dto.dueDate,
      status: 'todo',
      priority: dto.priority ?? 'medium',
      ownerId: user.id,
      createdAt: now,
      updatedAt: now,
    };
    this.tasks.set(task.id, task);
    return task;
  }

  update(user: AuthUser, id: string, dto: UpdateTaskDto): Task {
    const task = this.findOne(user, id);
    if (dto.status && dto.status !== task.status) {
      assertTransition(task.status, dto.status);
    }
    Object.assign(task, dto, { updatedAt: new Date() });
    return task;
  }

  remove(user: AuthUser, id: string): void {
    const task = this.findOne(user, id);
    this.tasks.delete(task.id);
  }
}

function canAccess(user: AuthUser, task: Task): boolean {
  return task.ownerId === user.id || user.roles.includes('admin');
}

function assertTransition(from: TaskStatus, to: TaskStatus): void {
  if (!STATUS_TRANSITIONS[from].includes(to)) {
    throw new BadRequestException(`cannot move a task from ${from} to ${to}`);
  }
}
