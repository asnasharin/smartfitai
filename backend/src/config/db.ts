import mongoose from "mongoose"


export const connectDb = async () => {
    try {
         await mongoose.connect(process.env.MONGO_URI as string)
         console.log("database connected")
    } catch (error) {
        console.error("mongodb connection error")
        process.exit(1)
    }
}

