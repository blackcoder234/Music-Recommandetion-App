import mongoose, { Schema } from "mongoose";


const visitorSchema = new Schema({
    ip: {
        type: String,
        required: true,
        unique: true  // optional, depends on how you want to structure it
    },
    ip_version: {
        type: String,
        enum: ['IPv4', 'IPv6'],
        required: true
    },
    city: {
        type: String,
        default: 'Unknown'
    },
    region: {
        type: String,
        default: 'Unknown'
    },
    country: {
        type: String,
        default: 'Unknown'
    },
    longitude: {
        type: Number,
        default: null
    },
    network_org: {
        type: String,
        default: 'Unknown'
    },
    visitCount: {
        type: Number,
        default: 1
    },
    lastVisitedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });


const Visitor = mongoose.model("Visitor", visitorSchema)

export default Visitor

