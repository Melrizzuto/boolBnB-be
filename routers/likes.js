import { Router } from "express";
import {
    addLike,
    getLikesCount
} from "../controllers/LikesController.js";

const likesRouter = Router( { mergeParams: true } );

// Rotta per aggiungere un like
likesRouter.post("/add", addLike);

// Rotta per ottenere il numero di like di una proprietà
likesRouter.get("/count/", getLikesCount);

export default likesRouter;