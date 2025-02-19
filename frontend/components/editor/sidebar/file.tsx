
"use client"

import { TFile } from "./types";
import { File, FilePlus, Folder, FolderPlus, Loader2, Pencil, Search, Trash2 } from "lucide-react";
import Image from "next/image"
import { useState } from "react";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import {getIconForFile} from "vscode-icons-js"

export default function SidebarFile({data, selectFile, handleDeleteFile}: {
    data: TFile;
    selectFile: ((tab: TFile) => void)
    handleDeleteFile : ((file: TFile) => void);
}){
    const [imgSrc, setImgSrc] = useState(`/icons/${getIconForFile(data.name)}`)
    const [pendingDelete , setPendingDelete] = useState(false);
    return(
        <ContextMenu>
            <ContextMenuTrigger disabled={pendingDelete} onClick={() =>{
                if(!pendingDelete) selectFile({...data});
            }} className=" data-[state=open]:bg-secondary/50
            w-full flex items-center h-7 px-1 hover:bg-secondary rounded-sm cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-ring">
                <Image src={imgSrc} alt="File icon" width={18} height={18} className="mr-2" onError={() => setImgSrc("/icons/default_file.svg")}/>
                {pendingDelete ? (
                    <>
                        <Loader2 className="text-muted-foreground w-4 h-4 animate-spin mr-2"/>
                        <div className="text-muted-foreground">Deleting</div>
                    </>
                ):null}
            </ContextMenuTrigger>
            <ContextMenuContent>
                <ContextMenuItem disabled={pendingDelete} onClick={() => {
                    setPendingDelete(true);
                    handleDeleteFile(data);
                }}>
                    <Trash2 className="w-4 h-4 mr-2 "/>
                    Delete
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    )
};