import { Test, TestingModule } from '@nestjs/testing';
import { HasuraClientService } from '../../common/services/hasura-client.service';
import { OptimizationRequestDto } from './dto/optimization-request.dto';
import { OptimizationClient } from './optimization-client.service';
import { OptimizationOrchestrator } from './optimization-orchestrator.service';

describe('OptimizationOrchestrator', () => {
  let orchestrator: OptimizationOrchestrator;
  let optimizationClient: jest.Mocked<OptimizationClient>;
  let hasuraClient: jest.Mocked<HasuraClientService>;

  const mockOptimizationClient = {
    requestOptimization: jest.fn(),
    checkHealth: jest.fn(),
  };

  const mockHasuraClient = {
    execute: jest.fn(),
    checkHealth: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OptimizationOrchestrator,
        {
          provide: OptimizationClient,
          useValue: mockOptimizationClient,
        },
        {
          provide: HasuraClientService,
          useValue: mockHasuraClient,
        },
      ],
    }).compile();

    orchestrator = module.get<OptimizationOrchestrator>(
      OptimizationOrchestrator,
    );
    optimizationClient = module.get(OptimizationClient);
    hasuraClient = module.get(HasuraClientService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('optimize', () => {
    it('should orchestrate optimization successfully', async () => {
      const request: OptimizationRequestDto = {
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-01-31T23:59:59Z',
        options: {
          objective: 'balance',
          solutionCount: 2,
        },
      };

      // Mock data collection - order: employees -> shifts -> constraints -> schedules
      mockHasuraClient.execute
        .mockResolvedValueOnce({ employees: [] }) // All employees query
        .mockResolvedValueOnce({ shifts: [] }) // Shifts query
        .mockResolvedValueOnce({ constraints: [] }) // Constraints query
        .mockResolvedValueOnce({ schedules: [] }); // Schedules query

      // Mock optimization response
      mockOptimizationClient.requestOptimization.mockResolvedValue({
        optimizationId: 'opt-123',
        status: 'completed',
        solutions: [
          {
            id: 'solution-1',
            score: 100,
            assignments: [],
            metrics: {},
            solveTime: 1000,
          },
        ],
        totalSolveTime: 1000,
        message: 'Success',
      });

      const result = await orchestrator.optimize(request);

      expect(result.status).toBe('completed');
      expect(result.solutions).toHaveLength(1);
      expect(mockOptimizationClient.requestOptimization).toHaveBeenCalled();
    });

    it('should handle optimization failure', async () => {
      const request: OptimizationRequestDto = {
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-01-31T23:59:59Z',
      };

      // Mock data collection - order: employees -> shifts -> constraints -> schedules
      mockHasuraClient.execute
        .mockResolvedValueOnce({ employees: [] }) // All employees query
        .mockResolvedValueOnce({ shifts: [] }) // Shifts query
        .mockResolvedValueOnce({ constraints: [] }) // Constraints query
        .mockResolvedValueOnce({ schedules: [] }); // Schedules query

      mockOptimizationClient.requestOptimization.mockRejectedValue(
        new Error('Optimization failed'),
      );

      const result = await orchestrator.optimize(request);

      expect(result.status).toBe('failed');
      expect(result.solutions).toHaveLength(0);
    });
  });

  describe('getStatus', () => {
    it('should return optimization status', async () => {
      const request: OptimizationRequestDto = {
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-01-31T23:59:59Z',
      };

      // Mock all Hasura queries needed by collectCurrentState
      // Order in collectCurrentState: employees -> shifts -> constraints -> schedules
      mockHasuraClient.execute
        .mockResolvedValueOnce({ employees: [] }) // All employees query (no employeeIds in request)
        .mockResolvedValueOnce({ shifts: [] }) // Shifts query
        .mockResolvedValueOnce({ constraints: [] }) // Constraints query
        .mockResolvedValueOnce({ schedules: [] }); // Schedules query

      // Mock optimization response
      mockOptimizationClient.requestOptimization.mockResolvedValue({
        optimizationId: 'opt-123',
        status: 'completed',
        solutions: [],
        totalSolveTime: 1000,
        message: 'Success',
      });

      // Store a result first
      const result = await orchestrator.optimize(request);
      const optimizationId = result.optimizationId;

      // Get status (will use the stored result)
      const status = await orchestrator.getStatus(optimizationId);
      
      // Status should be defined
      expect(status).toBeDefined();
      expect(status?.optimizationId).toBe(optimizationId);
    });
  });
});

