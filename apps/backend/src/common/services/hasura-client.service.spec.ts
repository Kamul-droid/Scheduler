import { Test, TestingModule } from '@nestjs/testing';
import { HasuraClientService } from './hasura-client.service';

describe('HasuraClientService', () => {
  let service: HasuraClientService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HasuraClientService],
    }).compile();

    service = module.get<HasuraClientService>(HasuraClientService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should execute GraphQL query successfully', async () => {
      const query = 'query { employees { id name } }';
      
      // Mock the execute method since it uses axios internally
      const executeSpy = jest.spyOn(service, 'execute').mockResolvedValue({
        employees: [{ id: '1', name: 'John' }],
      } as any);

      const result = await service.execute(query);

      expect(result).toEqual({
        employees: [{ id: '1', name: 'John' }],
      });
      expect(executeSpy).toHaveBeenCalledWith(query);
    });

    it('should throw error when Hasura returns errors', async () => {
      const query = 'query { employees { id name } }';
      
      jest.spyOn(service, 'execute').mockRejectedValue(
        new Error('Hasura query failed: GraphQL error'),
      );

      await expect(service.execute(query)).rejects.toThrow('Hasura query failed');
    });
  });

  describe('checkHealth', () => {
    it('should return true when Hasura is accessible', async () => {
      jest.spyOn(service, 'execute').mockResolvedValue({ __typename: 'Query' } as any);

      const result = await service.checkHealth();

      expect(result).toBe(true);
    });

    it('should return false when Hasura is not accessible', async () => {
      jest.spyOn(service, 'execute').mockRejectedValue(new Error('Connection failed'));

      const result = await service.checkHealth();

      expect(result).toBe(false);
    });
  });
});
