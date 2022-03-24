import dotenv from 'dotenv';
dotenv.config();
import fs from 'fs';
import path from 'path';
import Downloader from 'nodejs-file-downloader'
import { Web3Storage, getFilesFromPath } from 'web3.storage'

(async() => {
    let fileName = "";
    const url = process.argv.slice(2)[0];
    console.log('downloading: ', url);
    const downloader = new Downloader({
        url: url,
        directory: "./downloads",
        maxAttempts: 3,
        cloneFiles: false,
        onProgress: function(percentage) {
            console.log("Downloading : ", percentage + "%");
        },
        shouldStop: function(error) {
            if (e.statusCode && e.statusCode === 404) {
                console.log("Not Found 404")
                return true;
            }
        },
        onBeforeSave: (deducedName) => {
            fileName = deducedName;
        },
    });
    try {
        await downloader.download();
        var fileLocation = path.join(downloader.config.directory, fileName)
        const fileDownload = await getFilesFromPath(fileLocation);
        async function storeWithProgress(files, client) {
            let ccid = "";
            const onRootCidReady = cid => {
                ccid = cid
                console.log('uploading files with cid:', ccid);
            }
            const totalSize = files.map(f => f.size).reduce((a, b) => a + b, 0)
            let uploaded = 0

            const onStoredChunk = size => {
                uploaded += size
                const pct = (uploaded / totalSize) * 100;
                console.log(`Uploading... ${pct.toFixed(0)}% complete`);
                if (pct.toFixed(0) == 100) {
                    if (fs.existsSync(fileLocation)) {
                        fs.rm(fileLocation, { recursive: true }, () => {
                            console.log("Upload Complete https://" + ccid + ".ipfs.dweb.link");
                            process.exit();
                        });
                    }
                }
            }
            return client.put(files, { onRootCidReady, onStoredChunk })
        };

        const client = new Web3Storage({ token: process.env.API_KEY });
        await storeWithProgress(fileDownload, client);

    } catch (error) {
        console.log("Download failed", error);
    }
})();
