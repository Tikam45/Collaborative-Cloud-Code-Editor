import Image from "next/image";
import dynamic from "next/dynamic";
import Navbar from "@/components/editor/navbar";
import { currentUser } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { SupabaseFiles, User, UsersToVirtualboxes, VirtualBox } from "@/lib/types";
import { TFile, TFolder } from "@/components/editor/sidebar/types";
import path from "path";
import { url } from "inspector";
import { Room } from "@/components/editor/live/room";
// import CodeEditor from "@/components/editor";

const CodeEditor = dynamic(() => import("@/components/editor"),{
  // ssr: false, 
});

const getUserData = async(id: string) => {
  console.log(id);
  const userRes = await fetch (`https://cce-backend.tikamgupta05122004.workers.dev/api/user?id=${id}`)

  const userData = (await userRes.json()) as User;

  return userData;
}

const getVirtualboxData = async(id: string) => {
  console.log("hello", id);
  const virtualboxRes = await fetch(`https://cce-backend.tikamgupta05122004.workers.dev/api/virtualbox?id=${id}`);
  // console.log(virtualboxRes)
  const virtualboxData : VirtualBox = await virtualboxRes.json();
  return virtualboxData;
}

const getSharedUsers = async(usersToVirtualboxes: UsersToVirtualboxes[]) => {
  const shared = await Promise.all(
    usersToVirtualboxes?.map(async(user) => {
      const userRes = await fetch(`https://cce-backend.tikamgupta05122004.workers.dev/api/user?id=${user.userId}`)
      const userData : User = await userRes.json();
      return {id: userData.id, name: userData.name} 
    })
  )
  return shared;
}

export default async function CodePage({params} : {params: Promise<{ id: string}>}) {
  const resolvedparams = await params;
  const user = await currentUser();
  const virtualboxId = resolvedparams.id;
  console.log(resolvedparams);
  if(!user){
    redirect("/");
  }

  const userData = await getUserData(user.id);
  const virtualboxData = await getVirtualboxData(virtualboxId);
  // console.log("hello" ,virtualboxData);
  const shared = await getSharedUsers(virtualboxData.usersToVirtualboxes) ?? [];

  return (
    <div className="flex w-screen flex-col h-screen bg-background">
      <Room id={virtualboxId}>
        <Navbar userData={userData} virtualboxData = {virtualboxData} shared={shared}/>
        <div className="w-screen flex grow">
        <CodeEditor userId={user.id} virtualboxId={virtualboxId}/>
        </div>
      </Room>
    </div>
  );
}
