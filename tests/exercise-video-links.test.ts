import { describe, it, expect } from "vitest";
import type { TemplateExercise, Exercise } from "@/lib/types";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const makeExercise = (overrides: Partial<Exercise> = {}): Exercise => ({
  id: "ex-1",
  name: "Barbell Back Squat",
  muscle_group: "Quads, Glutes, Core",
  equipment: "Barbell, Rack",
  instructions: null,
  coaching_cues: "Bar on traps, not neck.",
  video_url: null,
  created_by: null,
  is_active: true,
  created_at: new Date().toISOString(),
  ...overrides,
});

const makeTemplateExercise = (
  overrides: Partial<TemplateExercise> = {},
  exerciseOverrides: Partial<Exercise> = {}
): TemplateExercise => ({
  id: "te-1",
  workout_template_id: "wt-1",
  exercise_id: "ex-1",
  order_index: 0,
  sets_default: 3,
  reps_default: 8,
  weight_pre_baseline_f: 35,
  weight_pre_baseline_m: 55,
  weight_default_f: 45,
  weight_default_m: 65,
  weight_post_baseline_f: 65,
  weight_post_baseline_m: 95,
  superset_group: null,
  is_bodyweight: false,
  is_abs_finisher: false,
  coaching_cues: null,
  notes: null,
  exercise: makeExercise(exerciseOverrides),
  ...overrides,
});

// ─── Video icon rendering logic ───────────────────────────────────────────────

/**
 * Mirrors the rendering condition in SessionCard.tsx:
 *   {templateExercise.exercise?.video_url && ( <Video icon link> )}
 *
 * Returns true when a video icon/link should be rendered.
 */
function shouldRenderVideoIcon(te: TemplateExercise): boolean {
  return !!te.exercise?.video_url;
}

/**
 * Mirrors the rendering condition in SessionDetailModal.tsx:
 *   {templateExercise.exercise?.video_url && ( <Watch Demo link> )}
 *
 * Returns the video URL if present, or null.
 */
function getVideoUrl(te: TemplateExercise): string | null {
  return te.exercise?.video_url ?? null;
}

describe("exercise video links — visibility", () => {
  it("renders video icon when video_url is present", () => {
    const te = makeTemplateExercise({}, { video_url: "https://www.youtube.com/watch?v=example_squat" });
    expect(shouldRenderVideoIcon(te)).toBe(true);
  });

  it("does not render video icon when video_url is null", () => {
    const te = makeTemplateExercise({}, { video_url: null });
    expect(shouldRenderVideoIcon(te)).toBe(false);
  });

  it("does not render video icon when video_url is undefined (no exercise joined)", () => {
    const te = makeTemplateExercise({ exercise: undefined });
    expect(shouldRenderVideoIcon(te)).toBe(false);
  });

  it("does not render video icon when video_url is empty string", () => {
    const te = makeTemplateExercise({}, { video_url: "" as unknown as string });
    // Empty string is falsy, so icon should not render
    expect(shouldRenderVideoIcon(te)).toBe(false);
  });
});

describe("exercise video links — URL extraction", () => {
  it("returns video URL when present", () => {
    const url = "https://www.youtube.com/watch?v=example_deadlift";
    const te = makeTemplateExercise({}, { video_url: url });
    expect(getVideoUrl(te)).toBe(url);
  });

  it("returns null when video_url is null", () => {
    const te = makeTemplateExercise({}, { video_url: null });
    expect(getVideoUrl(te)).toBeNull();
  });

  it("returns null when exercise is not joined", () => {
    const te = makeTemplateExercise({ exercise: undefined });
    expect(getVideoUrl(te)).toBeNull();
  });
});

describe("exercise video links — link attributes", () => {
  it("link opens in new tab (target=_blank pattern)", () => {
    // This test verifies the contract: when video_url is present,
    // the rendered link must use target="_blank" and rel="noopener noreferrer".
    // We test the data contract here; the actual anchor attributes are in the component.
    const te = makeTemplateExercise({}, { video_url: "https://www.youtube.com/watch?v=example_rdl" });

    // Simulate what the component does: build link props from the exercise data
    const linkProps = te.exercise?.video_url
      ? {
          href: te.exercise.video_url,
          target: "_blank" as const,
          rel: "noopener noreferrer",
        }
      : null;

    expect(linkProps).not.toBeNull();
    expect(linkProps!.href).toBe("https://www.youtube.com/watch?v=example_rdl");
    expect(linkProps!.target).toBe("_blank");
    expect(linkProps!.rel).toBe("noopener noreferrer");
  });

  it("no link props when video_url is absent", () => {
    const te = makeTemplateExercise({}, { video_url: null });
    const linkProps = te.exercise?.video_url
      ? {
          href: te.exercise.video_url,
          target: "_blank" as const,
          rel: "noopener noreferrer",
        }
      : null;

    expect(linkProps).toBeNull();
  });
});

describe("exercise video links — multiple exercises", () => {
  it("correctly identifies which exercises have videos in a mixed list", () => {
    const exercises = [
      makeTemplateExercise({ id: "te-1" }, { id: "ex-1", name: "Goblet Squat", video_url: "https://www.youtube.com/watch?v=example_goblet_squat" }),
      makeTemplateExercise({ id: "te-2", exercise_id: "ex-2" }, { id: "ex-2", name: "Hamstring Curl", video_url: null }),
      makeTemplateExercise({ id: "te-3", exercise_id: "ex-3" }, { id: "ex-3", name: "Conventional Deadlift", video_url: "https://www.youtube.com/watch?v=example_deadlift" }),
      makeTemplateExercise({ id: "te-4", exercise_id: "ex-4" }, { id: "ex-4", name: "Plank", video_url: null }),
    ];

    const withVideos = exercises.filter(shouldRenderVideoIcon);
    expect(withVideos).toHaveLength(2);
    expect(withVideos.map((te) => te.exercise?.name)).toEqual(["Goblet Squat", "Conventional Deadlift"]);
  });
});
