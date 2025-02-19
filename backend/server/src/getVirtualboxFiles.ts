import { SupabaseFiles, TFile, TFolder, SupabaseFileData, SupabaseFileMetadata, TFileData} from "./types";

const getVirtualboxFiles = async (id: string) => {
  // console.log("hello", id)
  const virtualboxRes = await fetch (`https://storage.tikamgupta05122004.workers.dev/api?virtualboxId=${id}`);
  const virtualboxData = await virtualboxRes.json();
  // console.log("hi")
  // console.log( virtualboxData);

  const paths = virtualboxData;

  return processFiles(paths, id);
}

const processFiles = async(paths: string[], id: string)=> {
  const root: TFolder = {id:"/", type: "folder", name: "/", children: []};

  const fileData : TFileData[] = [];

  // console.log(paths, "paths");
  paths.forEach((path) => {
    const allParts = path.split('/');
    if(allParts[0] !== id){
      return;
    }
    
    const parts = allParts.slice(1);
    // console.log("parts", parts);
    let current: TFolder = root;

    for(let i=0; i<parts.length; i++){
      // console.log("inside", parts[i]);
      const part = parts[i];
      const isFile = i=== parts.length-1 && part.includes(".")
      const existing = current.children.find((child) => child.name === part);

      // console.log(isFile, existing);

      if(existing) {
        if(!isFile){
          current = existing as TFolder;
        }
      }
      else{
        if(isFile){
          const file : TFile = {id: path, type: "file", name: part};
          current.children.push(file);
          fileData.push({id: path, data: ""})
          // console.log(file)
        }
        else{
          const folder : TFolder = {
            id: parts.slice(0, i+1).join("/"),
            type: "folder",
            name: part,
            children: []
          }
          current.children.push(folder);
          current = folder;

          // console.log(folder)
        }
      }
    }
    // console.log(root);
  });

  // console.log(fileData);

  await Promise.all(
    fileData.map(async(file) => {
      const data = await fetchFileContent(file.id);
      file.data = data;
    })
  )
  return {files: root.children, fileData};
}


const fetchFileContent = async(fileId: string) : Promise<string> => {
  try{
    const fileRes = await fetch(`https://storage.tikamgupta05122004.workers.dev/api?fileId=${fileId}`);
    return await fileRes.text();
  }
  catch(error){
    return ""
  }
}
export default getVirtualboxFiles;