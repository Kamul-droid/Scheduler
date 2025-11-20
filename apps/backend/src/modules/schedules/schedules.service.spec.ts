import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { HasuraClientService } from '../../common/services/hasura-client.service';
import { ScheduleStatus } from '../../common/types/schedule-status.enum';
import { ConflictDetectionService } from './conflict-detection.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { SchedulesService } from './schedules.service';
import { ValidationService } from './validation.service';

describe('SchedulesService', () => {
  let service: SchedulesService;
  let hasuraClient: jest.Mocked<HasuraClientService>;
  let conflictDetection: jest.Mocked<ConflictDetectionService>;
  let validation: jest.Mocked<ValidationService>;

  const mockHasuraClient = {
    execute: jest.fn(),
    checkHealth: jest.fn(),
  };

  const mockConflictDetection = {
    detectConflicts: jest.fn(),
    schedulesOverlap: jest.fn(),
  };

  const mockValidation = {
    validateSchedule: jest.fn(),
    validateConstraint: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulesService,
        {
          provide: HasuraClientService,
          useValue: mockHasuraClient,
        },
        {
          provide: ConflictDetectionService,
          useValue: mockConflictDetection,
        },
        {
          provide: ValidationService,
          useValue: mockValidation,
        },
      ],
    }).compile();

    service = module.get<SchedulesService>(SchedulesService);
    hasuraClient = module.get(HasuraClientService);
    conflictDetection = module.get(ConflictDetectionService);
    validation = module.get(ValidationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a schedule when no conflicts', async () => {
      const createDto: CreateScheduleDto = {
        employeeId: 'emp-1',
        shiftId: 'shift-1',
        startTime: '2024-01-01T09:00:00Z',
        endTime: '2024-01-01T17:00:00Z',
      };

      mockValidation.validateSchedule.mockResolvedValue(undefined);
      mockConflictDetection.detectConflicts.mockResolvedValue([]);

      const mockCreated = {
        id: 'sched-1',
        employee_id: 'emp-1',
        shift_id: 'shift-1',
        start_time: '2024-01-01T09:00:00Z',
        end_time: '2024-01-01T17:00:00Z',
        status: ScheduleStatus.CONFIRMED,
        metadata: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      hasuraClient.execute.mockResolvedValue({
        insert_schedules_one: mockCreated,
      });

      const result = await service.create(createDto);

      expect(result.id).toBe('sched-1');
      expect(result.status).toBe(ScheduleStatus.CONFIRMED);
      expect(mockValidation.validateSchedule).toHaveBeenCalled();
      expect(mockConflictDetection.detectConflicts).toHaveBeenCalled();
    });

    it('should throw ConflictException when conflicts detected', async () => {
      const createDto: CreateScheduleDto = {
        employeeId: 'emp-1',
        shiftId: 'shift-1',
        startTime: '2024-01-01T09:00:00Z',
        endTime: '2024-01-01T17:00:00Z',
      };

      mockValidation.validateSchedule.mockResolvedValue(undefined);
      mockConflictDetection.detectConflicts.mockResolvedValue([
        {
          scheduleId: 'emp-1',
          conflictingScheduleId: 'sched-2',
          message: 'Overlapping schedule',
          severity: 'error',
        },
      ]);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all schedules', async () => {
      const mockSchedules = [
        {
          id: 'sched-1',
          employee_id: 'emp-1',
          shift_id: 'shift-1',
          start_time: '2024-01-01T09:00:00Z',
          end_time: '2024-01-01T17:00:00Z',
          status: ScheduleStatus.CONFIRMED,
          metadata: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      hasuraClient.execute.mockResolvedValue({
        schedules: mockSchedules,
      });

      const result = await service.findAll();

        expect(result).toHaveLength(1);
      expect(result[0].id).toBe('sched-1');
    });
  });

  describe('findOne', () => {
    it('should return a single schedule', async () => {
      const mockSchedule = {
        id: 'sched-1',
        employee_id: 'emp-1',
        shift_id: 'shift-1',
        start_time: '2024-01-01T09:00:00Z',
        end_time: '2024-01-01T17:00:00Z',
        status: ScheduleStatus.CONFIRMED,
        metadata: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      hasuraClient.execute.mockResolvedValue({
        schedules_by_pk: mockSchedule,
      });

      const result = await service.findOne('sched-1');

      expect(result.id).toBe('sched-1');
    });

    it('should throw NotFoundException when schedule not found', async () => {
      hasuraClient.execute.mockResolvedValue({
        schedules_by_pk: null,
      });

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });
});

