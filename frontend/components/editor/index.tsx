"use client"

import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
  } from "../ui/resizable"
import { Button } from "../ui/button"
import { FileJson, Loader, Loader2, Plus, SquareTerminal, TerminalSquare, X } from "lucide-react"
import {BeforeMount, Editor, OnMount} from '@monaco-editor/react';
import monaco from 'monaco-editor'
import { Terminal } from "@xterm/xterm";
import { useEffect, useRef, useState } from "react"
import Sidebar from "./sidebar/index";
import Tab from "../ui/tab";
import { TFile, TFolder } from "./sidebar/types";
import { useClerk } from "@clerk/nextjs";
import {io} from "socket.io-client"
import { processFileType } from "@/lib/utils";
import EditorTerminal from "./terminal/index";
import GenerateInput from "./generate";
import * as Y from "yjs"
import LiveblocksProvider  from "@liveblocks/yjs"
import {MonacoBinding} from 'y-monaco'
import { Awareness } from "y-protocols/awareness.js";
import { TypedLiveblocksProvider, useRoom } from "@/liveblocks.config";
import { Cursors } from "./live/cursors";
import { User, VirtualBox } from "@/lib/types";
import { toast } from "sonner";
import {createId} from "@paralleldrive/cuid2"
import PreviewWindow from "./preview";

