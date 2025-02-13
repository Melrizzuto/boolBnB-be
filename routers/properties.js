import { Router } from "express";
import {
    addProperty,
    searchProperties,
    getPropertyBySlug,
    contactOwner,
    likeProperty,
    getPropertyTypes
} from "../controllers/PropertyController.js";
const router = Router();
// Rotte

// Ricerca proprietà
router.get("/", searchProperties);

// Dettagli proprietà
router.get("/:slug", getPropertyBySlug);

// Aggiunta proprietà
router.post("/", addProperty);

// Tipi di proprietà
router.get("/types", getPropertyTypes);

// Contattare il proprietario
router.post("/:slug/contact", contactOwner);

//Aggiungere un like
router.patch("/:slug/like", likeProperty);

// Export router
export default router;