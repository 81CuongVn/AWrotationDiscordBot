const fs = require("fs");

const filePath = "./data/servers.json";

function saveData(data){
    const json = JSON.stringify(data);
    fs.writeFile(filePath, json, "utf-8", (err)=>{
        if(err){
            throw new Error("Failed to save file: " + err);
        }
    });
}

function readDataSync(){
    let data = [];
    
    if (fs.existsSync(filePath)) {
        const json = fs.readFileSync(filePath, "utf-8");
        console.log("JSON" + json);
        data = JSON.parse(json);
    }

    return data;
}

module.exports.saveData = saveData;
module.exports.readDataSync = readDataSync;