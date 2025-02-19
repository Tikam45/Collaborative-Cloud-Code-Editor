"use client"
import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "./dropdown-menu";
import { LogOut, Pencil } from "lucide-react";
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
        <DropdownMenuContent align="end">
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