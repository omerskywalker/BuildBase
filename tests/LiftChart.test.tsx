import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import LiftChart from '@/components/LiftChart';

describe('LiftChart', () => {
  const mockData = [
    { date: '2024-01-01', weight: 135, sessionName: 'Week 1 - Session A' },
    { date: '2024-01-03', weight: 140, sessionName: 'Week 1 - Session B' },
    { date: '2024-01-05', weight: 145, sessionName: 'Week 2 - Session A' },
  ];

  test('renders chart with data', () => {
    const { container } = render(
      <LiftChart data={mockData} exerciseName="Bench Press" height={300} />
    );

    const chartContainer = container.querySelector('.recharts-responsive-container');
    expect(chartContainer).toBeInTheDocument();
  });

  test('shows empty state when no data provided', () => {
    render(
      <LiftChart data={[]} exerciseName="Bench Press" height={300} />
    );

    expect(screen.getByText(/No data recorded yet for Bench Press/)).toBeInTheDocument();
  });

  test('shows empty state when data is null/undefined', () => {
    render(
      <LiftChart data={null as any} exerciseName="Squat" height={300} />
    );

    expect(screen.getByText(/No data recorded yet for Squat/)).toBeInTheDocument();
  });

  test('uses custom height when provided', () => {
    const { container } = render(
      <LiftChart data={mockData} exerciseName="Deadlift" height={400} />
    );

    const responsiveContainer = container.querySelector('.recharts-responsive-container');
    expect(responsiveContainer).toHaveStyle({ height: '400px' });
  });

  test('uses default height when not provided', () => {
    const { container } = render(
      <LiftChart data={mockData} exerciseName="Deadlift" />
    );

    const responsiveContainer = container.querySelector('.recharts-responsive-container');
    expect(responsiveContainer).toHaveStyle({ height: '300px' });
  });
});