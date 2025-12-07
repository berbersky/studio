import type { Group, Connection } from "@/lib/types";

export const INITIAL_GROUPS: Group[] = [
  { id: "ungrouped", name: "Ungrouped" },
  { id: "prod", name: "Production Servers" },
  { id: "staging", name: "Staging Environment" },
];

export const INITIAL_CONNECTIONS: Connection[] = [
  {
    id: "conn-1",
    name: "Main Web Server",
    ip: "192.168.1.10",
    username: "prod-admin",
    password: "password123",
    notes: "Main Nginx server for the web cluster. Restart with caution.",
    groupId: "prod",
  },
  {
    id: "conn-2",
    name: "Primary Database",
    ip: "10.0.0.5",
    username: "db_manager",
    password: "password123",
    groupId: "prod",
  },
  {
    id: "conn-3",
    name: "Staging API",
    ip: "192.168.2.20",
    username: "staging-dev",
    password: "password123",
    notes: "Test new API endpoints here before deploying to production.",
    groupId: "staging",
  },
  {
    id: "conn-4",
    name: "Local Test Machine",
    ip: "127.0.0.1",
    username: "localadmin",
    password: "password123",
    groupId: "ungrouped",
  },
];
