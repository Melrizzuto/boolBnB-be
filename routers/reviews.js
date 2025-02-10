import { Router } from "express";
const reviewsRouter = Router();

import {
    addReview,
    getReviews
} from "../controllers/ReviewsController.js";

// Rotte recensioni

// Ottenere recensioni di una proprietà
reviewsRouter.get("/:propertyId/reviews", getReviews);

// Aggiungere una recensione a una proprietà
reviewsRouter.post("/:propertyId/reviews", addReview);

// Export router
export default reviewsRouter;