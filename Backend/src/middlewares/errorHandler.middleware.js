import ApiError from "../utils/ApiError.js"

const errorHandler = (err, req, res, next) => {
    console.error("Error:", err.message); // For debugging

    if (err instanceof ApiError) {
        return res.status(err.statuscode).json({
            success: err.success,
            message: err.message,
            errors: err.errors,
        });
    }

    // Use err.statusCode if available; otherwise, default to 500
    const statusCode = err.statusCode || 500
    res.status(statusCode).json({
        success: false,
        message: err.message || "Internal Server Error",
        errors: err.errors || [],
    })
}

export default errorHandler