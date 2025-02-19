import Link  from "next/link";
import Image from "next/image";
import {currentUser} from "@clerk/nextjs/server"
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";

export default async function Home() {
  const user = await currentUser();

  if(user){
    redirect("/dashboard");
  }
  return (
    <div className="overflow-hidden overscroll-none flex w-screen flex-col h-screen bg-background">
      <div className="w-full max-w-screen-md px-8 flex flex-col items-center">
        <h1 className="text-2xl font-medium text-center mt-32">
          A Collaborative Cloud Code Editor, AI Powered Auto Scaling Copilot
        </h1>
        <div className="text-muted-foreground mt-4 text-center">
          Collaborative Cloud Code Editor
        </div>
        <div className="mt-8 flex space-x-4">
          <Link href={"/sign-up"}>
            <Button>Go To App</Button>
          </Link>
        </div>
      </div>
      <div className="w-full rounded-lg bg-neutral-800 mt-12 aspect-video"></div>
    </div>
  );
}
