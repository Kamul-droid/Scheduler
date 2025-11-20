import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { HasuraClientService } from '../../common/services/hasura-client.service';
import { ConstraintType } from '../../common/types/constraint-type.enum';
import { CreateScheduleDto } from '../schedules/dto/create-schedule.dto';
import { RuleEngineService } from './rule-engine.service';

describe('RuleEngineService', () => {
  let service: RuleEngineService;
  let hasuraClient: jest.Mocked<HasuraClientService>;

  const mockHasuraClient = {
    execute: jest.fn(),
    checkHealth: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RuleEngineService,
        {
          provide: HasuraClientService,
          useValue: mockHasuraClient,
        },
      ],
    }).compile();

    service = module.get<RuleEngineService>(RuleEngineService);
    hasuraClient = module.get(HasuraClientService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateRuleStructure', () => {
    it('should validate max_hours constraint rules', () => {
      const rules = { maxHours: 40, periodInDays: 7 };

      expect(() => {
        service.validateRuleStructure(rules, ConstraintType.MAX_HOURS);
      }).not.toThrow();
    });

    it('should throw error for invalid max_hours rules', () => {
      const rules = { maxHours: -1 };

      expect(() => {
        service.validateRuleStructure(rules, ConstraintType.MAX_HOURS);
      }).toThrow(BadRequestException);
    });

    it('should validate min_rest constraint rules', () => {
      const rules = { minRestHours: 8.0 };

      expect(() => {
        service.validateRuleStructure(rules, ConstraintType.MIN_REST);
      }).not.toThrow();
    });

    it('should validate skill_requirement constraint rules', () => {
      const rules = { requiredSkills: ['nursing', 'cpr'] };

      expect(() => {
        service.validateRuleStructure(
          rules,
          ConstraintType.SKILL_REQUIREMENT,
        );
      }).not.toThrow();
    });
  });

  describe('evaluateRule', () => {
    it('should evaluate constraint rules', async () => {
      const schedule: CreateScheduleDto = {
        employeeId: 'emp-1',
        shiftId: 'shift-1',
        startTime: '2024-01-01T09:00:00Z',
        endTime: '2024-01-01T17:00:00Z',
      };

      const constraint = {
        id: 'constraint-1',
        type: ConstraintType.MAX_HOURS,
        rules: { maxHours: 40, periodInDays: 7 },
        priority: 1,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock queries for constraint evaluation
      hasuraClient.execute.mockResolvedValue({
        schedules: [],
      });

      const result = await service.evaluateRule(constraint, schedule);

      expect(typeof result).toBe('boolean');
    });
  });
});

