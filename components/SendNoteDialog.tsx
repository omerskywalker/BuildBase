"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription,
  DialogFooter,
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MessageSquare, Send } from "lucide-react";

interface SendNoteDialogProps {
  clientId: string;
  clientName: string;
  onNoteSent?: () => void;
}

export default function SendNoteDialog({ 
  clientId, 
  clientName,
  onNoteSent 
}: SendNoteDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSend = async () => {
    if (!message.trim()) {
      setError("Message cannot be empty");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/coach/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message.trim(),
          userId: clientId,
        }),
      });

      if (response.ok) {
        setMessage("");
        setIsOpen(false);
        onNoteSent?.();
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to send note");
      }
    } catch (err) {
      setError("Network error - please try again");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setMessage("");
    setError("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (open) {
        setIsOpen(true);
      } else {
        handleClose();
      }
    }}>
      <DialogTrigger>
        <Button
          style={{
            backgroundColor: "#C84B1A",
            color: "#FEFCF8",
            borderColor: "#C84B1A",
          }}
          className="flex items-center gap-2 hover:opacity-90"
        >
          <MessageSquare className="w-4 h-4" />
          Send Note
        </Button>
      </DialogTrigger>
      
      <DialogContent 
        className="sm:max-w-md"
        style={{ backgroundColor: "#E8DECE", borderColor: "#B5A68C" }}
      >
        <DialogHeader>
          <DialogTitle style={{ color: "#2C1A10", fontSize: 18, fontWeight: 600 }}>
            Send Note to {clientName}
          </DialogTitle>
          <DialogDescription style={{ color: "#6B5A48", fontSize: 14 }}>
            Send a message to your client. They&apos;ll see it on their dashboard and in their notes history.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label 
              htmlFor="message" 
              style={{ color: "#2C1A10", fontSize: 14, fontWeight: 600 }}
            >
              Message
            </Label>
            <Textarea
              id="message"
              placeholder="Enter your message for the client..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full min-h-[120px] resize-none"
              maxLength={500}
              disabled={isLoading}
            />
            <div className="flex justify-between items-center text-xs">
              <span style={{ color: "#988A78" }}>
                {message.length}/500 characters
              </span>
              {error && (
                <span style={{ color: "#B83020" }}>
                  {error}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            style={{
              backgroundColor: "transparent",
              borderColor: "#B5A68C",
              color: "#6B5A48",
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={isLoading || !message.trim()}
            style={{
              backgroundColor: "#C84B1A",
              color: "#FEFCF8",
              borderColor: "#C84B1A",
            }}
            className="flex items-center gap-2 hover:opacity-90"
          >
            {isLoading ? (
              <>
                <div 
                  className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
                  aria-hidden="true"
                />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Note
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}