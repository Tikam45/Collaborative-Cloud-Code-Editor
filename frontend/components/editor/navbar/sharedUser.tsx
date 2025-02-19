"use client"

import Avatar from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Loader2, X } from "lucide-react";
import { useState } from "react"

export default function SharedUser({user, virtualboxId}: {
    user: {id: string, name: string}
    virtualboxId: string
}){

    const [loading, setLoading] = useState(false);

    async function handleUnshare(id:string) {
        
    }

    return (
        <div>
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <Avatar name={user.name} className="mr-2"/>
                    {user.name}
                </div>
                <Button disabled={loading} onClick={() => handleUnshare(user.id)} variant={"ghost"} size={"smIcon"}>
                    {
                        loading? (<Loader2 className="animate-spin w-4 h-4" />) :(
                            <X className="w-4 h-4 "/>
                        )
                    }
                </Button>
            </div>
        </div>
    )
}