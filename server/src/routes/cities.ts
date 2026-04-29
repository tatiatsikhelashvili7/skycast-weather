import { Router } from "express";
import { amindiSupportedCities } from "../services/amindi";
const router = Router();
router.get("/georgian", (_req, res) => {
    res.json({ cities: amindiSupportedCities(), source: "amindi.ge" });
});
export default router;
