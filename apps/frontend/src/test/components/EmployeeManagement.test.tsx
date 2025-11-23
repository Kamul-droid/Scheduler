import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { server } from '../mocks/server';
import EmployeeManagement from '../../app/features/employees/EmployeeManagement';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('EmployeeManagement Component', () => {
  it('should render employee list', async () => {
    render(
      <TestWrapper>
        <EmployeeManagement />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Employee Management')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  it('should open create modal when Add Employee is clicked', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <EmployeeManagement />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Add Employee')).toBeInTheDocument();
    });

    const addButton = screen.getByText('Add Employee');
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Add Employee')).toBeInTheDocument(); // Modal title
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });
  });

  it('should create a new employee', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <EmployeeManagement />
      </TestWrapper>
    );

    // Open modal
    await waitFor(() => {
      expect(screen.getByText('Add Employee')).toBeInTheDocument();
    });

    const addButton = screen.getByText('Add Employee');
    await user.click(addButton);

    // Fill form
    await waitFor(() => {
      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);

      fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });
      fireEvent.change(emailInput, { target: { value: 'jane@example.com' } });
    });

    // Submit form
    const submitButton = screen.getByText('Create');
    await user.click(submitButton);

    // Modal should close after successful creation
    await waitFor(() => {
      expect(screen.queryByText('Add Employee')).not.toBeInTheDocument(); // Modal closed
    });
  });
});

