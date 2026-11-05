import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { clearTestDatabase, testPrisma } from '../fixtures/test-db';

describe('Authentication Module Integration Tests', () => {
  const app = createApp();

  beforeEach(async () => {
    await clearTestDatabase();
  });

  afterAll(async () => {
    await clearTestDatabase();
    await testPrisma.$disconnect();
  });

  it('should successfully register a new user with Argon2id hashed password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123!'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('john@example.com');
    expect(res.body.data.user.passwordHash).toBeUndefined(); // Never exposed!
    expect(res.body.data.tokens.accessToken).toBeDefined();
    expect(res.body.data.tokens.refreshToken).toBeDefined();

    // Verify DB record
    const userInDb = await testPrisma.user.findUnique({
      where: { email: 'john@example.com' }
    });
    expect(userInDb).not.toBeNull();
    expect(userInDb!.passwordHash).toContain('$argon2id$');
  });

  it('should reject registration with duplicate email (409 Conflict)', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'User One',
        email: 'duplicate@example.com',
        password: 'Password123!'
      });

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'User Two',
        email: 'duplicate@example.com',
        password: 'Password123!'
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('should successfully authenticate with valid credentials', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Alice Smith',
        email: 'alice@example.com',
        password: 'Password123!'
      });

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'alice@example.com',
        password: 'Password123!'
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.data.tokens.accessToken).toBeDefined();
    expect(loginRes.headers['set-cookie']).toBeDefined();
  });

  it('should reject login with invalid password (401 Unauthenticated)', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Bob Johnson',
        email: 'bob@example.com',
        password: 'Password123!'
      });

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'bob@example.com',
        password: 'WrongPassword999!'
      });

    expect(loginRes.status).toBe(401);
    expect(loginRes.body.success).toBe(false);
  });

  it('should rotate refresh token and issue new access token', async () => {
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Charlie Brown',
        email: 'charlie@example.com',
        password: 'Password123!'
      });

    const rawRefreshToken = regRes.body.data.tokens.refreshToken;

    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: rawRefreshToken });

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.success).toBe(true);
    expect(refreshRes.body.data.tokens.accessToken).toBeDefined();
    expect(refreshRes.body.data.tokens.refreshToken).toBeDefined();
    expect(refreshRes.body.data.tokens.refreshToken).not.toBe(rawRefreshToken); // Rotated!
  });

  it('should revoke entire token family if a revoked refresh token is reused', async () => {
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'David Miller',
        email: 'david@example.com',
        password: 'Password123!'
      });

    const tokenV1 = regRes.body.data.tokens.refreshToken;

    // Use tokenV1 once (rotates to tokenV2)
    const refreshRes1 = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: tokenV1 });
    expect(refreshRes1.status).toBe(200);

    // Reuse old tokenV1 (attack scenario)
    const attackRes = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: tokenV1 });

    expect(attackRes.status).toBe(403);
    expect(attackRes.body.message).toContain('compromise');
  });

  it('should list and revoke active user sessions', async () => {
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Eve Wilson',
        email: 'eve@example.com',
        password: 'Password123!'
      });

    const token = regRes.body.data.tokens.accessToken;

    const sessionsRes = await request(app)
      .get('/api/v1/auth/sessions')
      .set('Authorization', `Bearer ${token}`);

    expect(sessionsRes.status).toBe(200);
    expect(sessionsRes.body.data.length).toBeGreaterThanOrEqual(1);

    const sessionId = sessionsRes.body.data[0].id;

    // Revoke session
    const revokeRes = await request(app)
      .delete(`/api/v1/auth/sessions/${sessionId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(revokeRes.status).toBe(200);
  });
});
