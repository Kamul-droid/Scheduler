import { http, HttpResponse } from 'msw';

const API_BASE = 'http://localhost:3000';

export const handlers = [
  // Employees
  http.get(`${API_BASE}/employees`, () => {
    return HttpResponse.json([
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        skills: ['JavaScript', 'TypeScript'],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ]);
  }),

  http.post(`${API_BASE}/employees`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(
      {
        id: '2',
        ...body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { status: 201 }
    );
  }),

  http.patch(`${API_BASE}/employees/:id`, async ({ params, request }) => {
    const body = await request.json();
    return HttpResponse.json({
      id: params.id,
      ...body,
      updatedAt: new Date().toISOString(),
    });
  }),

  http.delete(`${API_BASE}/employees/:id`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // Constraints
  http.get(`${API_BASE}/constraints`, () => {
    return HttpResponse.json([
      {
        id: '1',
        type: 'max_hours',
        rules: { maxHoursPerWeek: 40 },
        priority: 50,
        active: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ]);
  }),

  http.get(`${API_BASE}/constraints/active`, () => {
    return HttpResponse.json([
      {
        id: '1',
        type: 'max_hours',
        rules: { maxHoursPerWeek: 40 },
        priority: 50,
        active: true,
      },
    ]);
  }),

  http.post(`${API_BASE}/constraints`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(
      {
        id: '2',
        ...body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { status: 201 }
    );
  }),

  http.patch(`${API_BASE}/constraints/:id`, async ({ params, request }) => {
    const body = await request.json();
    return HttpResponse.json({
      id: params.id,
      ...body,
      updatedAt: new Date().toISOString(),
    });
  }),

  http.delete(`${API_BASE}/constraints/:id`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // Schedules
  http.get(`${API_BASE}/schedules`, () => {
    return HttpResponse.json([
      {
        id: '1',
        employeeId: '1',
        shiftId: '1',
        startTime: '2024-01-01T09:00:00Z',
        endTime: '2024-01-01T17:00:00Z',
        status: 'confirmed',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ]);
  }),

  http.post(`${API_BASE}/schedules`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(
      {
        id: '2',
        ...body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { status: 201 }
    );
  }),

  http.patch(`${API_BASE}/schedules/:id`, async ({ params, request }) => {
    const body = await request.json();
    return HttpResponse.json({
      id: params.id,
      ...body,
      updatedAt: new Date().toISOString(),
    });
  }),

  http.delete(`${API_BASE}/schedules/:id`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // Optimization
  http.post(`${API_BASE}/optimization`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      optimizationId: 'opt-123',
      status: 'processing',
      ...body,
    });
  }),

  http.get(`${API_BASE}/optimization/:id`, () => {
    return HttpResponse.json({
      optimizationId: 'opt-123',
      status: 'completed',
      solutions: [
        {
          id: 'sol-1',
          metrics: { score: 95, coverage: 98 },
          assignments: [],
        },
      ],
    });
  }),
];

