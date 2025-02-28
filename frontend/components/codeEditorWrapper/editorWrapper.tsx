"use client"

import dynamic from "next/dynamic"

const CodeEditor = dynamic(() => import("@/components/editor/index"), {
    ssr: false,
});

export default function CodeEditorWrapper(props: any){
    return <CodeEditor {...props} />
}