"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { Terminal as TerminalIcon } from 'lucide-react';

interface TerminalProps {
  history: { command: string; output: React.ReactNode }[];
  onCommand: (command: string) => void;
  currentPath: string;
}

export function Terminal({ history, onCommand, currentPath }: TerminalProps) {
  const [input, setInput] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [history]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onCommand(input.trim());
      setInput("");
    }
  };

  const prompt = `user@commandeer:${currentPath === '/' ? '~' : currentPath}$`;

  return (
    <div className="h-full flex flex-col bg-card border border-border rounded-lg" onClick={() => inputRef.current?.focus()}>
      <div className="flex-shrink-0 p-2 border-b border-border flex items-center gap-2">
        <TerminalIcon className="h-4 w-4" />
        <h3 className="text-sm font-semibold">Terminal</h3>
      </div>
      <ScrollArea className="flex-grow p-2" ref={scrollAreaRef}>
        <div className="text-sm font-mono">
          {history.map((entry, index) => (
            <div key={index}>
              {entry.command && (
                <div className="flex">
                  <span className="text-accent">{prompt}</span>
                  <span className="ml-2">{entry.command}</span>
                </div>
              )}
              {entry.output && <div className="text-foreground whitespace-pre-wrap">{entry.output}</div>}
            </div>
          ))}
        </div>
      </ScrollArea>
      <form onSubmit={handleSubmit} className="flex-shrink-0 p-2 border-t border-border flex items-center">
        <span className="text-sm font-mono text-accent mr-2">{prompt}</span>
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 h-auto p-0 text-sm font-mono"
          autoComplete="off"
        />
      </form>
    </div>
  );
}
