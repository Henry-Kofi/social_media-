import { Request} from "express";
import {v4 as uuidv4} from "uuid";
import multer from "multer";
import path from "path";
// multer


const storage = multer.diskStorage({
    destination: function (req:Request,file:Express.Multer.File,cb:CallableFunction){
        cb(null,path.join(__dirname,'..','..',"data","files"))
    },
    filename: function(req:Request,file:Express.Multer.File,cb:CallableFunction){
        const extension:string = path.extname(file.originalname) 
        const tempFileName: string =file.mimetype.split("/")[0]+"_"+Date.now().toString()+"_"+uuidv4()+extension;
        cb(null,tempFileName);
    }
})


const upload = multer({
    storage: storage,
});

export default upload;

