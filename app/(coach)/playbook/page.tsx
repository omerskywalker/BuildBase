"use client";

import { useState } from "react";
import { Search, ChevronDown, ChevronUp, Target, AlertCircle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PlaybookSection {
  id: string;
  title: string;
  phase?: string;
  category: string;
  content: PlaybookContent[];
}

interface PlaybookContent {
  type: "exercise" | "principle" | "cue";
  title: string;
  content: string;
  tags?: string[];
  priority?: "high" | "medium" | "low";
}

const playbookData: PlaybookSection[] = [
  {
    id: "form-fundamentals",
    title: "Form Assessment & Coaching",
    category: "Assessment",
    content: [
      {
        type: "principle",
        title: "Three-Stage Assessment System",
        content: `Use the internal form assessment to track client progress:
        
• **Needs Cues**: Client struggles with basic form, requires constant verbal cues
• **Getting There**: Shows improvement, occasional cues needed
• **Locked In**: Solid form demonstrated consistently, client sees "Solid Form ✅" badge

Never reveal raw assessment scores to clients. They only see the positive reinforcement when locked in.`,
        priority: "high"
      },
      {
        type: "cue",
        title: "Universal Coaching Cues",
        content: `Core cues that work across all movements:
        
• "Chest up, shoulders back"
• "Tight core, breathe behind the shield"
• "Control the weight, don't let it control you"
• "Full range of motion, pause at the bottom"
• "Drive through your heels"`,
        tags: ["form", "cues"],
        priority: "high"
      }
    ]
  },
  {
    id: "squat-mastery",
    title: "Squat Technique & Progressions",
    category: "Movement Patterns",
    phase: "All Phases",
    content: [
      {
        type: "exercise",
        title: "Goblet Squat Setup",
        content: `Foundation movement for squat pattern development:

**Setup:**
• Hold weight at chest level, elbows pointing down
• Feet shoulder-width apart, toes slightly out
• Engage core before descending

**Execution:**
• Hinge at hips first, then bend knees
• Keep chest up, weight on heels
• Descend until hip crease below knee
• Drive through heels to return

**Common Issues:**
• Knees caving inward → "Push knees out over toes"
• Forward lean → "Keep that chest proud"
• Shallow depth → "Sit back into an imaginary chair"`,
        tags: ["squat", "goblet", "lower-body"],
        priority: "high"
      },
      {
        type: "exercise",
        title: "Back Squat Progression",
        content: `Advanced squat pattern with barbell loading:

**Bar Position:**
• High bar: Across upper traps
• Low bar: Across rear delts (more hip dominant)

**Breathing & Bracing:**
• Big breath at top, brace core
• Hold breath during descent and ascent
• Exhale forcefully at top

**Depth Checkpoints:**
• Hip crease below knee cap
• Maintain neutral spine
• Knees track over toes

**Spotting Notes:**
• Hands under armpits, not on bar
• Follow client down and up
• Only assist if they're failing`,
        tags: ["squat", "barbell", "lower-body"],
        priority: "high"
      }
    ]
  },
  {
    id: "deadlift-mastery",
    title: "Deadlift Technique & Safety",
    category: "Movement Patterns", 
    phase: "Phase 2-3",
    content: [
      {
        type: "exercise",
        title: "Romanian Deadlift (RDL)",
        content: `Hip-hinge pattern development:

**Setup:**
• Bar starts at hip level
• Hands shoulder-width apart
• Slight bend in knees

**Movement:**
• Push hips back, keep bar close
• Maintain neutral spine
• Feel stretch in hamstrings
• Return by driving hips forward

**Critical Cues:**
• "Bow to the audience, stick your butt out"
• "Bar stays glued to your legs"
• "Feel it in your hamstrings, not your back"`,
        tags: ["deadlift", "rdl", "posterior-chain"],
        priority: "high"
      },
      {
        type: "exercise", 
        title: "Conventional Deadlift",
        content: `Full deadlift movement pattern:

**Setup Position:**
• Feet hip-width apart
• Bar over mid-foot
• Shins close to bar
• Shoulders over bar
• Neutral head position

**Lifting Sequence:**
1. Brace core and lats
2. Drive through heels
3. Knees and hips extend together
4. Stand tall, squeeze glutes
5. Reverse movement to lower

**Safety Red Flags:**
• Rounded lower back → Reset and retry
• Bar drifting forward → "Keep it close"
• Knees caving → "Drive knees out"`,
        tags: ["deadlift", "conventional", "posterior-chain"],
        priority: "high"
      }
    ]
  },
  {
    id: "upper-body-fundamentals",
    title: "Upper Body Movement Patterns",
    category: "Movement Patterns",
    phase: "All Phases", 
    content: [
      {
        type: "exercise",
        title: "Push-Up Progressions",
        content: `Building upper body strength progressively:

**Regression Options:**
• Wall push-ups
• Incline push-ups (bench/step)
• Knee push-ups
• Eccentric-only (slow lowering)

**Standard Push-Up:**
• Hands under shoulders
• Straight line from head to heels
• Lower chest to floor
• Push up explosively

**Advanced Progressions:**
• Diamond push-ups
• Single-arm push-ups
• Weighted push-ups

**Form Focus:**
• No sagging hips
• Full range of motion
• Control on the way down`,
        tags: ["push-up", "upper-body", "bodyweight"],
        priority: "medium"
      },
      {
        type: "exercise",
        title: "Bench Press Technique",
        content: `Fundamental horizontal push pattern:

**Setup:**
• Eyes under the bar
• Shoulder blades pulled back and down
• Feet firmly planted
• Slight arch in lower back

**Bar Path:**
• Lower to nipple line
• Touch chest gently
• Press straight up
• Don't bounce off chest

**Spotting Protocol:**
• Communicate lift-off preference
• Hands ready near bar (not touching)
• Step in only if needed
• Help rack the weight safely

**Common Errors:**
• Flared elbows → "Keep elbows at 45 degrees"
• Feet up → "Drive through the floor"
• No pause → "Control the descent"`,
        tags: ["bench-press", "upper-body", "barbell"],
        priority: "high"
      }
    ]
  },
  {
    id: "program-periodization", 
    title: "12-Week Program Structure",
    category: "Programming",
    content: [
      {
        type: "principle",
        title: "Phase Progression Overview",
        content: `BuildBase follows a structured 3-phase approach:

**Phase 1 (Weeks 1-4): Foundation**
• Movement pattern development
• High rep ranges (8-12 reps)
• Moderate intensity
• Form mastery focus

**Phase 2 (Weeks 5-8): Strength Building** 
• Increased load progression
• Medium rep ranges (6-8 reps)
• Higher intensity
• Consistency in execution

**Phase 3 (Weeks 9-12): Peak Performance**
• Heavy load training
• Lower rep ranges (4-6 reps)
• Maximal strength development
• Advanced movement variations

Each phase builds upon the previous, ensuring safe and effective progression.`,
        priority: "high"
      },
      {
        type: "principle",
        title: "Load Progression Guidelines",
        content: `Progressive overload is achieved through:

**Week-to-Week Progression:**
• Increase weight by 2.5-5lbs for upper body
• Increase weight by 5-10lbs for lower body
• Only progress if form remains solid

**When to Hold Weight:**
• Form breakdown occurs
• Client reports excessive soreness
• Missed reps in previous session

**Deload Protocol:**
• Reduce weight by 10-15%
• Focus on movement quality
• Reassess readiness to progress

**Individual Modifications:**
• Pre-baseline: Start with lighter weights
• Post-baseline: More aggressive progressions
• Consider client's training history`,
        tags: ["progression", "programming"],
        priority: "high"
      }
    ]
  },
  {
    id: "client-communication",
    title: "Client Communication & Motivation",
    category: "Coaching",
    content: [
      {
        type: "principle",
        title: "Effective Coaching Communication",
        content: `Build strong coach-client relationships through:

**Positive Reinforcement:**
• Celebrate small wins consistently
• Use the "Solid Form ✅" badge as motivation
• Acknowledge effort, not just results
• Provide specific, actionable feedback

**Progress Check-ins:**
• Review weekly session completion
• Discuss effort and soreness patterns  
• Address any concerns promptly
• Adjust programs based on feedback

**Note-Taking System:**
• Send encouraging notes after milestones
• Address form issues privately
• Share program modifications clearly
• Keep communication professional yet supportive`,
        tags: ["communication", "motivation"],
        priority: "medium"
      },
      {
        type: "cue",
        title: "Motivational Coaching Phrases",
        content: `Powerful phrases to encourage clients:

**During Tough Sets:**
• "You've got this - one more rep!"
• "This is where the magic happens"
• "Feel that strength building"

**After Good Sessions:**
• "That's exactly what we're looking for"
• "Your form is really coming together"
• "I can see the improvement from last week"

**When Struggling:**
• "This is part of the process"
• "Let's focus on what you did well"
• "We'll adjust and come back stronger"

**Program Milestones:**
• "Look how far you've come"
• "This is why we put in the work"
• "You earned this strength"`,
        tags: ["motivation", "communication"],
        priority: "medium"
      }
    ]
  },
  {
    id: "troubleshooting",
    title: "Common Issues & Solutions",
    category: "Problem Solving",
    content: [
      {
        type: "principle",
        title: "Plateau Breaking Strategies",
        content: `When clients hit strength plateaus:

**Assessment Questions:**
• Is form still solid?
• Are they getting adequate rest?
• Is nutrition supporting their goals?
• Any outside stressors affecting training?

**Programming Adjustments:**
• Reduce weight by 10% and rebuild
• Change rep ranges temporarily
• Add pause reps for strength
• Introduce variation exercises

**Recovery Focus:**
• Emphasize sleep quality
• Discuss stress management
• Consider deload week
• Review training frequency

Remember: Plateaus are normal and temporary with the right approach.`,
        priority: "medium"
      },
      {
        type: "principle", 
        title: "Injury Prevention & Management",
        content: `Proactive approach to keeping clients healthy:

**Warning Signs:**
• Sharp, acute pain during movement
• Pain that worsens with activity
• Persistent soreness beyond normal
• Compensation patterns developing

**Immediate Response:**
• Stop the exercise causing pain
• Don't train through acute pain
• Recommend rest and ice if appropriate
• Suggest medical evaluation if severe

**Program Modifications:**
• Work around injured areas
• Focus on mobility and stability
• Gradually reintroduce movements
• Monitor closely during return

**Documentation:**
• Note any pain reports
• Track modification effectiveness
• Communicate with other healthcare providers
• Adjust long-term programming as needed`,
        tags: ["injury", "safety", "prevention"],
        priority: "high"
      }
    ]
  }
];

export default function PlaybookPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const filteredSections = playbookData.filter(section => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      section.title.toLowerCase().includes(searchLower) ||
      section.category.toLowerCase().includes(searchLower) ||
      section.phase?.toLowerCase().includes(searchLower) ||
      section.content.some(content => 
        content.title.toLowerCase().includes(searchLower) ||
        content.content.toLowerCase().includes(searchLower) ||
        content.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      )
    );
  });

  const getPriorityIcon = (priority?: string) => {
    switch (priority) {
      case "high":
        return <AlertCircle className="w-4 h-4 text-error" />;
      case "medium": 
        return <Target className="w-4 h-4 text-warning" />;
      case "low":
        return <CheckCircle className="w-4 h-4 text-success" />;
      default:
        return null;
    }
  };

  const getContentTypeColor = (type: string) => {
    switch (type) {
      case "exercise":
        return "text-accent";
      case "principle":
        return "text-info";
      case "cue":
        return "text-success";
      default:
        return "text-content-primary";
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-content-primary font-display mb-1">
            Coach's Playbook
          </h1>
          <p className="text-sm text-content-secondary">
            Comprehensive coaching guide for the 12-week strength program
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-content-muted w-4 h-4" />
        <Input
          placeholder="Search by exercise, phase, or technique..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Results Count */}
      {searchTerm && (
        <p className="text-sm text-content-secondary mb-4">
          Found {filteredSections.length} section{filteredSections.length !== 1 ? 's' : ''} matching "{searchTerm}"
        </p>
      )}

      {/* Sections */}
      <div className="space-y-4">
        {filteredSections.map((section) => (
          <Card key={section.id}>
            <CardHeader
              className="cursor-pointer hover:bg-bg-hover transition-colors"
              onClick={() => toggleSection(section.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-lg">{section.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 bg-bg-surface rounded-full text-content-secondary">
                      {section.category}
                    </span>
                    {section.phase && (
                      <span className="text-xs px-2 py-1 bg-info/20 text-info rounded-full">
                        {section.phase}
                      </span>
                    )}
                  </div>
                </div>
                {expandedSections[section.id] ? (
                  <ChevronUp className="w-5 h-5 text-content-secondary" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-content-secondary" />
                )}
              </div>
            </CardHeader>
            
            {expandedSections[section.id] && (
              <CardContent>
                <div className="space-y-6">
                  {section.content.map((content, index) => (
                    <div key={index} className="border-l-2 border-border-subtle pl-4">
                      <div className="flex items-center gap-2 mb-2">
                        {getPriorityIcon(content.priority)}
                        <h4 className={cn(
                          "font-semibold text-base",
                          getContentTypeColor(content.type)
                        )}>
                          {content.title}
                        </h4>
                        <span className="text-xs px-2 py-1 bg-bg-surface rounded text-content-muted uppercase">
                          {content.type}
                        </span>
                      </div>
                      
                      <div className="prose prose-invert prose-sm max-w-none">
                        <div className="text-content-secondary whitespace-pre-line">
                          {content.content}
                        </div>
                      </div>
                      
                      {content.tags && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {content.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-xs px-2 py-1 bg-accent/20 text-accent rounded"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {filteredSections.length === 0 && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-content-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-content-primary mb-2">No results found</h3>
          <p className="text-content-secondary">
            Try adjusting your search terms or browse all sections by clearing the search.
          </p>
        </div>
      )}
    </div>
  );
}