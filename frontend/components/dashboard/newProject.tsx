"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import Image from "next/image";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import {z} from "zod";
import { useForm } from "react-hook-form";
import {zodResolver } from "@hookform/resolvers/zod"
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import CustomButton from "../ui/customButton";
import { Loader2 } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { createVirtualbox } from "@/lib/actions";
import { useRouter } from "next/navigation";

type TOptions = "react" | "node";

const data :{
    id: TOptions,
    name: string,
    icon: string,
    description: string
}[] = [
    {
        id: "react",
        name: "React",
        icon: "/project-icons/react.svg",
        description: "A Javascript library for building user interfaces",
    },
    {
        id: "node",
        name: "Node",
        icon: "/project-icons/node.svg",
        description: "A Javascript runtime built on the V8 engine",
    }
]

const formSchema = z.object({
    name: z.string().min(1).max(16),
    visibility: z.enum(["public", "private"]),
})

export default function  NewProjectModal({
    open, 
    setOpen
}:{
    open : boolean,
    setOpen : (open : boolean) => void
}) {
    const [selected, setSelected] = useState<TOptions>("react")
    const [loading, setLoading] = useState(false);

    const user = useUser();
    const router = useRouter()

    const form = useForm<z.infer<typeof formSchema> >({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            visibility: "public"
        }
    });

    async function onSubmit(values: z.infer<typeof formSchema>){
        if(!user.isSignedIn) return;

        const virtualboxData = {type: selected, userId: user.user.id, ...values}
        setLoading(true);

        const id = await createVirtualbox(virtualboxData);
        router.push(`/code/${id}`);
    }

    return(
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create a Virtualbox</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 w-full gap-2 mt-2">
                    {data.map((item)=>(
                        <button onClick={() => setSelected(item.id)} key={item.id} className={`${selected === item.id ? "border-foreground" : "border-border"} rounded-md border bg-card text-card-foreground shadow text-left p-4 flex flex-col transition-all focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:ring-2 focus-visible:ring-ring`} >
                            <div className="space-x-2 flex items-center justify-start w-full">
                                <Image alt="" src={item.icon} width={20} height={20} />
                                <div className="font-medium">{item.name}</div>
                            </div>
                            <div className="mt-2 text-muted-foreground">{item.description}</div>
                        </button>
                    ))}
                </div>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <FormField control={form.control} name="name" render={({field}) => (
                            <FormItem className="mb-4">
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="My Project..." {...field} />
                                </FormControl>
                            </FormItem>
                        )}/>
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
                        <CustomButton disabled={loading} type="submit" className="w-full">
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                                </>
                            ): (
                                "Submit"
                            )}
                        </CustomButton>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}