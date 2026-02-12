"use client";

import * as React from "react";
import {
  Server,
  User,
  KeyRound,
  Plus,
  MoreVertical,
  FolderPlus,
  Trash2,
  Edit,
  Folder,
  MonitorPlay,
  NotebookText,
  ChevronRight,
} from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { AnimatePresence, motion } from "framer-motion";

import type { Connection, Group } from "@/lib/types";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { INITIAL_GROUPS, INITIAL_CONNECTIONS } from "@/data/mock-data";
import { RemoteIcon } from "@/components/icons";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarFooter,
  SidebarTrigger,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { TerminalView } from "@/components/terminal-view";

const connectionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  ip: z.string().min(1, "IP Address is required"),
  username: z.string().min(1, "Username is required"),
  password: z.string().optional(),
  notes: z.string().optional(),
});

const groupSchema = z.object({
  name: z.string().min(1, "Group name is required"),
});

type ServerStatus = "running" | "paused" | "stopped";

export default function Home() {
  const { toast } = useToast();
  const [groups, setGroups] = useLocalStorage<Group[]>(
    "remote-commander-groups",
    INITIAL_GROUPS
  );
  const [connections, setConnections] = useLocalStorage<Connection[]>(
    "remote-commander-connections",
    INITIAL_CONNECTIONS
  );
  const [selectedConnectionId, setSelectedConnectionId] = React.useState<
    string | null
  >(null);

  const [currentConnectionStatus, setCurrentConnectionStatus] = React.useState<ServerStatus>("stopped");

  React.useEffect(() => {
    if (selectedConnectionId) {
      setCurrentConnectionStatus("stopped");
    }
  }, [selectedConnectionId]);


  const [dialogState, setDialogState] = React.useState<{
    type: "add" | "edit" | "addGroup" | "delete" | "deleteGroup" | null;
    data?: Connection | Group;
  }>({ type: null });

  const selectedConnection = React.useMemo(
    () => connections.find((c) => c.id === selectedConnectionId) || null,
    [connections, selectedConnectionId]
  );

  const form = useForm<z.infer<typeof connectionSchema>>({
    resolver: zodResolver(connectionSchema),
    defaultValues: { name: "", ip: "", username: "", password: "", notes: "" },
  });

  const groupForm = useForm<z.infer<typeof groupSchema>>({
    resolver: zodResolver(groupSchema),
    defaultValues: { name: "" },
  });

  React.useEffect(() => {
    if (dialogState.type === "edit" && dialogState.data) {
      const conn = dialogState.data as Connection;
      form.reset({
        name: conn.name,
        ip: conn.ip,
        username: conn.username,
        password: conn.password || "",
        notes: conn.notes || "",
      });
    } else if (dialogState.type === "add") {
      form.reset({ name: "", ip: "", username: "", password: "", notes: "" });
    }
  }, [dialogState, form]);

  const handleOpenDialog = (
    type: "add" | "edit" | "addGroup" | "delete" | "deleteGroup",
    data?: Connection | Group
  ) => {
    setDialogState({ type, data });
  };
  
  const handleCloseDialog = () => setDialogState({ type: null });

  const handleAddOrUpdateConnection = (values: z.infer<typeof connectionSchema>) => {
    if (dialogState.type === "add") {
      const newConnection: Connection = {
        id: crypto.randomUUID(),
        ...values,
        groupId: "ungrouped",
      };
      setConnections([...connections, newConnection]);
      toast({ title: "Success", description: "Connection added." });
    } else if (dialogState.type === "edit" && dialogState.data) {
      setConnections(
        connections.map((c) =>
          c.id === dialogState.data!.id ? { ...c, ...values } : c
        )
      );
      toast({ title: "Success", description: "Connection updated." });
    }
    handleCloseDialog();
  };
  
  const handleDeleteConnection = () => {
    if (dialogState.type === "delete" && dialogState.data) {
      setConnections(connections.filter((c) => c.id !== dialogState.data!.id));
      if (selectedConnectionId === dialogState.data!.id) {
        setSelectedConnectionId(null);
      }
      toast({ title: "Success", description: "Connection deleted." });
    }
    handleCloseDialog();
  };
  
  const handleAddGroup = (values: z.infer<typeof groupSchema>) => {
    const newGroup: Group = {
      id: crypto.randomUUID(),
      name: values.name,
    };
    setGroups([...groups, newGroup]);
    toast({ title: "Success", description: "Group created." });
    handleCloseDialog();
    groupForm.reset();
  };
  
  const handleMoveConnection = (connectionId: string, newGroupId: string) => {
    setConnections(
      connections.map((c) =>
        c.id === connectionId ? { ...c, groupId: newGroupId } : c
      )
    );
    toast({ title: "Success", description: "Connection moved." });
  };
  
  const launchSession = (connection: Connection) => {
    toast({
      title: `Launching ${connection.name}`,
      description: `Connecting to ${connection.ip}...`,
    });
    setCurrentConnectionStatus('running');
  };

  const isAddOrEdit = dialogState.type === "add" || dialogState.type === "edit";

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <RemoteIcon className="w-8 h-8 text-primary" />
            <h1 className="text-xl font-semibold">Remote Commander</h1>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <ScrollArea className="h-full">
            {groups.map((group) => {
              const groupConnections = connections.filter(
                (c) => c.groupId === group.id
              );
              return (
                <SidebarGroup key={group.id}>
                  <SidebarGroupLabel className="flex items-center">
                    <Folder className="mr-2" />
                    <span>{group.name}</span>
                  </SidebarGroupLabel>
                  <SidebarMenu>
                    {groupConnections.map((conn) => (
                      <SidebarMenuItem key={conn.id}>
                        <SidebarMenuButton
                          onClick={() => setSelectedConnectionId(conn.id)}
                          isActive={selectedConnectionId === conn.id}
                          className="justify-start"
                        >
                          <Server />
                          <span>{conn.name}</span>
                        </SidebarMenuButton>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem
                              onSelect={() => handleOpenDialog("edit", conn)}
                            >
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger>
                                <ChevronRight className="mr-2 h-4 w-4" /> Move to
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                {groups
                                  .filter((g) => g.id !== group.id)
                                  .map((g) => (
                                    <DropdownMenuItem
                                      key={g.id}
                                      onSelect={() =>
                                        handleMoveConnection(conn.id, g.id)
                                      }
                                    >
                                      <Folder className="mr-2 h-4 w-4" />
                                      {g.name}
                                    </DropdownMenuItem>
                                  ))}
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive-foreground focus:bg-destructive"
                              onSelect={() => handleOpenDialog("delete", conn)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroup>
              );
            })}
          </ScrollArea>
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => handleOpenDialog("add")}
          >
            <Plus className="mr-2" /> Add Connection
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => handleOpenDialog("addGroup")}
          >
            <FolderPlus className="mr-2" /> Add Group
          </Button>
        </SidebarFooter>
      </Sidebar>
      
      <SidebarInset className="p-4 md:p-6">
        <div className="md:hidden mb-4 flex items-center gap-2">
            <SidebarTrigger />
            <h2 className="text-lg font-semibold">Remote Commander</h2>
        </div>
        <AnimatePresence mode="wait">
          {selectedConnection ? (
            <motion.div
              key={selectedConnection.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-3xl font-bold tracking-tight">
                  {selectedConnection.name}
                </h2>
                <Button 
                  onClick={() => launchSession(selectedConnection)}
                  disabled={currentConnectionStatus === 'running' || currentConnectionStatus === 'paused'}
                >
                  <MonitorPlay className="mr-2" /> Launch Session
                </Button>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Server /> Connection Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div className="flex">
                      <span className="w-24 text-muted-foreground">IP</span>
                      <span className="font-mono">{selectedConnection.ip}</span>
                    </div>
                    <div className="flex">
                      <span className="w-24 text-muted-foreground">User</span>
                      <span>{selectedConnection.username}</span>
                    </div>
                    <div className="flex items-center">
                        <span className="w-24 text-muted-foreground">Password</span>
                        <span className="font-mono flex items-center gap-2">
                            {selectedConnection.password ? '••••••••' : <span className="text-muted-foreground italic">Not set</span>}
                        </span>
                    </div>
                  </CardContent>
                </Card>
                {selectedConnection.notes && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <NotebookText /> Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{selectedConnection.notes}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
              <TerminalView 
                status={currentConnectionStatus} 
                onStatusChange={setCurrentConnectionStatus} 
              />
            </motion.div>
          ) : (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center justify-center h-full text-center"
            >
                <RemoteIcon className="w-24 h-24 text-muted-foreground/50" />
                <h3 className="mt-4 text-xl font-semibold">Welcome to Remote Commander</h3>
                <p className="mt-2 text-muted-foreground">Select a connection to view its details or add a new one to get started.</p>
                <Button className="mt-6" onClick={() => handleOpenDialog("add")}>
                    <Plus className="mr-2" /> Add Your First Connection
                </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </SidebarInset>
      
      {/* DIALOGS */}
      <Dialog open={isAddOrEdit} onOpenChange={handleCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogState.type === 'edit' ? 'Edit Connection' : 'Add New Connection'}</DialogTitle>
            <DialogDescription>
              {dialogState.type === 'edit' ? 'Update the details for your connection.' : 'Enter the details for your new remote connection.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddOrUpdateConnection)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Connection Name</FormLabel>
                    <FormControl><Input placeholder="My Web Server" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="ip"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IP Address</FormLabel>
                      <FormControl><Input placeholder="192.168.1.100" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl><Input placeholder="admin" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl><Input type="password" placeholder="Leave blank to enter on connect" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl><Textarea placeholder="Any notes about this server..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={handleCloseDialog}>Cancel</Button>
                <Button type="submit">Save Connection</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogState.type === 'addGroup'} onOpenChange={handleCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Group</DialogTitle>
          </DialogHeader>
          <Form {...groupForm}>
            <form onSubmit={groupForm.handleSubmit(handleAddGroup)} className="space-y-4">
              <FormField
                control={groupForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Group Name</FormLabel>
                    <FormControl><Input placeholder="e.g. Production Servers" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={handleCloseDialog}>Cancel</Button>
                <Button type="submit">Create Group</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={dialogState.type === 'delete'} onOpenChange={handleCloseDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the connection for <span className="font-semibold">"{ (dialogState.data as Connection)?.name }"</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConnection} className={buttonVariants({variant: "destructive"})}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </SidebarProvider>
  );
}
