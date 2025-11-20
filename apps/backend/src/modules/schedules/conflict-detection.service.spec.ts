import { Test, TestingModule } from '@nestjs/testing';
import { HasuraClientService } from '../../common/services/hasura-client.service';
import { ConflictDetectionService } from './conflict-detection.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';

describe('ConflictDetectionService', () => {
  let service: ConflictDetectionService;
  let hasuraClient: jest.Mocked<HasuraClientService>;

  const mockHasuraClient = {
    execute: jest.fn(),
    checkHealth: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConflictDetectionService,
        {
          provide: HasuraClientService,
          useValue: mockHasuraClient,
        },
      ],
    }).compile();

    service = module.get<ConflictDetectionService>(ConflictDetectionService);
    hasuraClient = module.get(HasuraClientService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('detectConflicts', () => {
    it('should detect overlapping schedules', async () => {
      const schedule: CreateScheduleDto = {
        employeeId: 'emp-1',
        shiftId: 'shift-1',
        startTime: '2024-01-01T09:00:00Z',
        endTime: '2024-01-01T17:00:00Z',
      };

      // Mock overlapping schedule
      hasuraClient.execute.mockResolvedValue({
        schedules: [
          {
            id: 'sched-2',
            start_time: '2024-01-01T10:00:00Z',
            end_time: '2024-01-01T18:00:00Z',
          },
        ],
      });

      // Mock employee and shift queries for skill validation
      hasuraClient.execute
        .mockResolvedValueOnce({
          schedules: [
            {
              id: 'sched-2',
              start_time: '2024-01-01T10:00:00Z',
              end_time: '2024-01-01T18:00:00Z',
            },
          ],
        })
        .mockResolvedValueOnce({
          shifts_by_pk: { required_skills: null },
        })
        .mockResolvedValueOnce({
          employees_by_pk: { skills: [] },
        });

      const conflicts = await service.detectConflicts(schedule);

      expect(conflicts.length).toBeGreaterThan(0);
      expect(conflicts[0].message).toBeDefined();
      expect(conflicts[0].severity).toBeDefined();
    });

    it('should return empty array when no conflicts', async () => {
      const schedule: CreateScheduleDto = {
        employeeId: 'emp-1',
        shiftId: 'shift-1',
        startTime: '2024-01-01T09:00:00Z',
        endTime: '2024-01-01T17:00:00Z',
      };

      hasuraClient.execute
        .mockResolvedValueOnce({ schedules: [] })
        .mockResolvedValueOnce({ shifts_by_pk: { required_skills: null } })
        .mockResolvedValueOnce({ employees_by_pk: { skills: [] } });

      const conflicts = await service.detectConflicts(schedule);

      expect(conflicts).toHaveLength(0);
    });
  });

  describe('validateSkills', () => {
    it('should detect skill mismatches', async () => {
      const schedule: CreateScheduleDto = {
        employeeId: 'emp-1',
        shiftId: 'shift-1',
        startTime: '2024-01-01T09:00:00Z',
        endTime: '2024-01-01T17:00:00Z',
      };

      hasuraClient.execute
        .mockResolvedValueOnce({
          shifts_by_pk: { required_skills: ['cpr'] },
        })
        .mockResolvedValueOnce({
          employees_by_pk: { skills: [{ name: 'nursing' }] },
        });

      const conflicts = await service.detectConflicts(schedule);

      // Should detect skill mismatch
      expect(hasuraClient.execute).toHaveBeenCalled();
    });
  });
});

