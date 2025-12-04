const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
    };
};

export { asyncHandler };






// const asyncHandler1 = ()=>{}
// const asyncHandler2 = (parameter)=>{async()=>{}}// function within a function called as --"super function"
// const asyncHandler = (func)=>
//      async(err, req, res, next)=>{
//         try {
//             await func(err, req, res, next)
//         } catch (error) {
//             res.status(err.code).json({
//                 success: false,
//                 message:err.message
//             })

//         }
//     } // const asyncHandler2 = (parameter)=>async()=>{} here I removed the the first parenthesis ---  #professional approach
