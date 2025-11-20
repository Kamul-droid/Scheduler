import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { OptimizationService } from '../../src/modules/optimization/optimization.service';

describe('Optimization Integration (e2e)', () => {
  let app: INestApplication;
  let optimizationService: OptimizationService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    optimizationService = moduleFixture.get<OptimizationService>(
      OptimizationService,
    );
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /optimization', () => {
    it('should call optimization service', async () => {
      const optimizationRequest = {
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-01-31T23:59:59Z',
        options: {
          objective: 'balance',
          solutionCount: 1,
          maxOptimizationTime: 5,
        },
      };

      // Mock the optimization service response
      jest
        .spyOn(optimizationService, 'optimizeSchedule')
        .mockResolvedValue({
          optimizationId: 'test-opt-1',
          status: 'completed' as any,
          solutions: [],
          totalSolveTime: 1000,
          message: 'Test optimization',
        });

      const response = await request(app.getHttpServer())
        .post('/optimization')
        .send(optimizationRequest)
        .expect(200);

      expect(response.body).toHaveProperty('optimizationId');
      expect(response.body).toHaveProperty('status');
    });
  });
});

