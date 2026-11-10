import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';

describe('API Health and Routing Tests', () => {
  it('GET /api/health should return 200 OK with service status', async () => {
    const res = await request(app).get('/api/health');

    assert.equal(res.status, 200);
    assert.equal(res.headers['content-type'].includes('application/json'), true);
    assert.equal(res.body.status, 'ok');
    assert.ok(res.body.timestamp);
    assert.ok(res.body.services);
    assert.ok('supabase' in res.body.services);
    assert.ok('mongodb_gridfs' in res.body.services);
  });

  it('GET /api should return API metadata', async () => {
    const res = await request(app).get('/api');

    assert.equal(res.status, 200);
    assert.equal(res.body.name, 'UEM Admission Management System API');
    assert.equal(res.body.version, '0.1.0');
  });

  it('GET /api/unknown-endpoint should return 404 with standard error format', async () => {
    const res = await request(app).get('/api/unknown-endpoint-404');

    assert.equal(res.status, 404);
    assert.ok(res.body.error);
    assert.equal(res.body.error.code, 'NOT_FOUND');
    assert.ok(res.body.error.message.includes('not found'));
  });

  it('Security headers should be present via Helmet', async () => {
    const res = await request(app).get('/api/health');

    assert.ok(res.headers['x-dns-prefetch-control']);
    assert.ok(res.headers['x-content-type-options']);
  });
});
