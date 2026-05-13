"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getMilestoneDefinition, type MilestoneDefinition } from "@/lib/milestone-utils";

interface MilestoneCardProps {
  milestoneKey: string;
  isAchieved: boolean;
  achievedAt?: string;
  showAnimation?: boolean;
  className?: string;
}

function formatAchievedDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function getCategoryColor(category: MilestoneDefinition['category']) {
  switch (category) {
    case "consistency":
      return "border-blue-500/30 bg-blue-500/5";
    case "strength": 
      return "border-red-500/30 bg-red-500/5";
    case "progress":
      return "border-green-500/30 bg-green-500/5";
    case "completion":
      return "border-purple-500/30 bg-purple-500/5";
    default:
      return "border-border-subtle bg-bg-surface";
  }
}

export default function MilestoneCard({ 
  milestoneKey, 
  isAchieved, 
  achievedAt, 
  showAnimation = false,
  className 
}: MilestoneCardProps) {
  const definition = getMilestoneDefinition(milestoneKey);
  
  if (!definition) {
    return null;
  }

  const categoryColor = getCategoryColor(definition.category);

  const cardContent = (
    <Card className={cn(
      "transition-all duration-200",
      isAchieved 
        ? cn("border-success bg-success/5", categoryColor)
        : "border-border-subtle bg-bg-surface opacity-60",
      className
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn(
            "text-2xl flex-shrink-0 transition-all duration-200",
            isAchieved ? "grayscale-0 scale-110" : "grayscale opacity-50"
          )}>
            {definition.icon}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={cn(
                "font-semibold text-sm",
                isAchieved ? "text-content-primary" : "text-content-muted"
              )}>
                {definition.title}
              </h3>
              {isAchieved && (
                <span className="text-xs text-success">✓</span>
              )}
            </div>
            
            <p className={cn(
              "text-xs leading-relaxed",
              isAchieved ? "text-content-secondary" : "text-content-muted"
            )}>
              {definition.description}
            </p>
            
            {isAchieved && achievedAt && (
              <p className="text-xs text-success mt-1">
                {formatAchievedDate(achievedAt)}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (showAnimation && isAchieved) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          type: "spring", 
          stiffness: 200, 
          damping: 20,
          delay: 0.1 
        }}
      >
        <motion.div
          animate={{
            boxShadow: [
              "0 0 0px rgba(34, 197, 94, 0)",
              "0 0 20px rgba(34, 197, 94, 0.3)",
              "0 0 0px rgba(34, 197, 94, 0)"
            ]
          }}
          transition={{
            duration: 2,
            repeat: 2,
            ease: "easeInOut"
          }}
        >
          {cardContent}
        </motion.div>
      </motion.div>
    );
  }

  return cardContent;
}