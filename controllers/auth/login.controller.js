import UserModel from "../../models/user.model.js";
import bcrypt from "bcrypt";
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken';
dotenv.config();

export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        if(!email || !password){
            return res.status(400).json({ message: "Email and password are required" });
        }
        const user = await UserModel.findOne({ email }).select("-__v -docDesc");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
        console.log(user)
        return res.status(200).json({ message: "Login successful", user, token });
    } catch (error) {
        console.error("Error logging in:", error);
        return res.status(500).json({ message: "Internal server error" });  
    }
}