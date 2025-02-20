import { Router } from "express";
import {
    addProperty,
    searchProperties,
    getPropertyBySlug,
    contactOwner,
    likeProperty
} from "../controllers/PropertyController.js";
import { searchSecondaryImageBySlug, addSecondaryImages } from "../controllers/PropertyImagesController.js";
import upload from "../utils/imageUpload.js";


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

//Agiiunta immagini secondarie
router.post("/:slug/images", addSecondaryImages);

// Contattare il proprietario
router.post("/:slug/contact", contactOwner);

//Aggiungere un like
router.patch("/:slug/like", likeProperty);

// Export router
export default router;

