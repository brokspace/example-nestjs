import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { AuthUser } from '../auth/auth-user';
import { TasksService } from './tasks.service';

const alice: AuthUser = {
  id: 'alice',
  email: 'alice@example.com',
  roles: ['admin'],
};
const bob: AuthUser = {
  id: 'bob',
  email: 'bob@example.com',
  roles: ['member'],
};
const carol: AuthUser = {
  id: 'carol',
  email: 'carol@example.com',
  roles: ['member'],
};

describe('TasksService', () => {
  let tasks: TasksService;

  beforeEach(() => {
    tasks = new TasksService();
  });

  it('creates tasks as todo, owned by the caller', () => {
    const task = tasks.create(bob, { title: 'Write the docs' });
    expect(task.status).toBe('todo');
    expect(task.ownerId).toBe('bob');
  });

  it('members only see their own tasks; admins see all', () => {
    tasks.create(bob, { title: 'bob task' });
    tasks.create(carol, { title: 'carol task' });

    expect(tasks.findAll(bob).map((t) => t.title)).toEqual(['bob task']);
    expect(tasks.findAll(alice)).toHaveLength(2);
  });

  it('forbids changing someone else task', () => {
    const task = tasks.create(bob, { title: 'bob task' });
    expect(() => tasks.update(carol, task.id, { title: 'mine now' })).toThrow(
      ForbiddenException,
    );
  });

  it('filters by status', () => {
    const task = tasks.create(bob, { title: 'a' });
    tasks.create(bob, { title: 'b' });
    tasks.update(bob, task.id, { status: 'in_progress' });

    expect(tasks.findAll(bob, 'in_progress').map((t) => t.title)).toEqual([
      'a',
    ]);
  });

  it('rejects moving a done task back to todo', () => {
    const task = tasks.create(bob, { title: 'ship it' });
    tasks.update(bob, task.id, { status: 'done' });
    expect(() => tasks.update(bob, task.id, { status: 'todo' })).toThrow(
      BadRequestException,
    );
    expect(tasks.update(bob, task.id, { status: 'in_progress' }).status).toBe(
      'in_progress',
    );
  });
});
