import { Router } from "express"
import { getRooms, shareStream } from "../controller/viral";

const viralRouter = Router();

viralRouter.get("/all/rooms",getRooms);

viralRouter.put("/share/room",shareStream);

export default viralRouter