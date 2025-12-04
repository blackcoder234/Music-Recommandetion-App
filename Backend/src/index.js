 
import connectDB from "./db/database.js"
import  app  from './app.js'
import 'dotenv/config'



const port = process.env.PORT
connectDB()
.then(()=>{
    app.listen(port, ()=>{
        console.log(`Server is running on port: ${port}`)
        console.log(`Visit this link.... http://localhost:${port}`)
        
    })
})
.catch((error)=>{
    console.log("MongoDB Connection Error :", error)
    
})