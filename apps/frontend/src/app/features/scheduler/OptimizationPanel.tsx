import { useQuery } from '@tanstack/react-query';
import { AlertCircle, CheckCircle, Loader2, XCircle, Zap } from 'lucide-react';
import { useMemo, useState } from 'react';
import { optimizationApi, shiftsApi } from '../../../lib/api';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { useEmployees } from '../../hooks';
import { useActiveConstraints } from '../../hooks/useConstraints';
import {
  validateOptimizationRequest,
  type OptimizationRequest
} from './optimization-validation';

export default function OptimizationPanel() {
  const { employees } = useEmployees();
  const { constraints } = useActiveConstraints();
  
  // Fetch shifts for date range validation
  const { data: shifts = [] } = useQuery({
    queryKey: ['shifts'],
    queryFn: shiftsApi.getAll,
  });

  const [optimizationId, setOptimizationId] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  
  // Form state
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date.toISOString().slice(0, 16); // Format for datetime-local input
  });
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    date.setHours(23, 59, 59, 999);
    return date.toISOString().slice(0, 16);
  });
  const [objective, setObjective] = useState<'minimize_cost' | 'maximize_fairness' | 'balance'>('balance');
  const [allowOvertime, setAllowOvertime] = useState(false);
  const [maxOptimizationTime, setMaxOptimizationTime] = useState(30);
  const [solutionCount, setSolutionCount] = useState(3);
  
  // Validation state
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

  const { data: optimizationResult, isLoading: isLoadingResult } = useQuery({
    queryKey: ['optimization', optimizationId],
    queryFn: () => optimizationApi.getStatus(optimizationId!),
    enabled: !!optimizationId,
    refetchInterval: (query) => {
      // Poll until optimization is complete
      const data = query.state.data as any;
      if (data?.status === 'completed' || data?.status === 'failed') {
        return false;
      }
      return 2000; // Poll every 2 seconds
    },
  });

  // Calculate shifts in date range for validation
  const shiftsInRange = useMemo(() => {
    if (!startDate || !endDate) return [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    return shifts.filter((shift: any) => {
      const shiftStart = new Date(shift.startTime);
      const shiftEnd = new Date(shift.endTime);
      return shiftStart <= end && shiftEnd >= start;
    });
  }, [shifts, startDate, endDate]);

  const handleOptimize = async () => {
    // Clear previous validation
    setValidationErrors([]);
    setValidationWarnings([]);

    // Convert datetime-local format to ISO string
    const startDateISO = new Date(startDate).toISOString();
    const endDateISO = new Date(endDate).toISOString();

    const request: OptimizationRequest = {
      startDate: startDateISO,
      endDate: endDateISO,
      options: {
        objective,
        allowOvertime,
        maxOptimizationTime,
        solutionCount,
      },
    };

    // Validate request
    const validation = validateOptimizationRequest(request, {
      employeeCount: employees.length,
      shiftCount: shiftsInRange.length,
      constraintCount: constraints.length,
    });

    if (!validation.isValid) {
      setValidationErrors(validation.errors.map((e) => e.message));
      setValidationWarnings(validation.warnings.map((w) => w.message));
      return;
    }

    // Show warnings but allow proceeding
    if (validation.warnings.length > 0) {
      setValidationWarnings(validation.warnings.map((w) => w.message));
    }

    setIsOptimizing(true);
    try {
      const response = await optimizationApi.optimize(request);
      setOptimizationId(response.optimizationId);
      // Clear validation on success
      setValidationErrors([]);
      setValidationWarnings([]);
    } catch (error: any) {
      console.error('Optimization failed:', error);
      const errorMessage = error?.message || 'Failed to start optimization. Please try again.';
      setValidationErrors([errorMessage]);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleApplySolution = async (solutionId: string) => {
    // Apply the selected solution to the database
    if (optimizationResult?.solutions) {
      const solution = optimizationResult.solutions.find((s: any) => s.id === solutionId);
      if (solution) {
        // TODO: Implement solution application via GraphQL mutations
        alert(`Applying solution ${solutionId}...`);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Schedule Optimization</h2>
        <p className="mt-1 text-sm text-gray-500">
          Generate optimal schedules based on constraints and requirements
        </p>
      </div>

      {/* Optimization Controls */}
      <div className="card">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Current State</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Employees:</span>
              <span className="ml-2 font-medium">{employees.length}</span>
            </div>
            <div>
              <span className="text-gray-500">Shifts in Range:</span>
              <span className="ml-2 font-medium">{shiftsInRange.length}</span>
            </div>
            <div>
              <span className="text-gray-500">Active Constraints:</span>
              <span className="ml-2 font-medium">{constraints.length}</span>
            </div>
          </div>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold text-red-900 mb-1">Validation Errors</h4>
                <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Validation Warnings */}
        {validationWarnings.length > 0 && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold text-yellow-900 mb-1">Warnings</h4>
                <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
                  {validationWarnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Optimization Form */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Optimization Parameters</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date *
              </label>
              <Input
                id="startDate"
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                End Date *
              </label>
              <Input
                id="endDate"
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="objective" className="block text-sm font-medium text-gray-700 mb-1">
                Objective
              </label>
              <select
                id="objective"
                value={objective}
                onChange={(e) => setObjective(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="balance">Balance</option>
                <option value="minimize_cost">Minimize Cost</option>
                <option value="maximize_fairness">Maximize Fairness</option>
              </select>
            </div>
            <div>
              <label htmlFor="solutionCount" className="block text-sm font-medium text-gray-700 mb-1">
                Solution Count (1-10)
              </label>
              <Input
                id="solutionCount"
                type="number"
                min="1"
                max="10"
                value={solutionCount}
                onChange={(e) => setSolutionCount(parseInt(e.target.value) || 3)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="maxOptimizationTime" className="block text-sm font-medium text-gray-700 mb-1">
                Max Optimization Time (seconds, 1-300)
              </label>
              <Input
                id="maxOptimizationTime"
                type="number"
                min="1"
                max="300"
                value={maxOptimizationTime}
                onChange={(e) => setMaxOptimizationTime(parseInt(e.target.value) || 30)}
              />
            </div>
            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowOvertime}
                  onChange={(e) => setAllowOvertime(e.target.checked)}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700">Allow Overtime</span>
              </label>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Button 
            onClick={handleOptimize} 
            disabled={isOptimizing || validationErrors.length > 0}
            variant="primary"
          >
            {isOptimizing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Optimizing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Start Optimization
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Optimization Results */}
      {optimizationId && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Optimization Results</h3>
          
          {isLoadingResult ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary-600 mb-2" />
              <p className="text-gray-500">Optimizing schedule...</p>
            </div>
          ) : optimizationResult?.status === 'completed' ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Optimization completed successfully</span>
              </div>

              {optimizationResult.solutions && optimizationResult.solutions.length > 0 ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Found {optimizationResult.solutions.length} solution(s):
                  </p>
                  {optimizationResult.solutions.map((solution: any, index: number) => (
                    <div key={solution.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            Solution {index + 1}
                          </h4>
                          {solution.metrics && (
                            <div className="mt-2 text-sm text-gray-600">
                              <div>Score: {solution.metrics.score || 'N/A'}</div>
                              <div>Coverage: {solution.metrics.coverage || 'N/A'}%</div>
                            </div>
                          )}
                        </div>
                        <Button
                          onClick={() => handleApplySolution(solution.id)}
                          variant="primary"
                        >
                          Apply Solution
                        </Button>
                      </div>
                      {solution.assignments && (
                        <div className="text-sm text-gray-500">
                          {solution.assignments.length} assignments
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No solutions found. Try adjusting constraints or requirements.
                </div>
              )}
            </div>
          ) : optimizationResult?.status === 'failed' ? (
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="w-5 h-5" />
              <span>Optimization failed. Please try again.</span>
            </div>
          ) : (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary-600 mb-2" />
              <p className="text-gray-500">Processing optimization...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

