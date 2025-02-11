import { Router } from "express";
const likesRouter = Router();

import {
    checkLike,
    toggleLike,
    getLikesCount
} from "../controllers/LikesController";

// Rotta per verificare se un utente ha già messo like a una proprietà
likesRouter.get("/check", checkLike);

// Rotta per aggiungere o rimuovere un like
likesRouter.post("/toggle", toggleLike);

// Rotta per ottenere il numero di like di una proprietà
likesRouter.get("/count/:property_id", getLikesCount);

export default likesRouter;