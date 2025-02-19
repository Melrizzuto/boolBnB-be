import { Router } from "express";
import {
    addProperty,
    searchProperties,
    getPropertyBySlug,
    contactOwner,
    likeProperty
} from "../controllers/PropertyController.js";
import { searchSecondaryImageBySlug } from "../controllers/PropertyImagesController.js";
const router = Router();
// Rotte

// Ricerca proprietà
router.get("/", searchProperties);

// Dettagli proprietà
router.get("/:slug", getPropertyBySlug);

// Aggiunta proprietà
router.post("/", addProperty);

// Dettagli immagini secondarie
router.get("/:slug/images", searchSecondaryImageBySlug);

// Contattare il proprietario
router.post("/:slug/contact", contactOwner);

//Aggiungere un like
router.patch("/:slug/like", likeProperty);

// Export router
export default router;