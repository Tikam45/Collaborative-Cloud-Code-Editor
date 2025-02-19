"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { deleteVirtualbox, updateVirtualbox } from "@/lib/actions"
import { VirtualBox } from "@/lib/types"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"


const formSchema = z.object({
    name: z.string().min(1).max(16),
    visibility: z.enum(["public", "private"]),
})


export default function EditVirtualboxModal({
    open,
    setOpen,
    data
} :{
    open: boolean
    setOpen : (open: boolean) => void
    data: VirtualBox
}){

    const [loading, setLoading] = useState(false);
    const [loadingDelete, setLoadingDelete] = useState(false);
    const router = useRouter();
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: data.name,
            visibility: data.visibility,
        }
    });

    async function onSubmit(values: z.infer<typeof formSchema>){
        setLoading(true);
        await updateVirtualbox({id: data.id, ...values});
        setLoading(false);
    }

    async function onDelete(){
        setLoadingDelete(true);

        await deleteVirtualbox(data.id);

        router.push("/dashboard");
    }

    return(
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit VirtualBox Info</DialogTitle>
                </DialogHeader>
                <Form {...form} >
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <FormField control={form.control} name="name" render={({field}) => (
                            <FormItem className="mb-4" >
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="My Project" {...field} />
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="visibility" render={({field}) => (
                            <FormItem className="mb-8">
                                <FormLabel>Visibility</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue/>
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="public">Public</SelectItem>
                                        <SelectItem value="private">Private</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage/>
                            </FormItem>
                        )}/>
                        <Button disabled={loading} type="submit" className="w-full">
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                                </>
                            ): (
                                "Update Virtualbox"
                            )}
                        </Button>
                    </form>
                </Form>
                <Button disabled={loadingDelete} onClick={onDelete} variant={"destructive"} className="w-full">
                    {loadingDelete ? (
                        <>
                            <Loader2 className="animate-spin mr-2 h-4 w-4" />
                        </>
                    ): (
                        "Delete Virtualbox"
                    )}
                </Button>
            </DialogContent>
        </Dialog>
    )
}