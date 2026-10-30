import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseEnumPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user';
import { CurrentUser } from '../auth/decorators';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TASK_STATUSES } from './task.entity';
import type { Task, TaskStatus } from './task.entity';
import { TasksService } from './tasks.service';

const STATUS_ENUM = Object.fromEntries(TASK_STATUSES.map((s) => [s, s]));

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('status', new ParseEnumPipe(STATUS_ENUM, { optional: true }))
    status?: TaskStatus,
  ): Task[] {
    return this.tasks.findAll(user, status);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Task {
    return this.tasks.findOne(user, id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateTaskDto): Task {
    return this.tasks.create(user, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaskDto,
  ): Task {
    return this.tasks.update(user, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): void {
    this.tasks.remove(user, id);
  }
}
