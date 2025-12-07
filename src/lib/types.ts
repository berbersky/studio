export interface Connection {
    id: string;
    name: string;
    ip: string;
    username: string;
    password?: string;
    notes?: string;
    groupId: string;
  }
  
  export interface Group {
    id:string;
    name: string;
  }
  