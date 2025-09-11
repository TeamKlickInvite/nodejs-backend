import express from 'express'
import cors from 'cors'
import cookieParser from "cookie-parser"
const app = express();
import router from './routes/template.routes.js';


 app.use(cors({
    origin: process.env.CORS_ORIGIN,
    methods: ["GET","POST","PUT","DELETE"],
    credential:true
 }))
 app.use(express.json({limit:"16kb"}))
 app.use(express.urlencoded({extended:true, limit:"16kb"}))
 app.use(express.static("public"))
 app.use(cookieParser())
 // routes:import
//  import userRouter from './routes/user.routes.js'
//  // routed declartion:
// app.use("/api/v1/users",userRouter)
 app.use('/api/v1/users', router);
// app.get('/test', (req, res) => {
//   res.send('API is working 🚀');    
// });

export default app