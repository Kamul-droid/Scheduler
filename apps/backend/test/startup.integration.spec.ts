/**
 * Startup Integration Tests
 * These tests validate that the application can start correctly
 * and all critical modules are properly configured
 */

import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';

describe('Startup Integration Tests', () => {
  let app: TestingModule;

  beforeAll(async () => {
    try {
      app = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();
    } catch (error) {
      console.error('Failed to create testing module:', error);
      throw error;
    }
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('should create the application module', () => {
    expect(app).toBeDefined();
  });

  it('should have AppModule loaded', () => {
    const appModule = app.get(AppModule);
    expect(appModule).toBeDefined();
  });

  it('should have all critical modules available', () => {
    // This test ensures that all modules can be instantiated
    // If there's a circular dependency or missing module, this will fail
    expect(app).toBeDefined();
  });
});

