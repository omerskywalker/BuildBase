import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import PlaybookPage from "@/app/(coach)/playbook/page";

// Mock sonner
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockEntries = [
  {
    id: "e1",
    title: "Squat Technique Guide",
    content: "Detailed squat instructions and coaching cues for hip crease depth.",
    category: "Movement Patterns",
    coach_id: "coach-1",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "e2",
    title: "Deadlift Safety Protocol",
    content: "How to coach safe deadlift form with posterior-chain engagement.",
    category: "Movement Patterns",
    coach_id: "coach-1",
    created_at: "2024-01-02T00:00:00Z",
    updated_at: "2024-01-02T00:00:00Z",
  },
  {
    id: "e3",
    title: "Client Communication Tips",
    content: "Best practices for motivating clients during tough sessions.",
    category: "Coaching",
    coach_id: "coach-1",
    created_at: "2024-01-03T00:00:00Z",
    updated_at: "2024-01-03T00:00:00Z",
  },
];

async function renderAndWait() {
  await act(async () => {
    render(<PlaybookPage />);
  });
}

describe("PlaybookPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockEntries),
    });
  });

  it("renders the playbook page with title and search after loading", async () => {
    await renderAndWait();

    await waitFor(() => {
      expect(screen.getByText("Coach's Playbook")).toBeInTheDocument();
    });
    expect(screen.getByPlaceholderText("Search by title, content, or category...")).toBeInTheDocument();
  });

  it("displays all entries grouped by category after fetch", async () => {
    await renderAndWait();

    await waitFor(() => {
      expect(screen.getByText("Squat Technique Guide")).toBeInTheDocument();
    });
    expect(screen.getByText("Deadlift Safety Protocol")).toBeInTheDocument();
    expect(screen.getByText("Client Communication Tips")).toBeInTheDocument();

    // Category headers (may also appear as badge text on entries, so use getAllByText)
    expect(screen.getAllByText("Movement Patterns").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Coaching").length).toBeGreaterThanOrEqual(1);
  });

  it("expands and collapses entries when clicked", async () => {
    await renderAndWait();

    await waitFor(() => {
      expect(screen.getByText("Squat Technique Guide")).toBeInTheDocument();
    });

    // Content should not be visible initially
    expect(screen.queryByText(/Detailed squat instructions/)).not.toBeInTheDocument();

    // Click to expand
    fireEvent.click(screen.getByText("Squat Technique Guide"));

    // Content should now be visible
    expect(screen.getByText(/Detailed squat instructions/)).toBeInTheDocument();
  });

  it("filters entries based on search term", async () => {
    await renderAndWait();

    await waitFor(() => {
      expect(screen.getByText("Squat Technique Guide")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Search by title, content, or category...");

    fireEvent.change(searchInput, { target: { value: "squat" } });

    expect(screen.getByText("Squat Technique Guide")).toBeInTheDocument();
    expect(screen.queryByText("Client Communication Tips")).not.toBeInTheDocument();

    // Should show results count
    expect(screen.getByText(/Found 1 entr/)).toBeInTheDocument();
  });

  it("shows no results message when search has no matches", async () => {
    await renderAndWait();

    await waitFor(() => {
      expect(screen.getByText("Squat Technique Guide")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Search by title, content, or category...");
    fireEvent.change(searchInput, { target: { value: "nonexistent" } });

    expect(screen.getByText("No results found")).toBeInTheDocument();
  });

  it("handles search case insensitivity", async () => {
    await renderAndWait();

    await waitFor(() => {
      expect(screen.getByText("Squat Technique Guide")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Search by title, content, or category...");

    fireEvent.change(searchInput, { target: { value: "SQUAT" } });
    expect(screen.getByText("Squat Technique Guide")).toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: "deadlift" } });
    expect(screen.getByText("Deadlift Safety Protocol")).toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: "Communication" } });
    expect(screen.getByText("Client Communication Tips")).toBeInTheDocument();
  });

  it("shows empty state when no entries exist", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });

    await renderAndWait();

    await waitFor(() => {
      expect(screen.getByText("No playbook entries yet")).toBeInTheDocument();
    });
    expect(screen.getByText("Create First Entry")).toBeInTheDocument();
  });

  it("shows create form when New Entry is clicked", async () => {
    await renderAndWait();

    await waitFor(() => {
      expect(screen.getByText("Squat Technique Guide")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("New Entry"));

    expect(screen.getByText("New Playbook Entry")).toBeInTheDocument();
    expect(screen.getByLabelText("Title")).toBeInTheDocument();
    expect(screen.getByLabelText("Content")).toBeInTheDocument();
    expect(screen.getByLabelText("Category")).toBeInTheDocument();
  });

  it("searches within content", async () => {
    await renderAndWait();

    await waitFor(() => {
      expect(screen.getByText("Squat Technique Guide")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Search by title, content, or category...");

    fireEvent.change(searchInput, { target: { value: "posterior-chain" } });
    expect(screen.getByText("Deadlift Safety Protocol")).toBeInTheDocument();
    expect(screen.queryByText("Squat Technique Guide")).not.toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: "" } });

    fireEvent.change(searchInput, { target: { value: "hip crease" } });
    expect(screen.getByText("Squat Technique Guide")).toBeInTheDocument();
    expect(screen.queryByText("Client Communication Tips")).not.toBeInTheDocument();
  });
});
