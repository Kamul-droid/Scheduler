import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ConstraintsService } from './constraints.service';
import { HasuraClientService } from '../../common/services/hasura-client.service';
import { RuleEngineService } from './rule-engine.service';
import { CreateConstraintDto } from './dto/create-constraint.dto';
import { ConstraintType } from '../../common/types/constraint-type.enum';

describe('ConstraintsService', () => {
  let service: ConstraintsService;
  let hasuraClient: jest.Mocked<HasuraClientService>;
  let ruleEngine: jest.Mocked<RuleEngineService>;

  const mockHasuraClient = {
    execute: jest.fn(),
    checkHealth: jest.fn(),
  };

  const mockRuleEngine = {
    validateRuleStructure: jest.fn(),
    evaluateRule: jest.fn(),
    applyConstraints: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConstraintsService,
        {
          provide: HasuraClientService,
          useValue: mockHasuraClient,
        },
        {
          provide: RuleEngineService,
          useValue: mockRuleEngine,
        },
      ],
    }).compile();

    service = module.get<ConstraintsService>(ConstraintsService);
    hasuraClient = module.get(HasuraClientService);
    ruleEngine = module.get(RuleEngineService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a constraint with valid rules', async () => {
      const createDto: CreateConstraintDto = {
        type: ConstraintType.MAX_HOURS,
        rules: { maxHours: 40, periodInDays: 7 },
        priority: 1,
        active: true,
      };

      mockRuleEngine.validateRuleStructure.mockReturnValue(undefined);

      const mockCreated = {
        id: 'constraint-1',
        type: ConstraintType.MAX_HOURS,
        rules: { maxHours: 40, periodInDays: 7 },
        priority: 1,
        active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      hasuraClient.execute.mockResolvedValue({
        insert_constraints_one: mockCreated,
      });

      const result = await service.create(createDto);

      expect(result.type).toBe(ConstraintType.MAX_HOURS);
      expect(mockRuleEngine.validateRuleStructure).toHaveBeenCalled();
    });

    it('should throw BadRequestException when rules are invalid', async () => {
      const createDto: CreateConstraintDto = {
        type: ConstraintType.MAX_HOURS,
        rules: { maxHours: -1 }, // Invalid
        priority: 1,
      };

      mockRuleEngine.validateRuleStructure.mockImplementation(() => {
        throw new BadRequestException('Invalid rules');
      });

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getActiveConstraints', () => {
    it('should return only active constraints', async () => {
      const mockConstraints = [
        {
          id: 'constraint-1',
          type: ConstraintType.MAX_HOURS,
          rules: { maxHours: 40 },
          priority: 1,
          active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      hasuraClient.execute.mockResolvedValue({
        constraints: mockConstraints,
      });

      const result = await service.getActiveConstraints();

      expect(result).toHaveLength(1);
      expect(result[0].active).toBe(true);
    });
  });
});

