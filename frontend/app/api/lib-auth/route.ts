
import { User } from "@/lib/types";
import { currentUser } from "@clerk/nextjs/server";
import { Liveblocks } from "@liveblocks/node"
import { NextRequest } from "next/server";

const liveblocks = new Liveblocks({
    secret: `${process.env.LIVEBLOCKS_API_KEY}`
});

export async function POST(request: NextRequest){
    const clerkUser = await currentUser();

    if(!clerkUser){
        return new Response("Unauthorized", {status: 401});
    }

    const res = await fetch(
        `https://cce-backend.tikamgupta05122004.workers.dev/api/virtualbox/share?id=${clerkUser.id}`
    );

    const user = (await res.json()) as User

    const session = liveblocks.prepareSession(user.id, {
        userInfo: {
            id: user.id,
            name: user.name,
            email: user.email,
        }
    });

    user.virtualbox.forEach((virtualbox) => {
        session.allow(virtualbox.id, session.FULL_ACCESS)
    });
    user.usersToVirtualboxes.forEach((utv) => {
        session.allow(utv.virtualboxId, session.FULL_ACCESS);
    });

    const {body, status} = await session.authorize();
    return new Response(body, {status: status});
}