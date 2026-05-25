import { render, screen, fireEvent } from "@testing-library/react";
import { describe, test, expect, vi } from "vitest";
import RootError from "@/app/error";
import AppError from "@/app/(app)/error";
import AdminError from "@/app/(admin)/error";
import CoachError from "@/app/(coach)/error";

describe("Root error boundary", () => {
  test("renders error message and retry button", () => {
    const error = new Error("Test root error");
    const reset = vi.fn();

    render(<RootError error={error} reset={reset} />);

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });

  test("calls reset when retry button is clicked", () => {
    const error = new Error("Test root error");
    const reset = vi.fn();

    render(<RootError error={error} reset={reset} />);

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(reset).toHaveBeenCalledTimes(1);
  });

  test("logs error to console", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const error = new Error("Console test error");
    const reset = vi.fn();

    render(<RootError error={error} reset={reset} />);

    expect(consoleSpy).toHaveBeenCalledWith(
      "Root error boundary caught:",
      error
    );
    consoleSpy.mockRestore();
  });
});

describe("App section error boundary", () => {
  test("renders error message and retry button", () => {
    const error = new Error("Test app error");
    const reset = vi.fn();

    render(<AppError error={error} reset={reset} />);

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(
      screen.getByText(/hit an error loading this page/i)
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });

  test("calls reset when retry button is clicked", () => {
    const error = new Error("Test app error");
    const reset = vi.fn();

    render(<AppError error={error} reset={reset} />);

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(reset).toHaveBeenCalledTimes(1);
  });
});

describe("Admin section error boundary", () => {
  test("renders admin-specific error message", () => {
    const error = new Error("Test admin error");
    const reset = vi.fn();

    render(<AdminError error={error} reset={reset} />);

    expect(screen.getByText("Admin panel error")).toBeInTheDocument();
    expect(
      screen.getByText(/no changes were saved/i)
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });

  test("calls reset when retry button is clicked", () => {
    const error = new Error("Test admin error");
    const reset = vi.fn();

    render(<AdminError error={error} reset={reset} />);

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(reset).toHaveBeenCalledTimes(1);
  });
});

describe("Coach section error boundary", () => {
  test("renders coach-specific error message", () => {
    const error = new Error("Test coach error");
    const reset = vi.fn();

    render(<CoachError error={error} reset={reset} />);

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(
      screen.getByText(/coaching panel/i)
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });

  test("calls reset when retry button is clicked", () => {
    const error = new Error("Test coach error");
    const reset = vi.fn();

    render(<CoachError error={error} reset={reset} />);

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
