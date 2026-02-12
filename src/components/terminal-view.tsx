"use client";

import * as React from "react";
import { 
    Bug, 
    Bot, 
    ServerCrash, 
    PowerOff,
    Play,
    Pause,
    Users,
    Network,
    Fingerprint,
    Timer,
    Hash,
    Calendar as CalendarIcon,
    FilterX,
} from "lucide-react";
import { format, isSameDay } from "date-fns";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";

type ServerStatus = "running" | "paused" | "stopped";

type LogEntry = {
  id: number;
  type: "INFO" | "REQUEST" | "RESPONSE" | "ERROR" | "HEALTH";
  timestamp: Date;
  message: string;
  ip?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path?: string;
  statusCode?: number;
  responseTime?: number; // in ms
  userAgent?: string;
};

type ActiveUser = {
  id: string;
  ip: string;
  userAgent: string;
  location: string;
  lastActivity: string;
};

const mockUsers: ActiveUser[] = [
    { id: 'user-1', ip: '198.51.100.24', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ...', location: 'New York, USA', lastActivity: 'GET /api/data' },
    { id: 'user-2', ip: '203.0.113.15', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ...', location: 'London, UK', lastActivity: 'POST /api/auth' },
    { id: 'user-3', ip: '192.0.2.88', userAgent: 'Mozilla/5.0 (Linux; Android 13) ...', location: 'Tokyo, JP', lastActivity: 'GET /api/feed' },
    { id: 'user-4', ip: '203.0.113.42', userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) ...', location: 'Sydney, AU', lastActivity: 'GET /' },
    { id: 'user-5', ip: '198.51.100.9', userAgent: 'curl/7.64.1', location: 'Unknown', lastActivity: 'GET /api/health' },
];

const mockLogs: Omit<LogEntry, 'id' | 'timestamp'>[] = [
    { type: 'INFO', message: 'Starting server...' },
    { type: 'INFO', message: 'Listening on port 8080' },
    { type: 'REQUEST', method: 'GET', path: '/api/users', ip: '198.51.100.24', userAgent: 'Mozilla/5.0...', message:'' },
    { type: 'RESPONSE', statusCode: 200, responseTime: 54, message: '{ "count": 2, "users": [...] }' },
    { type: 'REQUEST', method: 'POST', path: '/api/data', ip: '203.0.113.15', userAgent: 'Mozilla/5.0...', message:'' },
    { type: 'RESPONSE', statusCode: 201, responseTime: 120, message: '{ "id": "xyz", "status": "ok" }' },
    { type: 'REQUEST', method: 'GET', path: '/', ip: '198.51.100.24', userAgent: 'Mozilla/5.0...', message:'' },
    { type: 'RESPONSE', statusCode: 200, responseTime: 25, message: 'HTML content' },
    { type: 'REQUEST', method: 'GET', path: '/api/feed', ip: '192.0.2.88', userAgent: 'Mozilla/5.0...', message:'' },
    { type: 'RESPONSE', statusCode: 200, responseTime: 250, message: 'Feed data' },
    { type: 'REQUEST', method: 'GET', path: '/img/logo.png', ip: '198.51.100.24', userAgent: 'Mozilla/5.0...', message:'' },
    { type: 'RESPONSE', statusCode: 200, responseTime: 15, message: 'Image data' },
    { type: 'REQUEST', method: 'POST', path: '/api/auth', ip: '203.0.113.15', userAgent: 'Mozilla/5.0...', message:'' },
    { type: 'RESPONSE', statusCode: 401, responseTime: 90, message: 'Unauthorized' },
    { type: 'ERROR', message: 'Failed to connect to database: Connection refused' },
    { type: 'INFO', message: 'Reconnecting to database... Attempt 1' },
    { type: 'REQUEST', method: 'GET', path: '/api/health', ip: '203.0.113.42', userAgent: 'curl/7.64.1', message:'' },
    { type: 'RESPONSE', statusCode: 200, responseTime: 5, message: 'OK' },
    { type: 'HEALTH', message: 'Health check PASSED. System is nominal.' },
];

const ServerStatusIndicator = ({ status }: { status: ServerStatus }) => {
    const statusConfig = {
        running: { color: "bg-green-500", ping: "bg-green-400", text: "Server is Running" },
        paused: { color: "bg-yellow-500", ping: "bg-yellow-400", text: "Server is Paused" },
        stopped: { color: "bg-red-500", ping: "", text: "Server is Stopped" },
    }
    const config = statusConfig[status];

  return (
    <div className="flex items-center gap-2">
      <div className="relative h-4 w-4">
          <div
              className={cn(
                  "absolute h-3 w-3 rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
                  config.color
              )}
          />
          {status === 'running' && (
              <div className="absolute h-4 w-4 rounded-full animate-ping bg-green-400" />
          )}
      </div>
      <span className={cn("text-sm", status === 'running' && 'text-green-400',  status === 'paused' && 'text-yellow-400', status === 'stopped' && 'text-red-400')}>
        {config.text}
      </span>
    </div>
  );
};

const UptimeTimer = ({ startTime, isRunning }: { startTime: Date | null, isRunning: boolean }) => {
  const [uptime, setUptime] = React.useState("00:00:00");

  React.useEffect(() => {
    if(!startTime || !isRunning) {
        if (uptime !== "00:00:00") setUptime("00:00:00");
        return;
    };
    const interval = setInterval(() => {
      const now = new Date();
      const diff = now.getTime() - startTime.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60)).toString().padStart(2, '0');
      const minutes = Math.floor((diff / (1000 * 60)) % 60).toString().padStart(2, '0');
      const seconds = Math.floor((diff / 1000) % 60).toString().padStart(2, '0');
      setUptime(`${hours}:${minutes}:${seconds}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, isRunning]);

  return <span className="font-mono text-sm text-muted-foreground">Uptime: {uptime}</span>;
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
        case 'INFO': return <Bot className="w-4 h-4 mr-3 shrink-0"/>;
        case 'ERROR': return <ServerCrash className="w-4 h-4 mr-3 shrink-0"/>;
        case 'HEALTH': return <Bug className="w-4 h-4 mr-3 shrink-0"/>;
        default: return <div className="w-4 h-4 mr-3 shrink-0" />;
    }
}

const LogLine = ({ log }: { log: LogEntry }) => {
    const renderLogDetails = () => {
        switch(log.type) {
            case 'REQUEST': return (
                <div className="flex items-center gap-4 text-xs">
                    <Badge variant="outline">{log.method}</Badge>
                    <span className="text-gray-400">{log.path}</span>
                    <div className="flex items-center gap-2 text-gray-500">
                        <Network size={14} />
                        <span>{log.ip}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500 truncate">
                        <Fingerprint size={14} />
                        <span className="truncate">{log.userAgent}</span>
                    </div>
                </div>
            );
            case 'RESPONSE': return (
                <div className="flex items-center gap-4 text-xs">
                    <Badge variant={log.statusCode && log.statusCode >= 400 ? "destructive" : "secondary"}>
                        <Hash size={12} className="mr-1"/> {log.statusCode}
                    </Badge>
                     <div className="flex items-center gap-2 text-gray-500">
                        <Timer size={14} />
                        <span>{log.responseTime}ms</span>
                    </div>
                    <span className="text-gray-400 truncate flex-1">{log.message}</span>
                </div>
            )
            default:
                return <span className="break-words whitespace-pre-wrap">{log.message}</span>
        }
    }
    return (
        <div className="flex items-start">
            <span className="text-gray-500 w-20 shrink-0">{log.timestamp.toLocaleTimeString()}</span>
            <span className={cn("font-bold w-24 shrink-0 flex items-center", getLogStyle(log.type))}>
                {getLogIcon(log.type)}
                [{log.type}]
            </span>
            <div className="flex-1">
                {renderLogDetails()}
            </div>
        </div>
    )
}

const UserActivityDialog = ({ user, logs, onClose }: { user: ActiveUser | null; logs: LogEntry[]; onClose: () => void }) => {
    const [urlFilter, setUrlFilter] = React.useState("");
    const [dateFilter, setDateFilter] = React.useState<Date | undefined>();

    const requestLogs = React.useMemo(() => {
        if (!user) return [];

        let pairedLogs: (LogEntry & { response?: LogEntry })[] = [];
        for (let i = 0; i < logs.length; i++) {
            const log = logs[i];
            if (log.type === 'REQUEST' && log.ip === user.ip) {
                const pairedLog: LogEntry & { response?: LogEntry } = { ...log };
                if (i + 1 < logs.length && logs[i + 1].type === 'RESPONSE') {
                    pairedLog.response = logs[i + 1];
                }
                pairedLogs.push(pairedLog);
            }
        }
        
        const filtered = pairedLogs.filter(log => {
            const urlMatch = log.path ? log.path.toLowerCase().includes(urlFilter.toLowerCase()) : true;
            const dateMatch = dateFilter ? isSameDay(log.timestamp, dateFilter) : true;
            return urlMatch && dateMatch;
        });

        return filtered.reverse();
    }, [user, logs, urlFilter, dateFilter]);
    
    const clearFilters = () => {
        setUrlFilter("");
        setDateFilter(undefined);
    }

    if (!user) return null;

    return (
        <Dialog open={!!user} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col sm:max-w-5xl">
                <DialogHeader>
                    <DialogTitle>User Activity: {user.ip}</DialogTitle>
                    <DialogDescription>
                        {user.location} &middot; {user.userAgent}
                    </DialogDescription>
                </DialogHeader>
                <div className="flex items-center gap-2 py-4 border-b border-zinc-800">
                     <Input
                        placeholder="Filter by URL..."
                        value={urlFilter}
                        onChange={(e) => setUrlFilter(e.target.value)}
                        className="max-w-sm bg-zinc-900 border-zinc-700"
                    />
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant={"outline"} className={cn("w-[240px] justify-start text-left font-normal bg-zinc-900 border-zinc-700 hover:bg-zinc-800", !dateFilter && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateFilter ? format(dateFilter, "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={dateFilter}
                                onSelect={setDateFilter}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                    {(urlFilter || dateFilter) && <Button variant="ghost" onClick={clearFilters}><FilterX className="mr-2" />Clear Filters</Button>}
                </div>
                <div className="flex-1 overflow-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[180px]">Timestamp</TableHead>
                                <TableHead className="w-[100px]">Method</TableHead>
                                <TableHead>URL</TableHead>
                                <TableHead className="w-[100px]">Status</TableHead>
                                <TableHead className="w-[150px]">Response Time</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {requestLogs.length > 0 ? requestLogs.map(log => (
                                <TableRow key={log.id}>
                                    <TableCell>{format(log.timestamp, "yyyy-MM-dd HH:mm:ss")}</TableCell>
                                    <TableCell><Badge variant="outline">{log.method}</Badge></TableCell>
                                    <TableCell className="font-mono">{log.path}</TableCell>
                                    <TableCell>
                                        {log.response?.statusCode ? (
                                            <Badge variant={log.response.statusCode >= 400 ? "destructive" : "secondary"}>
                                                {log.response.statusCode}
                                            </Badge>
                                        ) : <span className="text-muted-foreground">-</span>}
                                    </TableCell>
                                    <TableCell>
                                        {log.response?.responseTime ? `${log.response.responseTime}ms` : <span className="text-muted-foreground">-</span>}
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">No requests found for this user or filter combination.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export function TerminalView() {
  const [logs, setLogs] = React.useState<LogEntry[]>([]);
  const [serverStatus, setServerStatus] = React.useState<ServerStatus>('running');
  const [startTime, setStartTime] = React.useState<Date | null>(null);
  const scrollEndRef = React.useRef<HTMLDivElement>(null);
  const [selectedUser, setSelectedUser] = React.useState<ActiveUser | null>(null);


  React.useEffect(() => {
    setLogs([{ id: Date.now(), type: 'INFO', message: 'Initializing terminal...', timestamp: new Date()}]);
    setStartTime(new Date());
  }, []);

  React.useEffect(() => {
    if (serverStatus !== 'running') return;

    const interval = setInterval(() => {
        const mockLog = mockLogs[Math.floor(Math.random() * mockLogs.length)];
        const newLog: LogEntry = {
            id: Date.now(),
            ...mockLog,
            timestamp: new Date(),
        };

        if (newLog.type === 'ERROR' && Math.random() > 0.8) {
            setServerStatus('stopped');
            setLogs((prev) => [...prev, newLog, {id: Date.now() + 1, type: 'ERROR', message: 'Critical error. Server has stopped.', timestamp: new Date()}].slice(-200));
        } else {
            setLogs((prev) => [...prev, newLog].slice(-200)); // Keep last 200 logs
        }
    }, 2000);

    return () => clearInterval(interval);
  }, [serverStatus]);

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
        timestamp: new Date(),
      },
    ]);
    if (!isHealthy && serverStatus !== 'stopped') {
        setServerStatus('stopped');
        setLogs(prev => [...prev, {id: Date.now() + 1, type: 'ERROR', message: 'Server stopped due to health check failure.', timestamp: new Date()}]);
    }
  };

  const handleServerControl = (action: ServerStatus) => {
    setServerStatus(action);
    if(action === 'running' && serverStatus !== 'running') {
        setLogs(prev => [...prev, {id: Date.now(), type: 'INFO', message: 'Server started.', timestamp: new Date()}]);
        setStartTime(new Date());
    } else if (action === 'paused') {
        setLogs(prev => [...prev, {id: Date.now(), type: 'INFO', message: 'Server paused. No new connections will be accepted.', timestamp: new Date()}]);
    } else if (action === 'stopped') {
        setLogs(prev => [...prev, {id: Date.now(), type: 'INFO', message: 'Server stopped.', timestamp: new Date()}]);
        setStartTime(null);
    }
  }
  
  const errorLogs = React.useMemo(() => logs.filter(log => log.type === 'ERROR'), [logs]);


  return (
    <>
      <div className="bg-black rounded-lg border border-zinc-800 shadow-2xl flex flex-col h-[700px] overflow-hidden">
        <div className="flex items-center justify-between p-3 bg-zinc-900/50 border-b border-zinc-800">
          <div className="flex items-center gap-4">
              <ServerStatusIndicator status={serverStatus} />
              {startTime && <UptimeTimer startTime={startTime} isRunning={serverStatus === 'running'} />}
          </div>
          <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleHealthCheck} disabled={serverStatus === 'stopped'}>
                  <Bug className="mr-2" /> Check Health
              </Button>
              {serverStatus === 'stopped' ? (
                  <Button size="sm" variant="ghost" onClick={() => handleServerControl('running')}>
                      <Play className="mr-2" /> Start Server
                  </Button>
              ) : (
                  <>
                  <Button size="sm" variant="ghost" onClick={() => handleServerControl(serverStatus === 'paused' ? 'running' : 'paused')}>
                      {serverStatus === 'paused' ? <Play className="mr-2"/> : <Pause className="mr-2"/>}
                      {serverStatus === 'paused' ? 'Resume' : 'Pause'}
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleServerControl('stopped')}>
                      <PowerOff className="mr-2"/> Stop
                  </Button>
                  </>
              )}
          </div>
        </div>

        <Tabs defaultValue="logs" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="px-3 border-b border-zinc-800 justify-start rounded-none bg-transparent">
              <TabsTrigger value="logs">Live Logs</TabsTrigger>
              <TabsTrigger value="errors">Errors <Badge variant="destructive" className="ml-2">{errorLogs.length}</Badge></TabsTrigger>
              <TabsTrigger value="users">Active Users <Badge variant="secondary" className="ml-2">{mockUsers.length}</Badge></TabsTrigger>
          </TabsList>
          <TabsContent value="logs" className="flex-1 overflow-hidden mt-0">
              <ScrollArea className="h-full">
                  <div className="p-4 font-mono text-sm text-gray-300 space-y-3">
                      {logs.map((log) => <LogLine key={log.id} log={log} />)}
                      <div ref={scrollEndRef} />
                  </div>
              </ScrollArea>
          </TabsContent>
          <TabsContent value="errors" className="flex-1 overflow-hidden mt-0">
              <ScrollArea className="h-full">
                  <div className="p-4 font-mono text-sm text-gray-300 space-y-3">
                      {errorLogs.length > 0 ? (
                          errorLogs.map((log) => <LogLine key={log.id} log={log} />)
                      ) : (
                          <div className="text-center text-gray-500 py-10">No errors detected.</div>
                      )}
                  </div>
              </ScrollArea>
          </TabsContent>
          <TabsContent value="users" className="flex-1 overflow-hidden mt-0">
              <ScrollArea className="h-full">
                  <div className="p-4 space-y-4">
                      {mockUsers.map(user => (
                          <button 
                            key={user.id} 
                            className="w-full text-left bg-zinc-900/50 p-3 rounded-md text-sm hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                            onClick={() => setSelectedUser(user)}
                            >
                              <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                      <Users size={16} className="text-gray-400" />
                                      <span className="font-bold text-white">{user.ip}</span>
                                      <Badge variant="outline">{user.location}</Badge>
                                  </div>
                                  <span className="text-xs text-gray-500">
                                      {user.lastActivity}
                                  </span>
                              </div>
                              <div className="text-xs text-gray-400 mt-2 pl-8 truncate">
                                  {user.userAgent}
                              </div>
                          </button>
                      ))}
                  </div>
              </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
      <UserActivityDialog user={selectedUser} logs={logs} onClose={() => setSelectedUser(null)} />
    </>
  );
}
