
"use client"

import { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import {Terminal} from "@xterm/xterm"
import {FitAddon} from "@xterm/addon-fit"
import "./xterm.css"
import { Loader2 } from "lucide-react";

export default function EditorTerminal({socket} : {socket: Socket}){

    const terminalRef = useRef(null);
    const [term, setTerm] = useState<Terminal | null>(null);

    useEffect(() => {
        if(!terminalRef.current) return;

        const terminal = new Terminal({
            cursorBlink: false,
            theme:{
                background: "#262626"
            },
            fontSize: 14,
            fontFamily: "var(--font-geist-mono)"

        });

        setTerm(terminal);  

        return () => {
            if(terminal) terminal.dispose();
        }
    }, [])

    useEffect(() => {
        if(!term) return;

        const onConnect = () => {
            setTimeout(() => {
                socket.emit("createTerminal", {id: "testId"})
            }, 2000)
        }

        const onTerminalResponse = (response : {data: string}) => {
            const res = response.data;
            term.write(res);
        }

        socket.on("connect" , onConnect);

        if(terminalRef.current){
            socket.on("terminalResponse", onTerminalResponse);

            const fitAddon = new FitAddon();

            term.loadAddon(fitAddon);
            term.open(terminalRef.current);
            fitAddon.fit();
            // setTerm(term);
        }

        const disposable = term.onData((data) => {
            socket.emit("terminalData", "testId", data);
        });

        socket.emit("terminalData", "\n");

        return (() => {
            socket.off("connect", onConnect);
            socket.off("terminalResponse", onTerminalResponse);
            disposable.dispose();
        })

    }, [term, terminalRef.current])
    return (
        <div>
            <div ref={terminalRef} className="w-full h-full text-sm text-left">
                {term === null ? (
                    <div className="flex items-center">
                        <Loader2 className="animate-spin mr-2 w-4 h-4" />
                        <span>Connecting to Terminal...</span>
                    </div>
                ) : null}
            </div>
        </div>
    )
}