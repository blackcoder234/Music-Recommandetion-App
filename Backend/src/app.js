import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import errorHandler from "./middlewares/errorHandler.middleware.js"
import 'dotenv/config'

const app = express()

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit:"10mb"}))
app.use(express.urlencoded({extended:true, limit:"10mb"}))
app.use(express.static("public"))
app.use(express.static("dist"))
app.use(cookieParser())


//Routes
import staticRoutes from "./routes/static.routes.js"
import landingPageStaticRoutes from "./routes/landing_page.static.routes.js"
import userRoutes from "./routes/user.routes.js"


//Routes Declaration
app.use("/snippet.co", landingPageStaticRoutes)
app.use("/api/v1/users", userRoutes)
app.use("/", staticRoutes)

//Error Handler
app.use(errorHandler)



export default app 