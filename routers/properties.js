import { Router } from "express";
const router = Router();

import {
    addProperty,
    searchProperties,
    getPropertyBySlug,
    contactOwner
} from "../controllers/PropertyController.js";

// Rotte

// Ricerca proprietà
router.get("/", searchProperties);

// Dettagli proprietà
router.get("/:slug", getPropertyBySlug);

// Aggiunta proprietà
router.post("/", addProperty);

// Contattare il proprietario
router.post("/:slug/contact", contactOwner);

// Export router
export default router;