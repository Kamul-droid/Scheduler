import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { HasuraClientService } from '../../common/services/hasura-client.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeesService } from './employees.service';

describe('EmployeesService', () => {
  let service: EmployeesService;
  let hasuraClient: jest.Mocked<HasuraClientService>;

  const mockHasuraClient = {
    execute: jest.fn(),
    checkHealth: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeesService,
        {
          provide: HasuraClientService,
          useValue: mockHasuraClient,
        },
      ],
    }).compile();

    service = module.get<EmployeesService>(EmployeesService);
    hasuraClient = module.get(HasuraClientService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return an array of employees', async () => {
      const mockEmployees = [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          skills: null,
          availability_pattern: null,
          metadata: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      hasuraClient.execute.mockResolvedValue({
        employees: mockEmployees,
      });

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('John Doe');
      expect(hasuraClient.execute).toHaveBeenCalled();
    });

    it('should return empty array when no employees found', async () => {
      hasuraClient.execute.mockResolvedValue({ employees: [] });

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a single employee', async () => {
      const mockEmployee = {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        skills: null,
        availability_pattern: null,
        metadata: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      hasuraClient.execute.mockResolvedValue({
        employees_by_pk: mockEmployee,
      });

      const result = await service.findOne('1');

      expect(result.id).toBe('1');
      expect(result.name).toBe('John Doe');
    });

    it('should throw NotFoundException when employee not found', async () => {
      hasuraClient.execute.mockResolvedValue({
        employees_by_pk: null,
      });

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new employee', async () => {
      const createDto: CreateEmployeeDto = {
        name: 'Jane Doe',
        email: 'jane@example.com',
      };

      const mockCreated = {
        id: '2',
        name: 'Jane Doe',
        email: 'jane@example.com',
        skills: null,
        availability_pattern: null,
        metadata: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      hasuraClient.execute.mockResolvedValue({
        insert_employees_one: mockCreated,
      });

      const result = await service.create(createDto);

      expect(result.name).toBe('Jane Doe');
      expect(result.email).toBe('jane@example.com');
      expect(hasuraClient.execute).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update an existing employee', async () => {
      const updateDto: UpdateEmployeeDto = {
        name: 'John Updated',
      };

      const mockExisting = {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        skills: null,
        availability_pattern: null,
        metadata: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const mockUpdated = {
        ...mockExisting,
        name: 'John Updated',
      };

      hasuraClient.execute
        .mockResolvedValueOnce({ employees_by_pk: mockExisting })
        .mockResolvedValueOnce({ update_employees_by_pk: mockUpdated });

      const result = await service.update('1', updateDto);

      expect(result.name).toBe('John Updated');
    });
  });

  describe('remove', () => {
    it('should delete an employee', async () => {
      const mockEmployee = {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        skills: null,
        availability_pattern: null,
        metadata: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      hasuraClient.execute
        .mockResolvedValueOnce({ employees_by_pk: mockEmployee })
        .mockResolvedValueOnce({ delete_employees_by_pk: mockEmployee });

      const result = await service.remove('1');

      expect(result.id).toBe('1');
    });
  });
});

