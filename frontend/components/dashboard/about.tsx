"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";


export default function AboutModal({
    open ,
    setOpen
}: {
    open: boolean;
    setOpen : (open : boolean) => void
}){

    return(
        <Dialog open={open} onOpenChange={setOpen} >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>About this Project</DialogTitle>
                </DialogHeader>
                <div className="text-sm text-muted-foreground">
                A Collaborative Cloud Code Editor, AI Powered Auto Scaling Copilot
                </div>
            </DialogContent>

        </Dialog>
    )
}