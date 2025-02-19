"use client"

import { useState } from "react";
import { TFile, TFolder } from "./types";
import Image from "next/image";
import {getIconForFolder, getIconForOpenFolder} from "vscode-icons-js"
import SidebarFile from "./file";

export default function SidebarFolder({data, selectFile, handleDeletFolder, handleDeleteFile}:
    {
        data:TFolder
        selectFile: ((file: TFile) => void)
        handleDeleteFile : (file: TFile) => void
        handleDeletFolder : (folder: TFolder) => void
    }){

    const [isOpen, setIsOpen] = useState(false);
    const folder = isOpen 
    ? getIconForOpenFolder(data.name) 
    : getIconForFolder(data.name);

    return (
        <>
        <div onClick={() => setIsOpen((prev) => !prev)} className="w-full flex items-center h-7 px-1 transition-colors hover:text-muted-foreground cursor-pointer rounded-sm">
            <Image src={`/icons/${folder}`} alt="Folder icon" width={18} height={18} className="mr-2"/>
            {data.name}
        </div>
        {
            isOpen? (
                <div>
                    <div className="flex w-full items-stretch">
                        <div className="w-[1px] bg-border mx-2 h-full"></div>
                        <div className="flex flex-col grow">
                            {
                                data.children.map((child) => child.type === 'file'? (
                                    <SidebarFile key={child.id} data={child} selectFile={selectFile} handleDeleteFile={handleDeleteFile}/>
                                ) : (
                                    <SidebarFolder key={child.id} data={child} selectFile={selectFile} handleDeletFolder={handleDeletFolder} handleDeleteFile={handleDeleteFile}/>
                                ))
                            }
                        </div>
                    </div>
                </div>
            ):null
        }
        </>
    )
}