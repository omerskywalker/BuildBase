import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import React from "react";

describe("RestTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders with default 90s and counts down", async () => {
    const RestTimer = (await import("@/app/(app)/sessions/RestTimer")).default;
    const onClose = vi.fn();

    render(React.createElement(RestTimer, { onClose }));

    expect(screen.getByText("1:30")).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(10_000);
    });

    expect(screen.getByText("1:20")).toBeTruthy();
  });

  it("shows 'Rest Complete' when timer reaches 0", async () => {
    const RestTimer = (await import("@/app/(app)/sessions/RestTimer")).default;
    const onClose = vi.fn();

    render(React.createElement(RestTimer, { onClose }));

    act(() => {
      vi.advanceTimersByTime(90_000);
    });

    expect(screen.getByText("Rest Complete")).toBeTruthy();
    expect(screen.getByText("0:00")).toBeTruthy();
  });

  it("calls onClose when X button is clicked", async () => {
    const RestTimer = (await import("@/app/(app)/sessions/RestTimer")).default;
    const onClose = vi.fn();

    render(React.createElement(RestTimer, { onClose }));

    const closeBtn = screen.getByLabelText("Close timer");
    fireEvent.click(closeBtn);

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("resets timer when Reset button is clicked", async () => {
    const RestTimer = (await import("@/app/(app)/sessions/RestTimer")).default;
    const onClose = vi.fn();

    render(React.createElement(RestTimer, { onClose }));

    act(() => {
      vi.advanceTimersByTime(30_000);
    });

    expect(screen.getByText("1:00")).toBeTruthy();

    const resetBtn = screen.getByText("Reset");
    fireEvent.click(resetBtn);

    expect(screen.getByText("1:30")).toBeTruthy();
  });

  it("changes duration when a preset is clicked", async () => {
    const RestTimer = (await import("@/app/(app)/sessions/RestTimer")).default;
    const onClose = vi.fn();

    render(React.createElement(RestTimer, { onClose }));

    const twoMinBtn = screen.getByText("2m");
    fireEvent.click(twoMinBtn);

    expect(screen.getByText("2:00")).toBeTruthy();
  });
});
