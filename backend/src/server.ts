import app from "./app";
import { connectDb } from "../src/config/db"
import dotenv from "dotenv"

dotenv.config()
connectDb();

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});