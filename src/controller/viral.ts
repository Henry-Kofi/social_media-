import { Request,Response } from "express";
import Room,{roomModel, View} from "../models/viral";
import {v4 as uuidv4} from 'uuid'
import { User, userModel } from "../models/user";
import { Socket } from "socket.io";
import { verifyToken } from "../utils/tokenGenerator";
import { JwtPayload } from "jsonwebtoken";
import { SocketUser } from "../utils/liveStreamSocket";

// interface SocketUser{
//     token: string;
//     roomId?: string;
//     comment?: string;
// }
export const createRoom = async (socket:Socket,token: string) => {
    try {
    const decodedToken = await verifyToken(token) as JwtPayload;
    if(decodedToken.isValid){
        const email: string = decodedToken.user.id;
        const roomId: string = uuidv4();
        const existingRoom: Room | null = await roomModel.findOne({author:email, roomId: roomId});
        if(existingRoom && existingRoom.isLive){ // room exists and is live
            return socket.emit("error","Room already exists")
        }
        // room does not exist
        const newRoom: Room | null = await roomModel.create({
            roomId: roomId,  //generated random uuidv4
            author: email,
            isLive: true
        })
        if(!newRoom){
            return socket.emit("error","failed to create room")
        }
        socket.join(newRoom.roomId);
        return socket.emit("stream-created","room created successfully")
    }else{
        socket.emit("error","Unauthorized access")
    }
    // const email = socket.data.email;

    } catch (error) {
        return socket.emit("error","Internal server error")
    }
}

export const joinRoom = async(socket: Socket,data:SocketUser) => {
    try {
        const token: string = data.token;
        const roomId: string  = data.roomId;
        const decodedToken = await verifyToken(token) as JwtPayload;
        if(decodedToken.isValid){
            const email: string = decodedToken.user.id
            
            // check if the room exists and is live
            const existingRoom: Room | null = await roomModel.findOne({roomId:roomId,isLive:true});
            if(!existingRoom){
                return socket.emit("error","Room does not exist")
            }
            // check if the participant is already int the array
            const  hasParticipant: boolean= existingRoom.views.some((obj) => obj.participant === email);
            
            if(hasParticipant){ //participant exist
                return socket.emit("error","User already in stream")
            }
            // participant does not exist, go ahead and add him
            const updateRoom: Room | null = await roomModel.findOneAndUpdate({roomId:roomId,isLive:true},
                {
                    $push :{
                        views:{
                            participant: email,
                            present:true
                        }
                    }
                },
                {new:true}
            )
            const totalNumberOfViews: number | undefined = updateRoom?.views.length;
            const currentNumberOfViews: number | undefined = updateRoom?.views.filter(views => views.present).length;
            socket.join(roomId)
            socket.broadcast.to(roomId).emit("user-connected",email)
            return socket.emit("get-views",{totalViews: totalNumberOfViews, currentViews: currentNumberOfViews})
        }else{
            socket.emit("error","Unauthorized access")
        }
    } catch (error) {
        return socket.emit("error","Internal server error")
    }
}

export const leaveRoom = async(socket:Socket,data: SocketUser) => {
    try { 
        const token: string = data.token;
        const roomId: string  = data.roomId;
        const decodedToken = await verifyToken(token) as JwtPayload;
        if(decodedToken.isValid){
            const email: string = decodedToken.user.id
        // check if room  exists and is live
        const existingRoom:Room | null = await roomModel.findOne({roomId:roomId,isLive:true})
        if(!existingRoom){ // room does not exist
            // set all user present to false
            const updateRoom: Room | null = await roomModel.findOneAndUpdate({roomId:roomId},
                {
                    $set:{'views.$[].present':false}
                },
                {new:true}
            )
            return socket.emit("error","Room does not exist")
        }
        // check if the participant exist and present in the room 
        const participantExistsAndPresent: boolean = existingRoom.views.some((obj) =>{
            if(obj.participant === email && obj.present){ // exists and present
                return true
            }
            //other possibilities
            return false
        })
        if(participantExistsAndPresent){
            await roomModel.findOneAndUpdate(
                {roomId:roomId}, //query
                {$set: {'views.$[c].present':false}}, //set record
                {new:true,arrayFilters:[{'c.participant':email}]}  //filter
            )
            socket.leave(roomId);
            return socket.emit("user-disconnected",email);
        }
        return socket.emit("user-disconnected",email);
        }else{
            socket.emit("error","Unauthorized access")
        }
    } catch (error) {
        return socket.emit("error","Internal server error")
    }
}

export const endRoom = async(socket:Socket,token: string) => {
    try {
        const decodedToken = await verifyToken(token) as JwtPayload;
        if(decodedToken.isValid){
        const email: string = decodedToken.user.id;
        // chexk if room exists and is still live
        const existingRoom: Room | null = await roomModel.findOne({author:email,isLive:true})
        if(!existingRoom){
            return socket.emit("error","room does not exist")
        }
        // set the isLive property to false and set all participantspresent property to false
        const updatedRoom: Room | null = await roomModel.findOneAndUpdate({author:email,isLive:true},
            {$set:{
                    isLive: false,
                    'views.$[].present':false
                }
            },
            {new:true}
        )
        socket.emit("stream-ended","stream ended")
        return socket.disconnect(true)
        }else{
            
        }
    } catch (error) {
        return socket.emit("error","Internal server error")
    }
}

