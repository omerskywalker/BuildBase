"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SessionLog, WorkoutTemplate } from "@/lib/types";
import { timeAgo } from "@/lib/utils";
import { ChevronDown, ChevronRight, Play, CheckCircle } from "lucide-react";

interface SessionCardProps {
  session: SessionLog & { template?: WorkoutTemplate };
  autoExpanded?: boolean;
}

export default function SessionCard({ session, autoExpanded = false }: SessionCardProps) {
  const [isExpanded, setIsExpanded] = useState(autoExpanded);
  
  const isCompleted = session.is_complete;
  const isStarted = session.started_at !== null;
  const isVirtual = session.id.startsWith("virtual-");

  // Format session title
  const sessionTitle = session.template?.title || `Session ${session.session_number}`;
  const dayLabel = session.template?.day_label || "";
  
  // Status indicators
  const getStatusInfo = () => {
    if (isCompleted) {
      return {
        icon: <CheckCircle className="w-4 h-4 text-success" />,
        text: "Completed",
        textColor: "text-success",
        bgColor: "bg-success/10"
      };
    }
    if (isStarted) {
      return {
        icon: <Play className="w-4 h-4 text-blue-500" />,
        text: "In Progress",
        textColor: "text-blue-500",
        bgColor: "bg-blue-500/10"
      };
    }
    return {
      icon: <Play className="w-4 h-4 text-content-secondary" />,
      text: "Not Started",
      textColor: "text-content-secondary",
      bgColor: "bg-bg-hover"
    };
  };

  const statusInfo = getStatusInfo();

  const handleStartSession = () => {
    // TODO: Implement session start logic (will be in batch 2-3)
    console.log("Start session:", session.id);
  };

  const handleToggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <Card className="transition-all duration-200 hover:shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-content-muted">
                Day {dayLabel}
              </span>
              <span className="text-content-muted">•</span>
              <h3 className="text-lg font-semibold text-content-primary">
                {sessionTitle}
              </h3>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Status Badge */}
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.textColor} flex items-center space-x-1`}>
              {statusInfo.icon}
              <span>{statusInfo.text}</span>
            </div>
            
            {/* Expand/Collapse Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleExpanded}
              className="h-8 w-8"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
        
        {/* Session metadata when collapsed */}
        {!isExpanded && (
          <div className="flex items-center justify-between text-sm text-content-secondary">
            <div>
              {session.template?.description && (
                <span>{session.template.description}</span>
              )}
            </div>
            <div>
              {isCompleted && session.completed_at && (
                <span>Completed {timeAgo(session.completed_at)}</span>
              )}
              {isStarted && !isCompleted && session.started_at && (
                <span>Started {timeAgo(session.started_at)}</span>
              )}
            </div>
          </div>
        )}
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-4">
            {/* Session Description */}
            {session.template?.description && (
              <p className="text-sm text-content-secondary">
                {session.template.description}
              </p>
            )}
            
            {/* Session Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-content-secondary">Session:</span>
                <span className="ml-2 text-content-primary">
                  {session.session_number} of Week {session.week_number}
                </span>
              </div>
              
              {isCompleted && session.post_session_effort && (
                <div>
                  <span className="text-content-secondary">Effort:</span>
                  <span className="ml-2 text-content-primary">
                    {session.post_session_effort}/5
                  </span>
                </div>
              )}
            </div>

            {/* Timestamps */}
            <div className="space-y-2 text-sm text-content-secondary">
              {isStarted && session.started_at && (
                <div>Started: {new Date(session.started_at).toLocaleDateString()}</div>
              )}
              {isCompleted && session.completed_at && (
                <div>Completed: {new Date(session.completed_at).toLocaleDateString()}</div>
              )}
            </div>

            {/* Session Notes */}
            {session.notes && (
              <div className="p-3 bg-bg-surface rounded-lg">
                <h4 className="text-sm font-medium text-content-primary mb-1">Notes:</h4>
                <p className="text-sm text-content-secondary">{session.notes}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
              <div>
                {/* Exercise count placeholder - will be implemented in batch 2-3 */}
                <span className="text-sm text-content-secondary">
                  Exercises: Coming in next batch
                </span>
              </div>
              
              <div className="flex space-x-2">
                {!isCompleted && (
                  <Button
                    onClick={handleStartSession}
                    size="sm"
                    className="bg-accent hover:bg-accent-dim"
                  >
                    {isStarted ? "Continue Session" : "Start Session"}
                  </Button>
                )}
                
                {isCompleted && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // TODO: View session details
                      console.log("View session details:", session.id);
                    }}
                  >
                    View Details
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}