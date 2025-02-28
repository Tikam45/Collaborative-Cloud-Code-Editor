
export type User = {
    id: string
    name: string
    email: string
    generations: number
    virtualbox: VirtualBox[]
    usersToVirtualboxes : UsersToVirtualboxes[]
}

export type VirtualBox = {
    id: string
    name: string
    type: "react" | "node"
    visibility: "public" | "private"
    userId: string
    usersToVirtualboxes: UsersToVirtualboxes[]
}

export type UsersToVirtualboxes = {
  userId: string,
  virtualboxId: string
}

export type SupabaseFiles = SupabaseFileData[];
  
export type SupabaseFileData = {
  name: string;
  id: string | null;
  updated_at: string | null;
  created_at: string | null;
  last_accessed_at: string | null;
  metadata: SupabaseFileMetadata | null;
};

export type SupabaseFileMetadata = {
  eTag: string;
  size: number;
  mimetype: string;
  cacheControl: string;
  lastModified: string;
  contentLength: number;
  httpStatusCode: number;
};
