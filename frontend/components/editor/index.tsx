
"use client"

import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
  } from "../ui/resizable"
import { Button } from "../ui/button"
import { FileJson, Plus, SquareTerminal, X } from "lucide-react"
import {BeforeMount, Editor, OnMount} from '@monaco-editor/react';
import monaco from 'monaco-editor'
import { use, useEffect, useRef, useState } from "react"
import Sidebar from "./sidebar/index";
import Tab from "../ui/tab";
import { TFile, TFolder } from "./sidebar/types";
import { useClerk } from "@clerk/nextjs";
import {io} from "socket.io-client"
import { processFileType } from "@/lib/utils";
import EditorTerminal from "./terminal/index";
import GenerateInput from "./generate";
import { number } from "zod";
import * as Y from "yjs"
import LiveblocksProvider from "@liveblocks/yjs"
import {MonacoBinding} from "y-monaco"
import { Awareness } from "y-protocols/awareness.js";
import { TypedLiveblocksProvider, useRoom } from "@/liveblocks.config";
import { Avatars } from "./live/avatars";
import { Cursors } from "./live/cursors";

export default function CodeEditor(
    {
        userId,
        virtualboxId
    }:{
        userId: string,
        virtualboxId :string
    }
){
    const [editorRef, setEditorRef] = useState<monaco.editor.IStandaloneCodeEditor>();

    const clerk = useClerk();

    const [tabs, setTabs] = useState<TFile[]>([])
    const [activeId, setActiveId] = useState<string | null>(null);
    const [files, setFiles] = useState<(TFile | TFolder)[]>([]);
    const [editorLanguage, setEditorLanguage] = useState<string | undefined> (undefined);
    const [activeFile, setActiveFile] = useState<string | null> (null);
    const [term , setTerm] = useState<string[]>([])

    const [provider, setProvider] = useState<TypedLiveblocksProvider>()

    const generateRef = useRef<HTMLDivElement>(null);
    const [showGenerate, setShowGenerate] = useState(false);
    const monacoRef = useRef<typeof monaco | null>(null);
    const [cursorLine, setCursorLine] = useState(0);
    const [generate, setGenerate] = useState<{
        show: boolean,
        id: string
        width: number
        line: number
        widget: monaco.editor.IContentWidget | undefined
        pref: monaco.editor.ContentWidgetPositionPreference[]
    }>({show: false, id: "", width: 0, line: 0, widget: undefined, pref: []});
    const [decorations, setDecorations] = useState<{
        options: monaco.editor.IModelDecoration[]
        instance: monaco.editor.IEditorDecorationsCollection | undefined
    }>({options: [], instance: undefined});

    const editorContainerRef = useRef<HTMLDivElement>(null); 
    const generateWidgetRef = useRef<HTMLDivElement>(null);


    const socket = io(
        `http://localhost:4000?userId=${userId}&virtualboxId=${virtualboxId}`
    );

    const resizeObserver = new ResizeObserver((entries) => {
        for(const entry of entries){
            const {width} = entry.contentRect
            setGenerate((prev) => {
                return {...prev, width};
            })
        }
    })

    useEffect(() => {
        socket.connect();

        if(editorContainerRef.current){
            resizeObserver.observe(editorContainerRef.current);
        }

        return () => {
            socket.disconnect();
            resizeObserver.disconnect();
        }
    }, [])

    useEffect(() => {
        function onLoadedEvent (files : (TFolder | TFile)[]){
            setFiles(files);
        }

        const onConnect = () => {};

        const onDisconnect =() => {}

        socket.on("connect" , onConnect);

        socket.on("disconnect", onDisconnect);

        socket.on("loaded", onLoadedEvent);

        return () => {
            socket.off("loaded", onLoadedEvent);
            socket.off("disconnect", onDisconnect);
            socket.off("connect", onConnect);
        }
    }, [])

    const selectFile = (tab: TFile) => {
        console.log("ehll", tab)
        setTabs((prev) => {
            const exists = prev.find((t) => t.id === tab.id)
            if(exists){
                setActiveId(exists.id)
                console.log('afa')
                return prev
            }
            console.log("dj" ,[...prev, tab])
            return [...prev,tab] 
        })

        socket.emit(("getFile"), tab.id, (response: string) => {
            setActiveFile(response);
        })
        setEditorLanguage(processFileType(tab.name))
        setActiveId(tab.id);
        // console.log(tabs)
    }
    useEffect(()=>{
        console.log(tabs);
    }, [tabs])

    const closeTab = (tab: TFile) => {
        const numTabs = tabs.length
        const index = tabs.findIndex((t) => t.id === tab.id)

        if(index === -1) return;

            const nextId 
            = activeId === tab.id 
                ? numTabs === 1 
                ? null: index < numTabs-1 
                ? tabs[index+1].id : tabs[index-1].id
            : activeId

            const nextTab = tabs.find((t) => t.id === nextId);

            if(nextTab) selectFile(nextTab)
            else setActiveId(null);
        setTabs((prev) => prev.filter((t) => t.id !== tab.id))
    };


    const handleEditorMount : OnMount = (editor, monaco) => {
        setEditorRef(editor);
        monacoRef.current = monaco;

        editor.onDidChangeCursorPosition((e) => {
            const {column, lineNumber} = e.position;
            if(lineNumber === cursorLine) return;
            
            setCursorLine(lineNumber);
            const model = editor.getModel();
            const endcolumn = model?.getLineContent(lineNumber).length || 0;
            
            //@ts-ignore
            setDecorations((prev) => {
                return {
                    ...prev,
                    options: [
                        {
                            range: new monaco.Range(
                                lineNumber,
                                column,
                                lineNumber,
                                endcolumn
                            ),
                            options:{
                                afterContentClassName: "inline-decoration"
                            }
                        }
                    ]
                }
            })
        })

        editor.onDidBlurEditorText((e) => {
            setDecorations((prev) => {
                return {...prev, options:[]};
            })
        })

        editor.addAction({
            id: "generate",
            label: "Generate",
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyG],
            precondition: "editorTextFocus && !suggestWidgetVisible && !renameInputVisible && !inSnippetMode && !quickFixWidgetVisible",
            run: () => {
                setGenerate((prev) => {
                    return {...prev, show: !prev.show, pref: [monaco.editor.ContentWidgetPositionPreference.BELOW]};
                })
            }
        })
    }

    const room = useRoom();

    useEffect(() => {

        let yDoc: Y.Doc
        let yProvider : any
        let binding : MonacoBinding

        if(editorRef){
            yDoc = new Y.Doc()
            const yText = yDoc.getText("monaco")
            yProvider = new LiveblocksProvider(room, yDoc);
            setProvider(yProvider);

            binding = new MonacoBinding(
                yText,
                editorRef?.getModel() as monaco.editor.ITextModel,
                new Set([editorRef]),
                yProvider.awareness as Awareness
            )
        }

        return () => {
            yDoc?.destroy();
            yProvider?.destroy();
            binding?.destroy();
        }
    }, [editorRef, room])

    useEffect(() => {
        if(generate.show){
            editorRef?.changeViewZones(function(changeAccessor){
                if(!generateRef.current) return;

                const id = changeAccessor.addZone({
                    afterLineNumber: cursorLine,
                    heightInLines: 3,
                    domNode: generateRef.current,
                });

                setGenerate((prev) => {
                    return {...prev, id, line: cursorLine};
                })
            })

            if(!generateWidgetRef.current) return;

            const widgetElement = generateWidgetRef.current;

            const contentWidget = {
                getDomeNode: () => {
                    return widgetElement
                },
                getId: () => {
                    return "generate.widget"
                },
                getPosition: () => {
                    return {
                        position :{
                            lineNumber: cursorLine,
                            column: 1
                        },
                        preference: generate.pref
                    }
                }
            }

            setGenerate((prev) =>{
                return { ...prev, widget: contentWidget}
            })

            editorRef?.addContentWidget(contentWidget);

            if(generateRef.current && generateWidgetRef.current){
                editorRef?.applyFontInfo(generateRef.current);
                editorRef?.applyFontInfo(generateWidgetRef.current);
            }
        }else{
            editorRef?.changeViewZones(function(changeAccessor){
                if(!generateRef.current) return;
                changeAccessor.removeZone(generate.id);
                setGenerate((prev) => {
                    return {...prev, id: ""};
                })
            })

            if(!generate.widget) return;

            editorRef?.removeContentWidget(generate.widget as any);
            setGenerate((prev) => {
                return{
                    ...prev, 
                    widget: undefined
                }
            })
        }
    }, [generate.show]);

    useEffect(() => {
        if(decorations.options.length === 0){
            decorations.instance?.clear();
        }

        if(decorations.instance){
            decorations.instance.set(decorations.options);
        }else{
            const instance = editorRef?.createDecorationsCollection();
            instance?.set(decorations.options);

            setDecorations((prev) => {
                return {
                    ...prev, 
                    instance,
                }
            })
        }
    }, [decorations.options]);

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if(e.key === "s" && (e.metaKey || e.ctrlKey)){
                e.preventDefault();

                const activeTab = tabs.find((t) => t.id === activeId);

                setTabs((prev) => prev.map((tab) => tab.id === activeId ? {...tab, saved: true} : tab));

                socket.emit("savedFile", activeId, editorRef?.getValue());
            }
        };

        document.addEventListener("keydown", down);

        return() => {
            document.removeEventListener("keydown", down);
        }
    }, [tabs, activeId])

    const handleDeleteFile = (file: TFile) => {
        socket.emit("deleteFile", file.id, (response: (TFile | TFolder)[])=>{
            setFiles(response);
        });
        closeTab(file)
    }

    const handleDeletFolder = (folder: TFolder)=> {

    }

    const handleEditorWillMount: BeforeMount = (monaco) => {
        monaco.editor.addKeybindingRules([
            {
                keybinding: monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyG,
                command: "null",
            }
        ]) 
    }

    return(
        <>
            <div ref={generateRef} />
            <div className="z-50 p-1" ref={generateWidgetRef}>
                {generate.show ? (
                    <GenerateInput 
                    socket={socket}
                    data={{
                        fileName: tabs.find((t) => t.id === activeId)?.name ?? "",
                        code: editorRef?.getValue() ?? "",
                        line: generate.line,
                    }}
                    editor={{
                        language: editorLanguage!
                    }}
                    cancel={() => {}} submit={(str : string) => {}} width={generate.width - 90 } 
                    onExpand={() => {
                        editorRef?.changeViewZones(function(changeAccessor){
                            changeAccessor.removeZone(generate.id);

                            if(!generateRef.current)  return; 

                            const id = changeAccessor.addZone({
                                afterLineNumber: cursorLine,
                                heightInLines: 12,
                                domNode: generateRef.current,
                            });
            
                            setGenerate((prev) => {
                                return {...prev, id};
                            })
                        })
                    }}
                    onAccept={(code: string)=> {
                        const line = generate.line
                        setGenerate((prev) => {
                            return{
                                ...prev,
                                show: !prev.show
                            }
                        })
                        console.log("Accepted", code);
                        const file = editorRef?.getValue()

                        const lines = file?.split("\n") || []
                        lines.splice(line-1, 0, code);
                        const updatedFile = lines.join("\n");
                        editorRef?.setValue(updatedFile);
                    }}
                    />
                ) : null}
            </div>
            <Sidebar files = {files} handleDeletFolder={handleDeletFolder} handleDeleteFile={handleDeleteFile} selectFile = {selectFile} socket={socket} addNew={(name, type) => {
                if(type === "file"){
                    setFiles((prev) => [
                        ...prev,
                        {id: `codestore/${virtualboxId}/${name}`, name, type: "file"},
                    ]);
                }
                else{
                    console.log("adding")
                }
                }}/>
            <ResizablePanelGroup direction="horizontal">
                <ResizablePanel
                    maxSize={75}
                    minSize={30}
                    defaultSize={60}
                    className="flex flex-col p-2"
                >
                    <div className="h-10 w-full flex gap-2">
                        {
                            tabs.map((tab)=>(
                                <Tab key={tab.id} selected={activeId === tab.id}  onClick={()=> selectFile(tab)} onClose={() => closeTab(tab)} >{tab.name}</Tab>
                            ))
                        }
                    </div>
                    <div ref={editorContainerRef} className="grow w-full overflow-hidden rounded-lg relative">
                        {
                            activeId === null ? (
                                <>
                                    <div>
                                        <FileJson className="w-6 h-6 mr-3" />
                                        No File Selected
                                    </div>
                                </>
                            ) : clerk.loaded ? (
                                <>
                                    {provider ? <Cursors yProvider={provider}/> : null}
                                    <Editor
                                        height={"100%"}
                                        defaultLanguage="typescript"
                                        theme="vs-dark"
                                        language={editorLanguage}
                                        beforeMount={handleEditorWillMount}
                                        onMount={handleEditorMount}
                                        onChange={(value) => {
                                            setTabs((prev) => prev.map((tab) => tab.id === activeId ? {...tab, saved: false}: tab))
                                        }}
                                        options={{
                                            minimap:{
                                                enabled: true,
                                            },
                                            padding:{
                                                bottom:4,
                                                top:4,
                                            },
                                            scrollBeyondLastLine: false,
                                            fixedOverflowWidgets: true,
                                            fontFamily: "var(--font-geist-mono)"
                                        }}
                                        value={activeFile ?? ""}
                                    />
                                </>
                            ) :null
                        }
                    </div>
                </ResizablePanel>
                <ResizableHandle/>
                <ResizablePanel defaultSize={40}>
                    <ResizablePanelGroup direction="vertical">
                        <ResizablePanel defaultSize={50} minSize={20} className="p-2 flex flex-col">
                            <div className="h-10 w-full flex gap-2">
                                <Button
                                    variant={"secondary"}
                                    size={"sm"}
                                    className="min-w-20 justify-between"
                                >
                                    localhost:3000 <X className="w-3 h-3"/>
                                </Button>
                            </div>
                            <div className="w-full grow rounded-lg bg-foreground"></div>
                        </ResizablePanel>
                        <ResizableHandle/>
                        <ResizablePanel defaultSize={50} minSize={20} className="p-2 flex flex-col">
                            <div className="h-10 w-full flex gap-2">
                                <Tab selected>
                                    <SquareTerminal className="w-4 h-4 mr-2"/>
                                    Shell
                                </Tab>
                                <Button size={"smIcon"} variant={"secondary"} className="font-normal select-none text-muted-foreground">
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>
                            <div className="w-full relative grow rounded-lg bg-secondary">
                                {socket ? <EditorTerminal socket={socket} /> : null }
                            </div>
                        </ResizablePanel>
                    </ResizablePanelGroup>
                </ResizablePanel>
            </ResizablePanelGroup>
        </>
    )
}