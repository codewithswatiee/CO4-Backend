import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const uri = process.env.MONGO_URL;
if (!uri){
    throw new Error("MONGODB_URI is not defined in the environment variables");
}
const dbConnect = () => {
    mongoose
    .connect(uri)
    .then(() => {
        console.log("Connected to MongoDB");
    })
    .catch((err) => console.log("Failed to connect to MongoDB", err));
}
export default dbConnect;