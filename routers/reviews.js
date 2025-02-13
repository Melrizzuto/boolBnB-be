import { Router } from "express";
const reviewsRouter = Router({ mergeParams: true });

import {
    addReview,
    getReviews
} from "../controllers/ReviewsController.js";

// Rotte recensioni

// Ottenere recensioni di una proprietà
reviewsRouter.get("/", getReviews);

// Aggiungere una recensione a una proprietà
reviewsRouter.post("/", addReview);



// Export router
export default reviewsRouter;