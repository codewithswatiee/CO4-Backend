import bcrypt from 'bcrypt';
import UserModel from '../../models/user.model.js';


export const userSignUp = async (req, res) => {
    const { email, password, name, role } = req.body;
    try {
        if(!email || !password || !name || !role ) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const userExist = await UserModel.findOne({email});
        if(userExist){
            return res.status(400).json({ message: "User already exists! Please try with other email" });
        }

        const hashPassword = await bcrypt.hash(password, 10);
        
        const userData = {
            email,
            password: hashPassword,
            name,
            role
        };

        const newUser = await UserModel.create(userData);
        newUser.save();

        return res.status(201).json({ message: "User created successfully", user: newUser });
    } catch (error) {
        console.error("Error creating user:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}