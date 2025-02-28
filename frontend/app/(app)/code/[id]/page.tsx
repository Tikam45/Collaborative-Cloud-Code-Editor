
import Navbar from "@/components/editor/navbar";
import { currentUser } from "@clerk/nextjs/server";
import { Room } from "@/components/editor/live/room";
import CodeEditorWrapper from "@/components/codeEditorWrapper/editorWrapper";
import { User, UsersToVirtualboxes, VirtualBox } from "@/lib/types";
import { redirect } from "next/navigation";

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
  console.log("shared", shared);

  return (
    <div className="flex w-screen flex-col h-screen bg-background">
      <Room id={virtualboxId}>
        <Navbar userData={userData} virtualboxData = {virtualboxData} shared={shared}/>
        <div className="w-screen flex grow">
        <CodeEditorWrapper userData={userData} virtualboxData={virtualboxData}/>
        </div>
      </Room>
    </div>
  );
}
