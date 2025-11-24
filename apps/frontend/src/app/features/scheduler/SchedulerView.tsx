import { addDays, format, isSameDay, parseISO, startOfWeek } from 'date-fns';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { useCreateSchedule, useDeleteSchedule, useEmployees, useSchedules, useUpdateSchedule } from '../../hooks';
import ConflictIndicator from './ConflictIndicator';
import ScheduleForm from './ScheduleForm';
import ScheduleTimeline from './ScheduleTimeline';

export default function SchedulerView() {
  const { schedules, loading: schedulesLoading } = useSchedules();
  const { employees, loading: employeesLoading } = useEmployees();
  const createScheduleMutation = useCreateSchedule();
  const updateScheduleMutation = useUpdateSchedule();
  const deleteScheduleMutation = useDeleteSchedule();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<any>(null);

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const filteredSchedules = schedules.filter((schedule: any) => {
    const scheduleDate = parseISO(schedule.startTime);
    return isSameDay(scheduleDate, selectedDate);
  });

  const conflicts = filteredSchedules.filter((s: any) => s.status === 'conflict');

  if (schedulesLoading || employeesLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Loading schedules...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Schedule View</h2>
          <p className="mt-1 text-sm text-gray-500">
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <div className="flex gap-2">
          {conflicts.length > 0 && <ConflictIndicator count={conflicts.length} />}
          <Button onClick={() => {
            setEditingSchedule(null);
            setIsModalOpen(true);
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Schedule
          </Button>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSchedule(null);
        }}
        title={editingSchedule ? 'Edit Schedule' : 'Add Schedule'}
      >
        <ScheduleForm
          schedule={editingSchedule}
          defaultDate={selectedDate}
          defaultEmployeeId={selectedEmployee || undefined}
          onSubmit={async (data) => {
            try {
              if (editingSchedule) {
                await updateScheduleMutation.mutateAsync({ id: editingSchedule.id, data });
              } else {
                await createScheduleMutation.mutateAsync(data);
              }
              setIsModalOpen(false);
              setEditingSchedule(null);
            } catch (error) {
              console.error('Error saving schedule:', error);
              alert('Failed to save schedule. Please try again.');
            }
          }}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingSchedule(null);
          }}
        />
      </Modal>

      {/* Week Navigation */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => setSelectedDate(addDays(selectedDate, -7))}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
          >
            ← Previous Week
          </button>
          <button
            onClick={() => setSelectedDate(new Date())}
            className="px-3 py-1 text-sm text-primary-600 hover:text-primary-700"
          >
            Today
          </button>
          <button
            onClick={() => setSelectedDate(addDays(selectedDate, 7))}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
          >
            Next Week →
          </button>
        </div>

        {/* Week Days */}
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => {
            const isSelected = isSameDay(day, selectedDate);
            const daySchedules = schedules.filter((s: any) => {
              const scheduleDate = parseISO(s.startTime);
              return isSameDay(scheduleDate, day);
            });
            const dayConflicts = daySchedules.filter((s: any) => s.status === 'conflict').length;

            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={`p-3 rounded-lg text-center transition-colors ${
                  isSelected
                    ? 'bg-primary-100 text-primary-700 font-semibold'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="text-xs text-gray-500 mb-1">
                  {format(day, 'EEE')}
                </div>
                <div className="text-lg font-medium">
                  {format(day, 'd')}
                </div>
                {daySchedules.length > 0 && (
                  <div className="text-xs mt-1">
                    <span className={dayConflicts > 0 ? 'text-red-600' : 'text-green-600'}>
                      {daySchedules.length} {daySchedules.length === 1 ? 'shift' : 'shifts'}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Timeline */}
      <ScheduleTimeline
        schedules={filteredSchedules}
        employees={employees}
        selectedDate={selectedDate}
        selectedEmployee={selectedEmployee}
        onEmployeeSelect={setSelectedEmployee}
        onEdit={(schedule) => {
          setEditingSchedule(schedule);
          setIsModalOpen(true);
        }}
        onDelete={async (id) => {
          if (confirm('Are you sure you want to delete this schedule?')) {
            try {
              await deleteScheduleMutation.mutateAsync(id);
            } catch (error) {
              console.error('Error deleting schedule:', error);
              alert('Failed to delete schedule. Please try again.');
            }
          }
        }}
      />
    </div>
  );
}

