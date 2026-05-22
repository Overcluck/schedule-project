import express from 'express'
import dotenv from 'dotenv'
import authRouter from './src/routes/auth.js'
import groupRouter from './src/routes/groups.js'
dotenv.config()
const app = express()
app.use(express.json())
app.use('/api/auth', authRouter)
app.use('/api/users', authRouter)
app.use('/api/groups', groupRouter)
app.listen(process.env.PORT, () => {
  console.log('서버 실행 중: http://localhost:' + process.env.PORT)
})
