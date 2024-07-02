import {app,startApp} from "../src/index"
import {io as ioc, Socket as ClientSocket} from "socket.io-client"
import {afterAll, beforeAll, describe, expect, test} from "@jest/globals";
import mongoose from "mongoose";

beforeAll(async() => {
    await startApp

    
})

afterAll(async () => {
    await mongoose.connection.close();

    startApp.close();
})
describe("Socket test",() => {
    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImhueW9ueW8wMDFAc3QudWcuZWR1LmdoIiwiaWF0IjoxNzEzNjk2MTUyLCJleHAiOjE3MjIzMzYxNTJ9.r60LSUCfTwZX5RDdnpfy4kTXnO0qEghMF8FYGCLH6to"
    const roomId ="dc785d8f-7c26-4e3b-91b5-3f61953a5b29"
    const comment = "This is a comment to the stream activity"
    const data = {roomId,token,comment}
    const socket = ioc('http://localhost:4040');

    socket.on("connect",() => {
        socket.emit('create-stream',token);
        socket.emit('join-stream',data)
        socket.emit('leave-stream',data)
        socket.emit("end-stream",token)
        socket.emit("like-stream", data)
        socket.emit("send-message",data)
    })
    test("Should create a stream",() => {
        socket.on("stream-created", (msg: string) => {
            expect(msg).toBe("room created successfully")
        }) 
    });

    test("User should join stream",() => {
        socket.on("user-connected",(msg) => {
            expect(msg).toBe('hnyonyo001@st.ug.edu.gh');
        })
    })

    test("get the number of views",() => {
        socket.on("get-views",(msg) => {
            expect(msg).toBeGreaterThan(0)
        })
    });

    test("should like a stream",() => {
        socket.on("new-like",(msg) => {
            expect(msg).toBe('hnyonyo001@st.ug.edu.gh');
        })
    })

    test("should get number of likes",() => {
        socket.on("get-likes",(msg) => {
            expect(msg).toBeGreaterThanOrEqual(0)
        })
    })

    test("should be able to comment",() => {
        socket.on("message",(msg) => {
            expect(msg).toBe(comment);
        })
    })

    test("Should leave a stream",() => {
        socket.on("user-disconnected", (msg) => {
            expect(msg).toBe('hnyonyo001@st.ug.edu.gh');
        })
    })

    test("Should end a stream",() => {
        socket.on("stream-ended", (msg) => {
            expect(msg).toBe('stream ended');
        })
    })
})