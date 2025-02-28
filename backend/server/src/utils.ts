export const saveFile = async(
    fileId: string,
    data: string
) => {
    console.log("saving...")
    const res = await fetch(`https://storage.tikamgupta05122004.workers.dev/api/save`, {
        method: "POST",
        headers: {
            "Content-Type" : "application/json",
        },
        body: JSON.stringify({fileId, data})
    })
    return res.ok;
}

export const createFile = async(
    fileId: string
) => {
    const res = await fetch(`https://storage.tikamgupta05122004.workers.dev/api`, {
        method: "POST",
        headers: {
            "Content-Type" : "application/json",
        },
        body: JSON.stringify({fileId})
    })
    return res.ok;
}


export const deleteFile = async(
    fileId: string
) => {
    const res = await fetch(`https://storage.tikamgupta05122004.workers.dev/api`, {
        method: "DELETE",
        headers: {
            "Content-Type" : "application/json",
        },
        body: JSON.stringify({fileId})
    })
    return res.ok;
}


export const generateCode = async(
    {
        fileName,
        code,
        line,
        instructions
    }:{
        fileName: string,
        code: string,
        line: number,
        instructions: string,
    }
) => {
    return await fetch("https://api.cloudflare.com/client/v4/accounts/49ec3b98dac5f81ba729f8283f7ad51d/ai/run/@cf/meta/llama-3-8b-instruct", {
        method: "POST",
        headers: { Authorization: "Bearer KNjfAc2pLtl-fnt4LVqWSHUUgghASZJcp4QN2JkY",
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            messages: [
                {
                    role: "system",
                    content: "You are an expert coding assistant who reads from an existing code file and suggests code to add to the file. You many be given instructions on what to generate, which you should follow. You should generate code that is correct, efficient, and follows best practices. You should also generate code that is clear and easy to read."
                },
                {
                    role: "user",
                    content: `The file is called ${fileName}. Here are my instructions on what to generate: ${instructions}. Suggest me code to insert at line ${line} in my file. My code file content: ${code}. Return only the code, and nothing else. Do not include backticks`,
                }
            ]
        })
    })
}
