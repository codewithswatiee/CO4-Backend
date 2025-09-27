import express from "express";
import { login } from "../controllers/auth/login.controller.js";
import { userSignUp } from "../controllers/auth/signup.controller.js";

const router = express.Router();

router.post("/login", login);
router.post("/signup", userSignUp);

export default router;