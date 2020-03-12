const net = require('net');
const fs = require('fs');
const path = require('path');
const port = 3000;
const host = '127.0.0.1';
const filePath = path.join(__dirname, "files");

const server = net.createServer();
server.listen(port, host, () => {
    console.log('TCP Server is running on port ' + port + '.');
});

server.on('connection', function (sock) {
    console.log('CONNECTED: ' + sock.remoteAddress + ':' + sock.remotePort);

    sock.on('data', function (data) {


        //get list of files in the requested directory or return a specific file
        try {
            let dataString = new String(data).trim();
            let relPath = (dataString == "/" || dataString == "\\") ? "" : dataString;
            let finalPath = path.join(filePath, relPath);

            if (!finalPath.startsWith(filePath))
                throw new Error("Illegal Access");

            let fileStat = fs.lstatSync(finalPath);

            if (fileStat.isDirectory()) {
                let files = fs.readdirSync(path.join(filePath, relPath), { "encoding": "utf8", "withFileTypes": true });
                files.forEach(element => {
                    element['DIR'] = element.isDirectory();
                });
                let ret = { "type": "directory", "data": files, "path": relPath };
                sock.write(JSON.stringify(ret) + "\r\n");
            } else {
                console.log("file")
                let fileData = fs.readFileSync(finalPath);
                let ret = { "type": "file", "data": fileData, "filename": path.basename(finalPath) };

                sock.write(JSON.stringify(ret) + "\r\n");
            }


        } catch (error) {
            console.log(JSON.stringify(error));
            if (error.errno == -4058)//restrict user from seeing path information of server
                error.message = "File/Path not found!"
            let ret = { "type": "error", "message": error.message };

            sock.write(JSON.stringify(ret) + "\r\n");
        }

    });

    sock.on('error', (err) => {
        console.log("Error occurred: "+err.message);
    })

    sock.on('end',(v)=>{
        console.log('GOT END');
    });

    sock.on('close',()=>{
        console.log("got close");
        
    })


});



