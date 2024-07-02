import { Storage } from "@google-cloud/storage";
import multer from "multer";

const storage = new Storage({
    projectId: "versess-app-e8756",
    keyFilename:"path to our google credentials.json file"
})

export const bucketName = 'versess-app-e8756.appspot.com';
export const bucket = storage.bucket(bucketName);

// instance for uploading files to cloud.
export const upload = multer({
    storage:multer.memoryStorage(),
    limits:{
        fileSize: 20 * 1024 * 1024   //current file size limit 20MB could change this later
    }
})