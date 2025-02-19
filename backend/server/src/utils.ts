export const saveFile = async(
    fileId: string,
    data: string
) => {
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
