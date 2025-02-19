"use client"
import { ChevronLeft, Clock, Pencil, Users } from 'lucide-react'
import {Button} from '../../ui/button'
import Image from 'next/image'
import Logo from "@/assets/logo.svg"
import Link from 'next/link'
import {dark} from "@clerk/themes"
import { User, VirtualBox } from '@/lib/types'
import UserButton from '../../ui/userButton'
import { useState } from 'react'
import EditVirtualboxModal from './edit'
import ShareVirtualboxModal from './share'
import { Avatars } from '../live/avatars'

export default function Navbar({userData, virtualboxData, shared} : {userData: User, virtualboxData : VirtualBox 
    shared: {
        id: string
        name: string
    }[]}){

    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isSharedOpen, setIsSharedOpen] = useState(false);

    return(
        <>
            <EditVirtualboxModal open={isEditOpen} setOpen={setIsEditOpen} data={virtualboxData} />
            <ShareVirtualboxModal open={isSharedOpen} setOpen={setIsSharedOpen} data={virtualboxData} shared={shared} />
            <div className='h-14 px-2 w-full border-b border-border flex items-center justify-between'>
                <div className='flex items-center space-x-4'>
                    <Link href={"/"} className='ring-offset-2 ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none rounded-sm'>
                        <Image src={Logo} alt='Logo' width={36} height={36}/>
                    </Link> 
                    <div className='text-sm font-medium flex items-center'>
                        {virtualboxData.name}
                        <button onClick={() =>setIsEditOpen(true)} className='h-7 w-7 ml-2 flex items-center justify-center rounded-md bg-background border border-border'>
                            <Pencil className='h-4 w-4'/>
                        </button>
                    </div>
                    <div className='flex items-center space-x-4'>
                        <Avatars/>
                       <Button variant={"outline"} onClick={() => setIsSharedOpen(true)}>
                            <Users className='w-4 h-4 mr-2'/>
                            Share
                        </Button> 
                        <UserButton userData={userData} />
                    </div>
                </div>
            </div>
        </>
    )
}