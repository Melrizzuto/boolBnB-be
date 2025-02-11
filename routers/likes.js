import { Router } from "express";
import {
    addLike,
    getLikesCount
} from "../controllers/LikesController.js";

const likesRouter = Router();

// Rotta per aggiungere un like
likesRouter.post("/add", addLike);

// Rotta per ottenere il numero di like di una proprietà
likesRouter.get("/count/:property_id", getLikesCount);

export default likesRouter;