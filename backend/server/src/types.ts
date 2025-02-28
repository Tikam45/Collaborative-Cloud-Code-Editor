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


export type TFolder = {
    id: string
    type: "folder"
    name: string
    children: (TFolder | TFile)[]
};

export type TFile = {
    id: string
    type: "file"
    name: string
}


export type TFileData = {
    id: string
    data : string
}

export type SupabaseFileBody = SupabaseFileData & {
    body: ReadableStream
    bodyUsed: boolean
    arrayBuffer : Promise<ArrayBuffer>
    text: Promise<string>
    json: Promise<any>
    blob: Promise<Blob>
}

export type Virtualbox ={
    id: string,
    name: string,
    type: "react" | "node"
    userId: string,
    usersToVirtualboxes: UsersToVirtualboxes[];
}

export type User = {
    id: string
    name: string
    email: string
    virtualbox: Virtualbox[]
    generations: number
    usersToVirtualboxes:UsersToVirtualboxes[]
}

export type UsersToVirtualboxes = {
    userId: string,
    virtualboxId: string
}