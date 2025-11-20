import { Test, TestingModule } from '@nestjs/testing';
import axios from 'axios';
import { OptimizationClient } from './optimization-client.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('OptimizationClient', () => {
  let service: OptimizationClient;
  let axiosInstance: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OptimizationClient],
    }).compile();

    service = module.get<OptimizationClient>(OptimizationClient);
    
    // Mock axios instance
    axiosInstance = {
      post: jest.fn(),
      get: jest.fn(),
    };
    
    (axios.create as jest.Mock).mockReturnValue(axiosInstance);
    
    // Re-instantiate to use mocked axios
    const newService = new OptimizationClient();
    Object.assign(service, newService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('requestOptimization', () => {
    it('should send optimization request and return response', async () => {
      const optimizationData = {
        employees: [],
        shifts: [],
        constraints: [],
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-01-31T23:59:59Z',
      };

      const mockResponse = {
        data: {
          optimizationId: 'opt-123',
          status: 'completed',
          solutions: [],
          totalSolveTime: 1000,
        },
      };

      axiosInstance.post.mockResolvedValue(mockResponse);

      const result = await service.requestOptimization(optimizationData);

      expect(result).toEqual(mockResponse.data);
      expect(axiosInstance.post).toHaveBeenCalledWith('/optimize', optimizationData);
    });

    it('should throw error when optimization fails', async () => {
      const optimizationData = {
        employees: [],
        shifts: [],
        constraints: [],
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-01-31T23:59:59Z',
      };

      axiosInstance.post.mockRejectedValue(new Error('Network error'));

      await expect(
        service.requestOptimization(optimizationData),
      ).rejects.toThrow('Failed to get optimization solution');
    });
  });

  describe('checkHealth', () => {
    it('should return true when service is healthy', async () => {
      axiosInstance.get.mockResolvedValue({ status: 200 });

      const result = await service.checkHealth();

      expect(result).toBe(true);
      expect(axiosInstance.get).toHaveBeenCalledWith('/health');
    });

    it('should return false when service is unavailable', async () => {
      axiosInstance.get.mockRejectedValue(new Error('Connection failed'));

      const result = await service.checkHealth();

      expect(result).toBe(false);
    });
  });
});

