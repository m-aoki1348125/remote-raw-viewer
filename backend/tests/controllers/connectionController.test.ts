import request from 'supertest';
import app from '../../src/index';

describe('Connection Controller', () => {
  
  describe('GET /api/connections', () => {
    test('should return empty array when no connections exist', async () => {
      const response = await request(app)
        .get('/api/connections')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: []
      });
    });
  });

  describe('POST /api/connections', () => {
    test('should create a new connection with valid data', async () => {
      const connectionData = {
        name: 'Test Server',
        host: '192.168.1.100',
        port: 22,
        username: 'testuser',
        password: 'testpass',
        authMethod: 'password'
      };

      const response = await request(app)
        .post('/api/connections')
        .send(connectionData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        name: 'Test Server',
        host: '192.168.1.100',
        port: 22,
        username: 'testuser',
        isConnected: false
      });
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.password).toBeUndefined(); // Password should not be returned
    });

    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/connections')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Missing required fields');
    });

    test('should reject duplicate connection names', async () => {
      const connectionData = {
        name: 'Duplicate Server',
        host: '192.168.1.100',
        port: 22,
        username: 'testuser',
        password: 'testpass',
        authMethod: 'password'
      };

      // Create first connection
      await request(app)
        .post('/api/connections')
        .send(connectionData)
        .expect(201);

      // Try to create duplicate
      const response = await request(app)
        .post('/api/connections')
        .send(connectionData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('already exists');
    });
  });

  describe('PUT /api/connections/:id', () => {
    test('should update existing connection', async () => {
      // First create a connection
      const createResponse = await request(app)
        .post('/api/connections')
        .send({
          name: 'Original Server',
          host: '192.168.1.100',
          port: 22,
          username: 'testuser',
          password: 'testpass',
          authMethod: 'password'
        });

      const connectionId = createResponse.body.data.id;

      // Update the connection
      const updateData = {
        name: 'Updated Server',
        host: '192.168.1.101',
        port: 2222,
        username: 'admin',
        password: 'newpass',
        authMethod: 'password'
      };

      const response = await request(app)
        .put(`/api/connections/${connectionId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: connectionId,
        name: 'Updated Server',
        host: '192.168.1.101',
        port: 2222,
        username: 'admin'
      });
    });

    test('should return 404 for non-existent connection', async () => {
      const response = await request(app)
        .put('/api/connections/non-existent-id')
        .send({
          name: 'Test',
          host: '192.168.1.100',
          port: 22,
          username: 'test',
          password: 'test',
          authMethod: 'password'
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });
  });

  describe('DELETE /api/connections/:id', () => {
    test('should delete existing connection', async () => {
      // First create a connection
      const createResponse = await request(app)
        .post('/api/connections')
        .send({
          name: 'To Delete',
          host: '192.168.1.100',
          port: 22,
          username: 'testuser',
          password: 'testpass',
          authMethod: 'password'
        });

      const connectionId = createResponse.body.data.id;

      // Delete the connection
      const response = await request(app)
        .delete(`/api/connections/${connectionId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted');

      // Verify it's deleted
      await request(app)
        .get(`/api/connections/${connectionId}`)
        .expect(404);
    });

    test('should return 404 for non-existent connection', async () => {
      const response = await request(app)
        .delete('/api/connections/non-existent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });
  });

  describe('POST /api/connections/:id/test', () => {
    test('should test connection and return result', async () => {
      // First create a connection
      const createResponse = await request(app)
        .post('/api/connections')
        .send({
          name: 'Test Connection',
          host: '127.0.0.1', // localhost for testing
          port: 22,
          username: 'testuser',
          password: 'testpass',
          authMethod: 'password'
        });

      const connectionId = createResponse.body.data.id;

      // Test the connection (will likely fail in test environment)
      const response = await request(app)
        .post(`/api/connections/${connectionId}/test`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        success: expect.any(Boolean),
        message: expect.any(String)
      });
      expect(typeof response.body.data.latency).toBe('number');
    });

    test('should handle connection test failure', async () => {
      // First create a connection with invalid host
      const createResponse = await request(app)
        .post('/api/connections')
        .send({
          name: 'Invalid Connection',
          host: 'invalid-host-12345',
          port: 22,
          username: 'testuser',
          password: 'testpass',
          authMethod: 'password'
        });

      const connectionId = createResponse.body.data.id;

      // Test the connection (should fail)
      const response = await request(app)
        .post(`/api/connections/${connectionId}/test`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.success).toBe(false);
      expect(response.body.data.message).toContain('failed');
    }, 15000);
  });

  describe('POST /api/connections/:id/connect', () => {
    test('should attempt SSH connection', async () => {
      // First create a connection
      const createResponse = await request(app)
        .post('/api/connections')
        .send({
          name: 'Connect Test',
          host: '127.0.0.1',
          port: 22,
          username: 'testuser',
          password: 'testpass',
          authMethod: 'password'
        });

      const connectionId = createResponse.body.data.id;

      // Connect (will fail in test environment but should return 500 with error)
      const response = await request(app)
        .post(`/api/connections/${connectionId}/connect`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Internal server error');
    }, 15000);
  });

  describe('POST /api/connections/:id/disconnect', () => {
    test('should disconnect SSH connection', async () => {
      // First create connection
      const createResponse = await request(app)
        .post('/api/connections')
        .send({
          name: 'Disconnect Test',
          host: '127.0.0.1',
          port: 22,
          username: 'testuser',
          password: 'testpass',
          authMethod: 'password'
        });

      const connectionId = createResponse.body.data.id;

      // Disconnect (should work even if not connected)
      const response = await request(app)
        .post(`/api/connections/${connectionId}/disconnect`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isConnected).toBe(false);
    });
  });
});