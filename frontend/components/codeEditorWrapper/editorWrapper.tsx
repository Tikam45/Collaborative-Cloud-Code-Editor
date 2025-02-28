"use client"

import { User ,VirtualBox } from "@/lib/types";
import dynamic from "next/dynamic"

const CodeEditor = dynamic(() => import("@/components/editor/index"), {
    ssr: false,
});

export default function CodeEditorWrapper(props:{
        userData: User,
        virtualboxData :VirtualBox
    }){
    return <CodeEditor {...props} />
}