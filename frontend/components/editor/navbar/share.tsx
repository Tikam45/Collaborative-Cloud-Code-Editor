"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { shareVirtualbox } from "@/lib/actions"
import { VirtualBox } from "@/lib/types"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, UserPlus } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import SharedUser from "./sharedUser"


const formSchema = z.object({
    email: z.string().email()
})


export default function ShareVirtualboxModal({
    open,
    setOpen,
    data,
    shared
} :{
    open: boolean
    setOpen : (open: boolean) => void
    data: VirtualBox
    shared: {
        id: string
        name: string
    }[]
}){

    const [loading, setLoading] = useState(false);
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
        }
    });

    async function onSubmit(values: z.infer<typeof formSchema>){
        console.log(values);

        setLoading(true);
        const res = await shareVirtualbox(data.id, values.email) 

        if(!res.success){
            toast.error(res.message);
        }else{
            toast.success("Shared successfully")
        }
        setLoading(false);
    }
    return(
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
                <div className={`p-6 ${shared.length > 0 ? "pb-3" : null} space-y-6`}>
                    <DialogHeader>
                        <DialogTitle>Share Virtualbox</DialogTitle>
                        {
                            data.visibility === "private" ? (
                                <DialogDescription className="text-sm text-muted-foreground">
                                    This virtualbox is private. Making it public will allow shared users to view and collaborate
                                </DialogDescription>
                            ): (null)
                        }
                    </DialogHeader>
                    <Form {...form} >
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <FormField control={form.control} name="email" render={({field}) => (
                                <FormItem className="mr-4 w-full" >
                                    <FormControl>
                                        <Input placeholder="test@domain.com" {...field} className="w-full"/>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <Button disabled={loading} type="submit" className="w-full">
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin mr-2 h-4 w-4" />
                                    </>
                                ): (
                                    <>
                                        <UserPlus className="mr-2 w-4 h-4" /> Share
                                    </>
                                )}
                            </Button>
                        </form>
                    </Form>
                </div>
                {
                    shared.length > 0 ? (
                        <>
                        <div className= "w-full h-[1px] bg-border"/>
                        <div className="p-6 pt-3">
                            <DialogHeader className="mb-3">
                                <DialogTitle>Manage Access</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-2">
                                {
                                    shared.map((user) => (
                                        <SharedUser key={user.id} user={user} virtualboxId={data.id}/>
                                    )
                                )}
                            </div>
                        </div>
                        </>
                    ): null
                }
            </DialogContent>
        </Dialog>
    )
}