import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { configureApp } from './../src/main';

describe('Tasks API (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  async function login(email: string): Promise<string> {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'password123' })
      .expect(200);
    return (res.body as { accessToken: string }).accessToken;
  }

  it('GET /health is public', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ status: 'ok' });
  });

  it('GET /tasks needs a token', () => {
    return request(app.getHttpServer()).get('/tasks').expect(401);
  });

  it('creates, lists and completes a task', async () => {
    const token = await login('bob@example.com');
    const server = app.getHttpServer();

    const created = await request(server)
      .post('/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Try brok search' })
      .expect(201);
    const id = (created.body as { id: string }).id;

    await request(server)
      .patch(`/tasks/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'done' })
      .expect(200);

    const list = await request(server)
      .get('/tasks?status=done')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(list.body).toHaveLength(1);
  });

  it('rejects unknown fields', async () => {
    const token = await login('bob@example.com');
    await request(app.getHttpServer())
      .post('/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'x', ownerId: 'someone-else' })
      .expect(400);
  });
});
