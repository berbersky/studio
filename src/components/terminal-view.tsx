"use client";

import * as React from "react";
import { Bug, Bot, ServerCrash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// Log entry type
type LogEntry = {
  id: number;
  type: "INFO" | "REQUEST" | "RESPONSE" | "ERROR" | "HEALTH";
  timestamp: string;
  message: string;
};

// Server status indicator component
const ServerStatusIndicator = ({ isOnline }: { isOnline: boolean }) => (
  <div className="flex items-center gap-2">
    <div className="relative h-4 w-4">
        <div
            className={cn(
                "absolute h-3 w-3 rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
                isOnline ? "bg-green-500" : "bg-red-500"
            )}
        />
        {isOnline && (
            <div className="absolute h-4 w-4 rounded-full animate-ping bg-green-400" />
        )}
    </div>
    <span className={cn("text-sm", isOnline ? "text-green-400" : "text-red-400")}>
      {isOnline ? "Server is Running" : "Server is Down"}
    </span>
  </div>
);

// Uptime timer component
const UptimeTimer = ({ startTime }: { startTime: Date }) => {
  const [uptime, setUptime] = React.useState("00:00:00");

  React.useEffect(() => {
    if(!startTime) return;
    const interval = setInterval(() => {
      const now = new Date();
      const diff = now.getTime() - startTime.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60)).toString().padStart(2, '0');
      const minutes = Math.floor((diff / (1000 * 60)) % 60).toString().padStart(2, '0');
      const seconds = Math.floor((diff / 1000) % 60).toString().padStart(2, '0');
      setUptime(`${hours}:${minutes}:${seconds}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  return <span className="font-mono text-sm text-muted-foreground">Uptime: {uptime}</span>;
};

const mockLogs: Omit<LogEntry, 'id' | 'timestamp'>[] = [
    { type: 'INFO', message: 'Starting server...' },
    { type: 'INFO', message: 'Listening on port 8080' },
    { type: 'REQUEST', message: 'GET /api/users' },
    { type: 'RESPONSE', message: '200 OK | { "count": 2, "users": [...] }' },
    { type: 'REQUEST', message: 'POST /api/data' },
    { type: 'RESPONSE', message: '201 Created | { "id": "xyz", "status": "ok" }' },
    { type: 'ERROR', message: 'Failed to connect to database: Connection refused' },
    { type: 'INFO', message: 'Reconnecting to database... Attempt 1' },
];

export function TerminalView() {
  const [logs, setLogs] = React.useState<LogEntry[]>([]);
  const [serverOnline, setServerOnline] = React.useState(true);
  const [startTime, setStartTime] = React.useState<Date | null>(null);
  const scrollEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setLogs([
        { id: Date.now(), type: 'INFO', message: 'Initializing terminal...', timestamp: new Date().toLocaleTimeString()},
    ]);
    setStartTime(new Date());
  }, []);

  React.useEffect(() => {
    if (!serverOnline) {
        return;
    }
    const interval = setInterval(() => {
        const mockLog = mockLogs[Math.floor(Math.random() * mockLogs.length)];
        const newLog: LogEntry = {
            id: Date.now(),
            ...mockLog,
            timestamp: new Date().toLocaleTimeString(),
        };

        if (newLog.type === 'ERROR' && Math.random() > 0.8) {
            setServerOnline(false);
            setLogs((prev) => [...prev, newLog, {id: Date.now() + 1, type: 'ERROR', message: 'Server has stopped responding.', timestamp: new Date().toLocaleTimeString()}].slice(-100));
        } else {
            setLogs((prev) => [...prev, newLog].slice(-100)); // Keep last 100 logs
        }
    }, 2000);

    return () => clearInterval(interval);
  }, [serverOnline]);

  React.useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const handleHealthCheck = () => {
    const isHealthy = Math.random() > 0.2;
    setLogs((prev) => [
      ...prev,
      {
        id: Date.now(),
        type: "HEALTH",
        message: isHealthy ? "Health check PASSED. System is nominal." : "Health check FAILED. High CPU usage detected.",
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
    if (!isHealthy) {
        if(serverOnline) setServerOnline(false);
    } else if (!serverOnline) {
        setServerOnline(true);
        setLogs(prev => [...prev, {id: Date.now() + 1, type: 'INFO', message: 'Server is back online.', timestamp: new Date().toLocaleTimeString()}]);
        setStartTime(new Date());
    }
  };

  const getLogStyle = (type: LogEntry['type']) => {
    switch(type) {
        case 'INFO': return 'text-blue-400';
        case 'REQUEST': return 'text-yellow-400';
        case 'RESPONSE': return 'text-purple-400';
        case 'ERROR': return 'text-red-500';
        case 'HEALTH': return 'text-green-400';
        default: return 'text-gray-400';
    }
  };

  const getLogIcon = (type: LogEntry['type']) => {
    switch(type) {
        case 'INFO': return <Bot className="w-4 h-4 mr-2 shrink-0"/>;
        case 'ERROR': return <ServerCrash className="w-4 h-4 mr-2 shrink-0"/>;
        case 'HEALTH': return <Bug className="w-4 h-4 mr-2 shrink-0"/>;
        default: return null;
    }
  }

  return (
    <div className="bg-black rounded-lg border border-zinc-800 shadow-2xl flex flex-col h-[600px] overflow-hidden">
      <div className="flex items-center justify-between p-3 bg-zinc-900/50 border-b border-zinc-800">
        <div className="flex items-center gap-4">
            <ServerStatusIndicator isOnline={serverOnline} />
            {serverOnline && startTime && <UptimeTimer startTime={startTime} />}
        </div>
        <Button size="sm" variant="outline" onClick={handleHealthCheck}>
          <Bug className="mr-2" />
          Check Health
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 font-mono text-sm text-gray-300 space-y-2">
            {logs.map((log) => (
                <div key={log.id} className="flex items-start">
                    <span className="text-gray-500 w-20 shrink-0">{log.timestamp}</span>
                    <span className={cn("font-bold w-24 shrink-0", getLogStyle(log.type))}>
                        [{log.type}]
                    </span>
                    <div className="flex-1 break-words whitespace-pre-wrap flex items-center">
                        {getLogIcon(log.type)}
                        <span>{log.message}</span>
                    </div>
                </div>
            ))}
            <div ref={scrollEndRef} />
        </div>
      </ScrollArea>
    </div>
  );
}
