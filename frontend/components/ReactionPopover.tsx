"use client";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { ThumbsUp } from "lucide-react";
import React from "react";

const REACTION_TYPES = [
  { type: "like", label: "Like", icon: <ThumbsUp className="h-4 w-4" /> },
  { type: "love", label: "Love", icon: <span className="text-red-500">♥</span> },
  { type: "celebrate", label: "Celebrate", icon: <span>🎉</span> },
  { type: "insightful", label: "Insightful", icon: <span>💡</span> },
];

export default function ReactionPopover({
  selected,
  onReact,
  loading,
}: {
  selected?: string;
  onReact: (type: string) => void;
  loading?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const selectedReaction = REACTION_TYPES.find((r) => r.type === selected);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={selectedReaction ? "default" : "ghost"}
          size="sm"
          className={selectedReaction ? "bg-blue-100 text-blue-700" : "text-muted-foreground"}
          disabled={loading}
        >
          {selectedReaction ? selectedReaction.icon : <ThumbsUp className="h-4 w-4" />}
          <span className="text-xs ml-1">{selectedReaction ? selectedReaction.label : "React"}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="flex space-x-2 p-2" align="start" sideOffset={8}>
        {REACTION_TYPES.map((reaction) => (
          <Button
            key={reaction.type}
            variant={selected === reaction.type ? "default" : "ghost"}
            size="icon"
            className={selected === reaction.type ? "bg-blue-100 text-blue-700" : "text-muted-foreground"}
            onClick={() => {
              onReact(reaction.type);
              setOpen(false);
            }}
            disabled={loading}
            title={reaction.label}
          >
            {reaction.icon}
          </Button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
