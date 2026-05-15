import app from "./app";
import { connectDb } from "../src/config/db"
import dotenv from "dotenv"

dotenv.config()
connectDb();

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});