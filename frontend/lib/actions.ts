"use server"

import { revalidatePath } from "next/cache"

export async function createVirtualbox(body:{
    type: string
    name: string
    visibility: "public" | "private"
}) {
    const res = fetch('https://cce-backend.tikamgupta05122004.workers.dev/api/virtualbox', {
        method: "PUT",
        headers:{
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body),
    })

    return (await res).text();
}


export async function deleteVirtualbox(
    id: string
) {
    await fetch(`https://cce-backend.tikamgupta05122004.workers.dev/api/virtualbox?id=${id}`, {
        method: "DELETE",
    })

    revalidatePath("/dashboard");
}

export async function updateVirtualbox(body:{
    id: string
    name?: string
    visibility: "public" | "private"
}) {
    await fetch('https://cce-backend.tikamgupta05122004.workers.dev/api/virtualbox', {
        method: "POST",
        headers:{
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body),
    })

    revalidatePath("/dashboard");
}


export async function shareVirtualbox(
    virtualboxId: string,
    email: string,
) {
    try{  
        const res = await fetch('https://cce-backend.tikamgupta05122004.workers.dev/api/virtualbox/share', {
            method: "POST",
            headers:{
                "Content-Type": "application/json"
            },
            body: JSON.stringify({virtualboxId, email}),
        })
        
        const text = await res.text();

        if(res.status !== 200){
            return {success: false, message: text};
        }
        revalidatePath(`/code/${virtualboxId}`);
        return {success: true, message: "Shared Successfully"};
    }
    catch(err){
        console.log(err);
        return {success: false, message: "Couldn't Share"};
    }
}


export async function unshareVirtualbox(
    virtualboxId: string,
    userId: string
) {
    await fetch('https://cce-backend.tikamgupta05122004.workers.dev/api/virtualbox/share', {
        method: "DELETE",
        headers:{
            "Content-Type": "application/json"
        },
        body: JSON.stringify({virtualboxId, userId}),
    })
    
    revalidatePath(`/code/${virtualboxId}`)
}


// export async function generateCode(code:string, line: number) {
    
//     await fetch("https://api.cloudflare.com/client/v4/accounts/49ec3b98dac5f81ba729f8283f7ad51d/ai/run/@cf/meta/llama-3-8b-instruct", {
//         method: "POST",
//         headers: { Authorization: `Bearer ${process.env.CLOUDFLARE_AI_KEY}`,
//             "Content-Type": "application/json"
//         },
//         body: JSON.stringify({
//             messages: [
//                 {
//                     role: "system",
//                     content: "You are an expert coding assistant who reads from an existing code file and suggests code to add to the file"
//                 },
//                 {
//                     role: "user",
//                     content: "",
//                 }
//             ]
//         })
//     })
// }