"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Plus,
  ArrowUp,
  GraduationCap,
  Code,
  Coffee,
  Lightbulb,
  User,
  MicIcon,
  ArrowLeft,
  Wifi,
  WifiOff,
  AlertCircle,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialogV2";
import { Button } from "./ui/button";
import { atom, useAtom, useSetAtom } from "jotai";
import { cn } from "@/lib/utils";
import { useTheme } from "./theme-provider";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useAuth } from "@/contexts/AuthContext";

const chatPortAtom = atom(false);
const isTypingAtom = atom(false);

const AiTextBox = ({
  onSendMessage,
  disabled = false,
}: {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}) => {
  const [inputValue, setInputValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const {theme,setTheme} = useTheme()
  useEffect(()=>{
    setTheme("dark")
  },[theme])

  const handleSubmit = () => {
    if (!inputValue.trim() || disabled) return;
    onSendMessage(inputValue.trim());
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputValue]);

  return (
    <div className="relative bg-white/20 rounded-2xl border border-gray-700">
      <textarea
        ref={textareaRef}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="How can I help you today?"
        className="w-full px-6 py-4 bg-transparent text-white placeholder-gray-400 resize-none focus:outline-none text-lg"
        rows={1}
        style={{ minHeight: "60px" }}
        disabled={disabled}
      />

      {/* Bottom Bar */}
      <div className="flex items-center justify-end px-4 pb-4">
        <div className="flex items-center space-x-3">
          <button className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-600 transition-colors">
            <MicIcon className="w-4 h-4 text-gray-300" />
          </button>
          <button
            onClick={handleSubmit}
            disabled={!inputValue.trim() || disabled}
            className="w-8 h-8 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg flex items-center justify-center transition-colors"
          >
            <ArrowUp className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

const MessageBubble = ({
  type,
  content,
  timestamp,
  quickActions,
}: {
  type: "user" | "assistant" | "system" | "error";
  content: string;
  timestamp: number;
  quickActions?: Array<{
    id: string;
    title: string;
    description: string;
  }>;
}) => {
  const isUser = type === "user";
  const isSystem = type === "system";
  const isError = type === "error";
  
  return (
    <div
      className={`flex ${
        isUser ? "justify-end" : "justify-start"
      } mb-4 transition-all block animate-in fade-in-50 slide-in-from-bottom-4 duration-300`}
    >
      <div
        className={`max-w-xs px-4 py-2 rounded-lg text-sm ${
          isUser 
            ? "bg-blue-500 text-white" 
            : isSystem 
            ? "bg-green-600 text-white"
            : isError
            ? "bg-red-600 text-white"
            : "bg-gray-700 text-gray-200"
        }`}
      >
        {content}
        {quickActions && quickActions.length > 0 && (
          <div className="mt-2 space-y-1">
            {quickActions.map((action) => (
              <button
                key={action.id}
                className="block w-full text-left px-2 py-1 text-xs bg-white/20 hover:bg-white/30 rounded transition-colors"
              >
                <div className="font-medium">{action.title}</div>
                <div className="text-xs opacity-80">{action.description}</div>
              </button>
            ))}
          </div>
        )}
        <div className="text-xs mt-1 opacity-70">
          {new Date(timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
};

const ChatBoxPortal = () => {
  const { user } = useAuth();
  const { messages, isConnected, isConnecting, sendMessage, connectionError, reconnect } = useWebSocket(user?.id);
  const [portal, setPortal] = useAtom(chatPortAtom);
  const chatAreaRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatAreaRef.current?.scrollTo({
      top:
        (lastMessageRef.current!.offsetHeight +
          lastMessageRef.current!.offsetTop || 0) + 2000,
      behavior: "smooth",
    });
  }, [messages]);

  return (
    <Dialog
      open={portal}
      onOpenChange={(e) => {
        setPortal(e);
      }}
    >
      <DialogContent className="data-[state]:duration-0 max-w-6xl w-full min-h-full border-none rounded-2xl p-6 m-0">
        <DialogHeader className="h-fit">
          <DialogTitle className="text-2xl font-semibold text-gray-200">
            <div className="flex items-center gap-2">
              <div>
                <Button
                  variant="outline"
                  size={"icon"}
                  onClick={() => setPortal(false)}
                >
                  <ArrowLeft className="w-4 h-4 text-gray-300" />
                </Button>
              </div>
              <div className="transition-all block animate-in fade-in-50 slide-in-from-bottom-4 duration-300">
                LegalLink Chat
              </div>
              {/* Connection Status */}
              <div className="ml-auto flex items-center gap-2">
                {isConnecting ? (
                  <div className="flex items-center gap-1 text-yellow-400">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-400"></div>
                    <span className="text-xs">Connecting...</span>
                  </div>
                ) : isConnected ? (
                  <div className="flex items-center gap-1 text-green-400">
                    <Wifi className="w-3 h-3" />
                    <span className="text-xs">Connected</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-red-400">
                    <WifiOff className="w-3 h-3" />
                    <span className="text-xs">Disconnected</span>
                  </div>
                )}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>
          {/* Connection Error */}
        {connectionError && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between gap-2 text-red-400">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{connectionError}</span>
              </div>
              {!isConnecting && (
                <button
                  onClick={reconnect}
                  className="px-3 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
                >
                  Retry
                </button>
              )}
            </div>
          </div>
        )}
        
        <div className="flex flex-col space-y-4 min-h-full h-[calc(100vh-100px)]">
          <div
            className="grow block overflow-y-auto custom-scrollbar-dark"
            ref={chatAreaRef}
          >
            {messages.map((message, index) => (
              <MessageBubble {...message} key={index} />
            ))}
            <div ref={lastMessageRef} />
          </div>
          <div
            className={cn(
              "flex-shrink-0 transition-all block animate-in fade-in-50 slide-in-from-top-16 duration-300"
            )}
          >
            <AiTextBox
              onSendMessage={sendMessage}
              disabled={!isConnected}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const ChatBox = () => {
  const [should_move, setShouldMove] = useState(false);  const [portal, setPortal] = useAtom(chatPortAtom);
  const { user } = useAuth();
  const { sendMessage, isConnected, connectionError, reconnect } = useWebSocket(user?.id);

  const quickActions = [
    { icon: GraduationCap, label: "Civil Laws", color: "text-gray-400" },
    { icon: User, label: "Consumer Rights", color: "text-gray-400" },
    { icon: Coffee, label: "Criminal Laws", color: "text-gray-400" },
    { icon: Lightbulb, label: "General Queries", color: "text-gray-400" },
    { icon: Code, label: "Others", color: "text-gray-400" },
  ];

  const handleQuickAction = (label: string) => {
    const message = `I need help with ${label.toLowerCase()}`;
    sendMessage(message);
    setShouldMove(true);
  };

  const handleInitialMessage = (message: string) => {
    if (message.trim()) {
      sendMessage(message);
    }
    setShouldMove(true);
  };

  useEffect(() => {
    if (should_move) {
      const timer = setTimeout(() => {
        setPortal(true);
      }, 200);
      return () => clearTimeout(timer); // Cleanup on unmount or re-render
    }
  }, [should_move]);

  useEffect(() => {
    if (!portal) {
      setShouldMove(false);
    }
  }, [portal]);

  return (
    <div className="flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="max-w-4xl w-full flex flex-col gap-8">
          {/* Welcome Message */}
          <div
            className={cn(
              "text-center transition-all duration-500",
              should_move && "-translate-y-16 opacity-0"
            )}
          >
            <div className="flex items-center justify-center">
              <div className="w-8 h-8 mr-3">
                <svg
                  viewBox="0 0 24 24"
                  className="w-full h-full text-orange-500"
                >
                  <path
                    fill="currentColor"
                    d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                  />
                </svg>
              </div>
              <h1 className="text-4xl font-normal text-gray-200">
                Hello folks, Welcome to LegalLink
              </h1>
            </div>          </div>

          {/* Connection Status */}
          {connectionError && (
            <div
              className={cn(
                "transition-all duration-500",
                should_move && "translate-y-1/2 opacity-0"
              )}
            >
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-red-400">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">{connectionError}</span>
                </div>
              </div>
            </div>
          )}

          {/* Input Container */}
          <div
            className={cn(
              "transition-all duration-500",
              should_move && "translate-y-1/2 opacity-0"
            )}
          >
            <AiTextBox
              onSendMessage={handleInitialMessage}
              disabled={!isConnected}
            />
          </div>

          {/* Quick Actions */}
          <div
            className={cn(
              "flex flex-wrap items-center justify-center gap-3 transition-all duration-500",
              should_move && "translate-y-16 opacity-0"
            )}
          >
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleQuickAction(action.label)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-full border border-gray-700 transition-colors"
              >
                <action.icon className={`w-4 h-4 ${action.color}`} />
                <span className="text-sm text-gray-300">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
        <ChatBoxPortal />
      </div>
    </div>
  );
};