export default function CodeEditor(
    {
        userData,
        virtualboxData
    }:{
        userData: User,
        virtualboxData :VirtualBox
    }
){
    // /console.log("asdfadf")
    const [editorRef, setEditorRef] = useState<monaco.editor.IStandaloneCodeEditor>();

    const clerk = useClerk();

    const [tabs, setTabs] = useState<TFile[]>([])
    const [activeId, setActiveId] = useState<string>("");
    const [files, setFiles] = useState<(TFile | TFolder)[]>([]);
    const [editorLanguage, setEditorLanguage] = useState<string | undefined> (undefined);
    const [activeFile, setActiveFile] = useState<string | null> (null);
    const [term , setTerm] = useState<string[]>([])
    const [ai, setAi] = useState(false);
    const [closingTerminal, setClosingTerminal] = useState("");
    const [provider, setProvider] = useState<TypedLiveblocksProvider>()
    const [activeTerminalId, setActiveTerminalId] = useState("");
    const [creatingTerminal, setCreatingTerminal] = useState(false);
    const generateRef = useRef<HTMLDivElement>(null);

    const [showGenerate, setShowGenerate] = useState(false);
    const monacoRef = useRef<typeof monaco | null>(null);
    const [cursorLine, setCursorLine] = useState(0);
    const [terminals, setTerminals] = useState<
    {
      id: string;
      terminal: Terminal | null;
    }[]
  >([]);
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

    // console.log(userId, virtualboxId);

    const socket = io(
        `https://collaborative-cloud-code-editor-api.vercel.app?userId=${userData.id}&virtualboxId=${virtualboxData.id}`
    );

    const activeTerminal = terminals.find((t) => t.id === activeTerminalId)

    const resizeObserver = new ResizeObserver((entries) => {
        for(const entry of entries){
            const {width} = entry.contentRect
            setGenerate((prev) => {
                return {...prev, width};
            })
        }
    })

    // revalidatePath(`/code/${virtualboxData.id}`)
    console.log("hellfghjo")
    useEffect(() => {
        console.log("hellfghjo")
        socket.connect();

        if(editorContainerRef.current){
            resizeObserver.observe(editorContainerRef.current);
        }

        return () => {
            socket.disconnect();
            resizeObserver.disconnect();

            // terminals.forEach((term) => {
            //     if(term.terminal) term.terminal.dispose();
            // })
        }
    }, [])

    useEffect(() => {
        function onLoadedEvent (files : (TFolder | TFile)[]){
            console.log("tikam")
            setFiles(files);
        }

        const onConnect = () => {
            // createTerminal();
        };

        const onDisconnect =() => {}

        const onRateLimit = (message: string) => {
            toast.error(message);
        }

        const onTerminalResponse = (response: {id: string, data :string}) => {

            const res = response.data;
            console.log("response", res);
            const term = terminals.find((t) => t.id === response.id);
            if(term && term.terminal) term.terminal.write(response.data);
        }

        socket.on("connect" , onConnect);

        socket.on("loaded", onLoadedEvent);

        socket.on("rateLimit", onRateLimit);
        socket.on("terminalResponse", onTerminalResponse);

        socket.on("disconnect", onDisconnect);


        return () => {
            socket.off("loaded", onLoadedEvent);
            socket.off("disconnect", onDisconnect);
            socket.off("connect", onConnect);
            socket.off("rateLimit", onRateLimit);
            socket.off("terminalResponse", onTerminalResponse);
        }
    }, [terminals])

    const selectFile = (tab: TFile) => {
        if(tab.id === activeId) return;
        const exists = tabs.find((t) => t.id === tab.id);
        console.log("ehll", tab)
        setTabs((prev) => {
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

        setTabs((prev) => prev.filter((t) => t.id !== tab.id))

        if(!nextId){
            setActiveId("");
        }else{
            const nextTab = tabs.find((t) => t.id === nextId);

            if(nextTab) selectFile(nextTab);
        }
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

    const createTerminal = () => {
        setCreatingTerminal(true);
        const id = createId();

        setTerminals((prev) => [...prev, {id, terminal: null}]);

        setActiveTerminalId(id);
        setTimeout(() => {
            socket.emit("createTerminal", id, () => {
                
                setCreatingTerminal(false);
            })
        }, 1000)
    }

    const closeTerminal = (term : {id: string; terminal: Terminal | null}) => {
        const numTerminals = terminals.length;
        const index = terminals.findIndex((t) => t.id === term.id);

        if(index === -1) return;

        setClosingTerminal(term.id);

        socket.emit("closeTerminal", term.id, (res: boolean) => {
            setClosingTerminal("");
            const nextId = 
            activeTerminalId === term.id 
            ? numTerminals === 1 
                ? null
                : index < numTerminals -1
                ? terminals[index+1].id
                : terminals[index-1].id
            : activeTerminalId;

            // if(activeTerminal && activeTerminal.terminal){
            //     activeTerminal.terminal.dispose();
            // }

            setTerminals((prev) => prev.filter((t) => t.id !== term.id));

            setActiveTerminalId(nextId || "");
        })
    }

    useEffect(() => {
        if(!ai){
            setGenerate((prev) => {
                return{
                    ...prev,
                    show: false
                }
            })
            return;
        }
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

            const contentWidget : monaco.editor.IContentWidget = {
                getDomNode: () => {
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

        if(!ai) return;

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

                socket.emit("saveFile", activeId, editorRef?.getValue());
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

    const room = useRoom();

    useEffect(() => {

        const tab = tabs.find((t) => t.id === activeId);
        const model = editorRef?.getModel();

        if (!editorRef || !tab || !model) return;

        const yDoc = new Y.Doc();
        const yText = yDoc.getText(tab.id);
        const yProvider: any = new LiveblocksProvider(room, yDoc);

        console.log("editor", editorRef);
        console.log("tabId", tab.id);
        const onSync = (isSynced: boolean) => {
            if(isSynced) {
                const text = yText.toString();
                if(text === ""){
                    if(activeFile){
                        yText.insert(0, activeFile);
                    }else{
                        setTimeout(() => {
                            yText.insert(0, editorRef.getValue());
                        }, 0)
                    }
                }
            }else{

            }
        }

        yProvider.on("sync", onSync);
    
        setProvider(yProvider);
    
        const binding : any = new MonacoBinding(
          yText,
          model as monaco.editor.ITextModel,
          new Set([editorRef]),
          yProvider.awareness as Awareness
        );
    
        return () => {
            yDoc?.destroy();
            yProvider?.destroy();
            binding?.destroy();
            yProvider.off("sync", onSync);
        }; 
    }, [editorRef, room, activeFile])

    return(
        <>
            <div ref={generateRef} />
            <div className="z-50 p-1" ref={generateWidgetRef}>
                {generate.show && ai ? (
                    <GenerateInput 
                    user={userData}
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
                                heightInLines: 0,
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
            <Sidebar 
            files = {files} 
            handleDeletFolder={handleDeletFolder} 
            handleDeleteFile={handleDeleteFile} 
            selectFile = {selectFile} 
            socket={socket} 
            addNew={(name, type) => {
                if(type === "file"){
                    setFiles((prev) => [
                        ...prev,
                        {id: `codestore/${virtualboxData.id}/${name}`, 
                        type: "file",
                        name, },
                    ]);
                }
                else{
                    console.log("adding")
                }
            }}
            ai={ai}
            setAi={setAi}
            />
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
                            !activeId ? (
                                <>
                                    <div className="flex justify-center items-center h-full">
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
                                            if(value === activeFile){
                                                setTabs((prev) => 
                                                    prev.map((tab) => 
                                                        tab.id === activeId ? {...tab, saved: true}: tab
                                                    )
                                                )
                                            }
                                            else{
                                                setTabs((prev) => 
                                                    prev.map((tab) => 
                                                        tab.id === activeId ? {...tab, saved: false}: tab
                                                    )
                                                )
                                            }
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
                            <PreviewWindow/>
                        </ResizablePanel>
                        <ResizableHandle/>
                        <ResizablePanel defaultSize={50} minSize={20} className="p-2 flex flex-col">
                            <div className="h-10 w-full flex gap-2">

                                {
                                    terminals.map((term) => (
                                        <Tab key={term.id} selected={activeTerminalId === term.id} onClick={() => setActiveTerminalId(term.id)} onClose={() => closeTerminal(term)}>
                                            <SquareTerminal className="w-4 h-4 mr-2"/>
                                            Shell
                                        </Tab> 
                                    ))
                                }
                                <Button
                                disabled={creatingTerminal}
                                onClick={() => {
                                    if(terminals.length >= 4){
                                        toast.error("You reached the maximum no. of terminals you can have")
                                        return;
                                    }
                                    createTerminal();
                                }}
                                 size={"smIcon"} variant={"secondary"} className="font-normal select-none text-muted-foreground">
                                    {
                                        creatingTerminal ? 
                                        <Loader2 className="animate-spin w-4 h-4" /> : 
                                        <Plus className="w-4 h-4" />
                                    }
                                </Button>
                            </div>
                            {
                                socket && activeTerminal ? 
                                (
                                    <div className="w-full relative grow rounded-lg bg-secondary">
                                        {
                                            terminals.map(((term) => (
                                                <EditorTerminal key={term.id} socket={socket} id={activeTerminal.id} term={activeTerminal.terminal} 
                                                setTerm={(t: Terminal) => {
                                                    setTerminals((prev) => 
                                                    prev.map((term) => 
                                                        term.id === activeTerminalId ? {...term, terminal: t} : term))
                                                }}
                                                visible={activeTerminalId === term.id}
                                                /> 
                                            )))
                                        }
                                    </div>
                                ) :
                                (
                                    <div className="w-full h-full items-center justify-center text-muted-foreground flex bg-secondary">
                                        <TerminalSquare className="w-4 h-4 mr-2" />
                                        No Terminals Open
                                    </div>
                                )
                            }
                            
                        </ResizablePanel>
                    </ResizablePanelGroup>
                </ResizablePanel>
            </ResizablePanelGroup>
        </>
    )
}