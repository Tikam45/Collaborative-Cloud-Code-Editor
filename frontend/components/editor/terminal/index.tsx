"use client"

import { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import {Terminal} from "@xterm/xterm"
import {FitAddon} from "@xterm/addon-fit"
import "./xterm.css"
import { Loader2 } from "lucide-react";

export default function EditorTerminal(
    {
        id,
        socket,
        term,
        visible,
        setTerm
    } : 
    {
        id: string,
        socket: Socket
        term: Terminal | null,
        visible: boolean,
        setTerm: (term: Terminal) => void
    }){

    const terminalRef = useRef(null);

    useEffect(() => {
        if(!terminalRef.current) return;

        if(term) return;

        const terminal = new Terminal({
            cursorBlink: true,
            theme:{
                background: "#262626"
            },
            fontSize: 14,
            fontFamily: "var(--font-geist-mono)",
            lineHeight: 1.5,
            letterSpacing: 0,
        });

        setTerm(terminal);  

        return () => {
            if(terminal) terminal.dispose();
        }
    }, [])

    useEffect(() => {
        if(!term) return;

        // const onConnect = () => {
        //     setTimeout(() => {
        //         socket.emit("createTerminal", {id: "testId"})
        //     }, 2000)
        // }

        // const onTerminalResponse = (response : {id: string, data: string}) => {
        //     // const res = response.data;
        //     // term.write(res);
        //     // const term = terminals.find((t) => t.id === response.id);
        //     console.log("hey" ,response);
        //     if (term) term.write(response.data);
        // }

        // socket.on("connect" , onConnect);

        if(terminalRef.current){
            // socket.on("terminalResponse", onTerminalResponse);

            const fitAddon = new FitAddon();

            term.loadAddon(fitAddon);
            term.open(terminalRef.current);
            fitAddon.fit();
            
            // setTerm(term);
        }

        const disposable = term.onData((data) => {
            socket.emit("terminalData", id, data);
        });

        // socket.emit("createTerminal", {id: "testId"})
        // socket.emit("terminalData", "\n");

        return (() => {
            // socket.off("connect", onConnect);
            // socket.off("terminalResponse", onTerminalResponse);
            disposable.dispose();
        })

    }, [term, terminalRef.current])


    return (
        <div>
            <div ref={terminalRef} style={{display: visible ? "block" : "none"}} 
            className="w-full h-full text-left">
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