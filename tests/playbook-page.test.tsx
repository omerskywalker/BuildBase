import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import PlaybookPage from "@/app/(coach)/playbook/page";

describe("PlaybookPage", () => {
  it("renders the playbook page with title and search", () => {
    render(<PlaybookPage />);
    
    expect(screen.getByText("Coach's Playbook")).toBeInTheDocument();
    expect(screen.getByText("Comprehensive coaching guide for the 12-week strength program")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search by exercise, phase, or technique...")).toBeInTheDocument();
  });

  it("displays all playbook sections initially", () => {
    render(<PlaybookPage />);
    
    // Check for main section titles
    expect(screen.getByText("Form Assessment & Coaching")).toBeInTheDocument();
    expect(screen.getByText("Squat Technique & Progressions")).toBeInTheDocument();
    expect(screen.getByText("Deadlift Technique & Safety")).toBeInTheDocument();
    expect(screen.getByText("Upper Body Movement Patterns")).toBeInTheDocument();
    expect(screen.getByText("12-Week Program Structure")).toBeInTheDocument();
    expect(screen.getByText("Client Communication & Motivation")).toBeInTheDocument();
    expect(screen.getByText("Common Issues & Solutions")).toBeInTheDocument();
  });

  it("expands and collapses sections when clicked", () => {
    render(<PlaybookPage />);
    
    const formSection = screen.getByText("Form Assessment & Coaching");
    
    // Content should not be visible initially (sections are collapsed)
    expect(screen.queryByText("Three-Stage Assessment System")).not.toBeInTheDocument();
    
    // Click to expand
    fireEvent.click(formSection.closest("[data-testid]") || formSection.closest("div")!);
    
    // Content should now be visible
    expect(screen.getByText("Three-Stage Assessment System")).toBeInTheDocument();
    expect(screen.getByText("Universal Coaching Cues")).toBeInTheDocument();
  });

  it("filters sections based on search term", () => {
    render(<PlaybookPage />);
    
    const searchInput = screen.getByPlaceholderText("Search by exercise, phase, or technique...");
    
    // Search for "squat"
    fireEvent.change(searchInput, { target: { value: "squat" } });
    
    // Should show squat section
    expect(screen.getByText("Squat Technique & Progressions")).toBeInTheDocument();
    
    // Should not show unrelated sections
    expect(screen.queryByText("Client Communication & Motivation")).not.toBeInTheDocument();
    
    // Should show results count
    expect(screen.getByText(/Found \d+ section/)).toBeInTheDocument();
  });

  it("shows no results message when search has no matches", () => {
    render(<PlaybookPage />);
    
    const searchInput = screen.getByPlaceholderText("Search by exercise, phase, or technique...");
    
    // Search for something that doesn't exist
    fireEvent.change(searchInput, { target: { value: "nonexistent" } });
    
    expect(screen.getByText("No results found")).toBeInTheDocument();
    expect(screen.getByText("Try adjusting your search terms or browse all sections by clearing the search.")).toBeInTheDocument();
  });

  it("displays category and phase badges", () => {
    render(<PlaybookPage />);
    
    // Check for category badges (some appear on multiple sections)
    expect(screen.getByText("Assessment")).toBeInTheDocument();
    expect(screen.getAllByText("Movement Patterns").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Programming")).toBeInTheDocument();
    expect(screen.getByText("Coaching")).toBeInTheDocument();
    expect(screen.getByText("Problem Solving")).toBeInTheDocument();

    // Check for phase badges (some appear on multiple sections)
    expect(screen.getAllByText("All Phases").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Phase 2-3")).toBeInTheDocument();
  });

  it("shows content types and priority indicators when sections are expanded", () => {
    render(<PlaybookPage />);
    
    const formSection = screen.getByText("Form Assessment & Coaching");
    
    // Expand the section
    fireEvent.click(formSection.closest("[data-testid]") || formSection.closest("div")!);
    
    // Check for content type labels (rendered lowercase, CSS uppercases them)
    expect(screen.getByText("principle")).toBeInTheDocument();
    expect(screen.getByText("cue")).toBeInTheDocument();
    
    // Check for tags
    expect(screen.getByText("#form")).toBeInTheDocument();
    expect(screen.getByText("#cues")).toBeInTheDocument();
  });

  it("searches within content and tags", () => {
    render(<PlaybookPage />);
    
    const searchInput = screen.getByPlaceholderText("Search by exercise, phase, or technique...");
    
    // Search for a tag
    fireEvent.change(searchInput, { target: { value: "posterior-chain" } });
    
    // Should show deadlift section which has posterior-chain tags
    expect(screen.getByText("Deadlift Technique & Safety")).toBeInTheDocument();
    
    // Clear search
    fireEvent.change(searchInput, { target: { value: "" } });
    
    // Search for content within exercises
    fireEvent.change(searchInput, { target: { value: "hip crease" } });
    
    // Should show squat section which mentions hip crease
    expect(screen.getByText("Squat Technique & Progressions")).toBeInTheDocument();
  });

  it("handles search case insensitivity", () => {
    render(<PlaybookPage />);
    
    const searchInput = screen.getByPlaceholderText("Search by exercise, phase, or technique...");
    
    // Search with different cases
    fireEvent.change(searchInput, { target: { value: "SQUAT" } });
    expect(screen.getByText("Squat Technique & Progressions")).toBeInTheDocument();
    
    fireEvent.change(searchInput, { target: { value: "deadlift" } });
    expect(screen.getByText("Deadlift Technique & Safety")).toBeInTheDocument();
    
    fireEvent.change(searchInput, { target: { value: "Communication" } });
    expect(screen.getByText("Client Communication & Motivation")).toBeInTheDocument();
  });
});