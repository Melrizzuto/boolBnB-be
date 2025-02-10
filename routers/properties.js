import { Router } from "express";
const router = Router();

import {
    index, show, store, update, destroy
} from "../controllers/propertiesController";

//Rotte

//index - read all
router.get("/", index);

//show - read one
router.get("/:id", show);

//store - create
router.post("/", store);

//update - total update 
router.put("/:id", update);

//destroy - delete
router.delete("/:id", destroy);

//export router
export default router;