import Visitor from "../models/visitor.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"

const saveUserInfo = asyncHandler(async(req,res)=>{
    const {ip,ip_version,city,region,country,longitude,network_org}=req.body
   
    const existingVisitor = await Visitor.findOne({ ip });

    if (existingVisitor) {
        existingVisitor.visitCount += 1;
        existingVisitor.lastVisitedAt = new Date();
        await existingVisitor.save();
        return res
        .status(200)
        .json(new ApiResponse(200, existingVisitor, "Returning visitor updated successfully"));
    }

    const visitor = await Visitor.create({
        ip,
        ip_version,
        city,
        region,
        country,
        longitude,
        network_org
    })

    const createdVisitor = await Visitor.findById(visitor._id)
    if (!createdVisitor) {
        throw new ApiError(500, "Internal server error: saving the Visitor Info")
    }
    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                 createdVisitor, 
                 "Visitor data is saved successfully"
                )
            )

})


export {saveUserInfo}