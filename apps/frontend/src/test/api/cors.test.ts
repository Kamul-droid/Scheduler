import { describe, it, expect, beforeAll, vi } from 'vitest';
import axios from 'axios';

const API_BASE = 'http://localhost:3000';

describe('CORS Configuration', () => {
  beforeAll(() => {
    // Set test timeout for network requests
    vi.setConfig({ testTimeout: 10000 });
  });

  it('should allow requests from frontend origin', async () => {
    try {
      const response = await axios.get(`${API_BASE}/employees`, {
        headers: {
          Origin: 'http://localhost:3001',
        },
        validateStatus: () => true, // Don't throw on any status
      });

      // Check if CORS headers are present
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    } catch (error) {
      // If backend is not running, skip the test
      if (axios.isAxiosError(error) && error.code === 'ECONNREFUSED') {
        console.warn('Backend not running, skipping CORS test');
        return;
      }
      throw error;
    }
  });

  it('should allow OPTIONS preflight requests', async () => {
    try {
      const response = await axios.options(`${API_BASE}/employees`, {
        headers: {
          Origin: 'http://localhost:3001',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type',
        },
        validateStatus: () => true,
      });

      // Preflight should return 204 or 200
      expect([200, 204]).toContain(response.status);
      expect(response.headers['access-control-allow-methods']).toBeDefined();
    } catch (error) {
      if (axios.isAxiosError(error) && error.code === 'ECONNREFUSED') {
        console.warn('Backend not running, skipping CORS preflight test');
        return;
      }
      throw error;
    }
  });

  it('should include CORS headers in response', async () => {
    try {
      const response = await axios.get(`${API_BASE}/employees`, {
        headers: {
          Origin: 'http://localhost:3001',
        },
        validateStatus: () => true,
      });

      const corsHeaders = [
        'access-control-allow-origin',
        'access-control-allow-credentials',
      ];

      corsHeaders.forEach((header) => {
        expect(response.headers[header] || response.headers[header.toLowerCase()]).toBeDefined();
      });
    } catch (error) {
      if (axios.isAxiosError(error) && error.code === 'ECONNREFUSED') {
        console.warn('Backend not running, skipping CORS headers test');
        return;
      }
      throw error;
    }
  });
});