export const getRooms = async(req:Request,res:Response) => {
    try {
        // get all rooms
        const rooms: Room[] = await roomModel.find()
        // no rooms available
        if(rooms.length === 0 ){
            return res.status(200).json({
                success: false,
                message: "No rooms available currently"
            })
        }
        //  filter out rooms
        const filteredRooms = {
            liveRooms: rooms.filter(room => room.isLive),  //live rooms
            nonLiveRooms: rooms.filter(room => !room.isLive) //non-live rooms
        }
        return res.json({
            success:true,
            message: "Success fetching live rooms",
            rooms: filteredRooms
        })
    } catch (error) {
        return res.status(500).json({
            success:false,
            message: "Internal server error"
        })
    }
}

export const likeStream = async(socket:Socket,data: SocketUser) => {
    try {
        const token: string = data.token;
        const roomId: string  = data.roomId;
        const decodedToken = await verifyToken(token) as JwtPayload;
        if(decodedToken.isValid){
            const email: string = decodedToken.user.id 
        // first check if the stream exists and is live
        const existingRoom: Room | null = await roomModel.findOne({roomId:roomId,isLive:true});
        if(!existingRoom){
            return socket.emit("error","stream does not exist")
        }
        // check if user is in the room
        const hasParticipant: boolean = existingRoom.views.some((obj) => obj.participant === email);
        if (!hasParticipant) {
            return socket.emit("error","user not in stream")
        }
        // let check if user has liked  already
        const hasLiked: boolean = existingRoom.likes.some((obj) => obj.user === email);
        if (hasLiked) {
            const unlikedRoom: Room | null = await roomModel.findOneAndUpdate({roomId:roomId},
                {
                    $pull:{  //romove
                        likes:{ //field
                            user: email //value
                        }
                    }
                },
                {new: true}
            )
            const numberOfLikes = unlikedRoom.likes.length;
            // no need to broadcast this
            // socket.broadcast.to(roomId).emit( "like" , email ) 
            return socket.emit("get-likes",numberOfLikes)
        }
        // user has not liked yet, go ahead an like
        const likedRoom: Room | null = await roomModel.findOneAndUpdate({roomId:roomId},
            {
                $push:{ //remove
                    likes:{//field
                        user: email //value
                    }
                }
            },
            {new:true}
        )
        const numberOfLikes = likedRoom.likes.length;
            socket.emit( "new-like" , email ) 
            return socket.emit("get-likes",numberOfLikes)
        }else{
            return socket.emit("error","Internal server error")
        }
    } catch (error) {
        return socket.emit("error","Internal server error")
    }
}

export const shareStream = async(req:Request,res:Response) => {
    const {roomId,shareFrom,shareTo} = req.body;  
    try {
        // first check if the users exist in our database
        // so let get a list of the users available in db
        const existingUser: User[] | null = await userModel.find();
        // check if the sender exists
        const shareFromExists: boolean = existingUser.some(obj => obj._id === shareFrom);
        if(!shareFromExists){
            return res.status(404).json({
                success: false,
                message: "Senders record not avilable"
            })
        }
        // ckeck if reciever exists 
        const shareToExists:boolean = existingUser.some(obj => obj._id = shareTo);
        if(!shareToExists){
            return res.status(404).json({
                success: false,
                message: "Receivers record not available"
            })
        }
        // both users exist
        // check if the stream exists and is live
        const existingRoom: Room | null = await roomModel.findOne({roomId:roomId,isLive:true});
        if(!existingRoom){
            return res.status(404).json({
                success:false,
                message: "Stream does not exist"
            })
        }
        // room exists and is live let add the records now
        const sharedRecord: Room | null = await roomModel.findOneAndUpdate({roomId: roomId},
            {
                $push:{ // add
                    shares:{ // fields
                        from: shareFrom, //value
                        to: shareTo //value
                    }
                }
            },
            {new:true}
        )
        return res.status(200).json({
            success: true,
            message: "Stream successfully shared",
            sharedRecord
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}

export const createComment = async (socket: Socket,data: SocketUser) => {
    try {
        const token: string = data.token;
        const roomId: string  = data.roomId;
        const comment: string = data.comment;
        const decodedToken = await verifyToken(token) as JwtPayload;
        if(decodedToken.isValid){
            const user: string = decodedToken.user.id 
        // check if room exists and is live
        const liveStreamExists = await checkLiveStream(roomId);
        if(!liveStreamExists){
            return socket.emit("error","stream does not exist")
        }
        // check if user is in the live stream
        const isUserInLiveStream: boolean = liveStreamExists.views.some(obj => obj.participant === user);
        if(!isUserInLiveStream){
            return socket.emit("error","user not in stream")
        }
        // user is streaming 
        const newRoomRecord: Room | null = await roomModel.findOneAndUpdate({roomId:roomId},
            {
                $push:{//add
                    comments:{ //field
                        user: user, //value
                        content:comment //value
                    }
                }
            },
            {new:true}
        )
        if(!newRoomRecord){
            return socket.emit("error","error saving stream to database")
        }
        const newComment = newRoomRecord.comments[newRoomRecord.comments.length-1]
        return socket.emit("message",newComment)

        }else{
            return socket.emit("error","Internal server error")
        }
    } catch (error) {
        return socket.emit("error","Internal server error")
    }
}

const  checkLiveStream = async(roomId?: string) =>  {
    try {
        const existingLivestream: Room | null = await roomModel.findOne({roomId:roomId, isLive:true});
        if(!existingLivestream){
            return null
        }
        // if exists let return the data
        return existingLivestream
    } catch (error) {
        throw error
    }
}
