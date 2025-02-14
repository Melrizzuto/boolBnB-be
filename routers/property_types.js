import express from "express";
import { getPropertyTypes } from "../controllers/PropertyTypesController.js";

const router = express.Router();

// Rotta per recupero dei tipi di proprietà
router.get("/property-types", getPropertyTypes);

export default router;