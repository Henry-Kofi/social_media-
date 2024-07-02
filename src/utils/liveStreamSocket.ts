import { NextFunction } from "express";
import { Server,Socket } from "socket.io";
import { Token, verifyToken } from "./tokenGenerator";
import { createComment, createRoom, endRoom, joinRoom, leaveRoom, likeStream } from "../controller/viral";
import { JwtPayload } from "jsonwebtoken";


export interface SocketUser{
    token: string;
    roomId?: string;
    comment?: string;
}


export const liveStreamSocketEvents = (io: Server) => {

    io.on('connect', (socket: Socket) => {
        console.log("socket connected")
        socket.on('create-stream',(token: string) => {
            createRoom(socket,token)
        });
        socket.on('join-stream',(data:SocketUser) => {
            joinRoom(socket,data)
        });
        socket.on('send-message',(data: SocketUser) => {
            createComment(socket,data);
        });
        socket.on("like-stream",(data: SocketUser) => {
            likeStream(socket,data)
        });
        socket.on("leave-stream", (data: SocketUser) => {
            leaveRoom(socket,data)
        });
        socket.on("end-stream",(token: string) => {
            endRoom(socket, token)
        });
    
    })
}