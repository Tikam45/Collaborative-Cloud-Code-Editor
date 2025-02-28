"use client"
import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "./dropdown-menu";
import { LogOut, Pencil, Sparkles } from "lucide-react";
import { User } from "@/lib/types";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";


export default function UserButton({userData} : {userData: User}) {

    if(!userData) return null;

    const {signOut} = useClerk();
    const router = useRouter(); 

  return (
    <DropdownMenu>
        <DropdownMenuTrigger>
            <div className="w-9 h-9 rounded-full overflow-hidden font-mono bg-gradient-to-t from-neutral-800 to-neutral-600 flex items-center justify-center text-sm font-medium">
                {userData?.name?.split(" ").slice(0, 2).map((name) => name[0].toUpperCase())}
            </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-40" align="end">
            <div className="py-1.5 px-2 w-full">
                <div className="font-medium">{userData.name}</div>
                <div className="text-sm w-full overflow-hidden text-ellipsis whitespace-nowrap text-muted-foreground">{userData.email}</div>
            </div>
            <DropdownMenuSeparator/>

            <div className="py-1.5 px-2 flex flex-col items-start text-sm w-full">
                <div className="flex items-center">
                    <Sparkles className="h-4 w-4 mr-2 text-indigo-500" />
                    AI Usuage: {userData.generations}/30
                </div>
                <div className="rounded-full w-full mt-2 h-2 overflow-hidden bg-secondary">
                    <div className="h-full bg-indigo-500 rounded-full " 
                        style={{width: `${(userData.generations/30)*100}%`}}
                    ></div>
                </div>
            </div>

            <DropdownMenuItem className="cursor-pointer">
                <Pencil className="mr-2 h-4 w-4"/>
                <span>Edit Profile</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator/>
            <DropdownMenuItem className="!text-destructive cursor-pointer" onClick={() =>signOut(() => router.push("/"))}>
                <LogOut className="mr-2 h-4 w-4"/>
                <span>Log Out</span>
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
  );
}