import { render, screen } from "@testing-library/react";
import { describe, test, expect, vi } from "vitest";

// Mock sonner to avoid provider issues
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

// Mock the Dialog primitives so we can render without a full portal/overlay setup
vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-content">{children}</div>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-header">{children}</div>
  ),
  DialogTitle: ({ children }: { children: React.ReactNode }) => (
    <h2 data-testid="dialog-title">{children}</h2>
  ),
}));

import QuickLogModal from "@/components/QuickLogModal";
import { QuickLogModal as NamedQuickLogModal } from "@/components/quick-log";
import { MuscleGroupSelector } from "@/components/quick-log";
import { MUSCLE_GROUPS } from "@/lib/quick-log-presets";

describe("QuickLogModal", () => {
  test("renders when open=true", () => {
    render(<QuickLogModal open={true} onClose={() => {}} />);
    expect(screen.getByTestId("dialog")).toBeInTheDocument();
    expect(screen.getByText("Log Workout")).toBeInTheDocument();
  });

  test("does not render when open=false", () => {
    render(<QuickLogModal open={false} onClose={() => {}} />);
    expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();
  });

  test("backward-compatible default export matches named export", () => {
    // The default export from components/QuickLogModal.tsx should be the same
    // component as the named export from components/quick-log/index.ts
    expect(QuickLogModal).toBe(NamedQuickLogModal);
  });
});

describe("MuscleGroupSelector", () => {
  test("displays all muscle groups", () => {
    render(
      <MuscleGroupSelector
        selected={[]}
        onToggle={() => {}}
        onNext={() => {}}
      />
    );
    for (const mg of MUSCLE_GROUPS) {
      expect(screen.getByText(mg.label)).toBeInTheDocument();
    }
  });

  test("disables Build Workout button when no muscle group selected", () => {
    render(
      <MuscleGroupSelector
        selected={[]}
        onToggle={() => {}}
        onNext={() => {}}
      />
    );
    const button = screen.getByRole("button", { name: /Build Workout/i });
    expect(button).toBeDisabled();
  });

  test("enables Build Workout button when a muscle group is selected", () => {
    render(
      <MuscleGroupSelector
        selected={["chest"]}
        onToggle={() => {}}
        onNext={() => {}}
      />
    );
    const button = screen.getByRole("button", { name: /Build Workout/i });
    expect(button).not.toBeDisabled();
  });

  test("calls onToggle when a muscle group button is clicked", () => {
    const onToggle = vi.fn();
    render(
      <MuscleGroupSelector
        selected={[]}
        onToggle={onToggle}
        onNext={() => {}}
      />
    );
    screen.getByText("Chest").click();
    expect(onToggle).toHaveBeenCalledWith("chest");
  });
});

describe("Component exports", () => {
  test("all expected components are exported from quick-log index", async () => {
    const mod = await import("@/components/quick-log");
    expect(mod.QuickLogModal).toBeDefined();
    expect(mod.MuscleGroupSelector).toBeDefined();
    expect(mod.ExerciseLogger).toBeDefined();
    expect(mod.ExerciseCard).toBeDefined();
    expect(mod.SetRow).toBeDefined();
    expect(mod.AddExercisePicker).toBeDefined();
  });
});
