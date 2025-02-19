"use client"

import { File, FilePlus, Folder, FolderPlus, Loader2, Search } from "lucide-react";
import Image from "next/image"
import {getIconForFile} from "vscode-icons-js"
import { TFile, TFolder } from "./types";
import SidebarFile from "./file";
import SidebarFolder from "./folder";
import { useState } from "react";
import New from "./new";
import { Socket } from "socket.io-client";


export default function Sidebar({files, selectFile, socket, addNew, handleDeletFolder, handleDeleteFile} : 
    {
        files : (TFile | TFolder)[]; 
        selectFile: (tab: TFile) => void,
        socket: Socket, 
        addNew: (name: string, type: "file" | "folder") =>void
        handleDeleteFile : (file: TFile) => void
        handleDeletFolder : (folder: TFolder) => void
    }){
    const [creatingNew, setCreatingNew] = useState<"file" | "folder" | null>(null)
    

    return <div className="h-full w-56 flex flex-col items-start p-2">
            <div className="flex w-full items-center justify-between h-8 mb-1">
                <div className="text-muted-foreground">Explorer</div>
                <div className="flex space-x-1">
                    <button onClick={() => setCreatingNew("file")} className="h-6 w-6 text-muted-foreground ml-0.5 flex items-center justify-center translate-x-1 transition-colors bg-transparent hover:bg-muted-foreground/25 cursor-pointer rounded-sm">
                        <FilePlus className="h-4 w-4"/>
                    </button>
                    <button onClick={() => setCreatingNew("folder")} className="h-6 w-6 text-muted-foreground ml-0.5 flex items-center justify-center translate-x-1 transition-colors bg-transparent hover:bg-muted-foreground/25 cursor-pointer rounded-sm">
                        <FolderPlus className="h-4 w-4" />
                    </button>
                    <div className="h-6 w-6 text-muted-foreground ml-0.5 flex items-center justify-center translate-x-1 transition-colors bg-transparent hover:bg-muted-foreground/25 cursor-pointer rounded-sm">
                        <Search className="w-4 h-4"/>
                    </div>
                </div>
            </div>
            <div className="w-full mt-1 flex flex-col">
                {files.length === 0 ? (
                    <div className="flex justify-center w-full">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                ) : (
                    files.map((child) =>
                    child.type === "file" ? (
                        <SidebarFile key={child.id} data={child} selectFile={selectFile} handleDeleteFile={handleDeleteFile}/>
                    ) : (
                        <SidebarFolder key={child.id} data={child} selectFile={selectFile} handleDeletFolder={handleDeletFolder} handleDeleteFile={handleDeleteFile} />
                    )
                    )
                )}
                {
                    creatingNew !== null ? (
                        <New type={creatingNew} stopEditing={() => setCreatingNew(null)} socket={socket} addNew={addNew}/>
                    ): null
                }
            </div>
        </div>
}