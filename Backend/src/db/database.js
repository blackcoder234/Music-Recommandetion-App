import mongoose, { connect } from "mongoose";
import { DB_NAME } from "../constants.js";


const connectDB = async () => {
    try {
        const mongoDBInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`\n MongoDB Successfully Connected !  DB Host : ${mongoDBInstance.connection.host}`);
    }
    catch (error) {
        console.error("MongoDB Connection Failed, Error: ", error);
        process.exit(1)// this is node js function see nodejs documentation for more information

    }
}

export default connectDB