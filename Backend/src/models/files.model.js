import mongoose, { Schema } from "mongoose";

const fileSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        images: [
            {
                url: {
                    type: String,
                    required: true 
                },
                publicId: {
                    type: String,
                    required: true 
                },
                status: {
                    type: String,
                    enum: ["pending", "completed", "failed"],
                    default: "pending" 
                },
                disease_class: {  
                    type: String,
                    default: "" 
                },
                ai_recommendation: {
                    type: String,
                    default: "" 
                }
            }
        ],
    },
    { timestamps: true }
);

const File = mongoose.model("File", fileSchema);

export default File;
