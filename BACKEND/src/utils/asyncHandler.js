const asyncHandler = (requestHandler)=>{
    return   (req,res,next)=>{
           // this is another fashion to write promise without creating new object of it.
           Promise.resolve(requestHandler(req,res,next))
           .catch((error)=>next(error))
       }
}



export {asyncHandler}
