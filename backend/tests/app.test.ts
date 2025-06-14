import request from 'supertest';
import app from '../src/index';

describe('Backend Server', () => {
  test('GET /health should return server status', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body).toEqual({
      status: 'OK',
      message: 'Backend server is running'
    });
  });

  test('GET /api/connections should return empty array initially', async () => {
    const response = await request(app)
      .get('/api/connections')
      .expect(200);

    expect(response.body).toEqual({
      success: true,
      data: []
    });
  });
});