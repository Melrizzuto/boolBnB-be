import { Router } from "express";
import reviewsRouter from "./reviews.js";
const router = Router();

import {
    addProperty,
    searchProperties,
    getProperitesDetails,
    contactOwner
} from "../controllers/PropertyController.js";

// Rotte

// Ricerca proprietà
router.get("/", searchProperties);

// Dettagli proprietà
router.get("/:id", getProperitesDetails);

// Aggiunta proprietà
router.post("/", addProperty);

// Contattare il proprietario
router.post("/:propertyId/contact", contactOwner);

// Export router
export default router;