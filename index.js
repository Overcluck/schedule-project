import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import authRouter from './src/routes/auth.js'
import groupRouter from './src/routes/groups.js'
import scheduleRouter from './src/routes/schedules.js'

dotenv.config()
const app = express()

app.use(cors({ origin: '*' }))
app.use(express.json())

app.get('/', (req, res) => {
  res.json({ success: true, message: '백엔드 정상 동작' })
})

app.use('/api/auth', authRouter)
app.use('/api/users', authRouter)
app.use('/api/groups', groupRouter)
app.use('/api/schedules', scheduleRouter)

app.listen(process.env.PORT, () => {
  console.log('서버 실행 중: http://localhost/:' + process.env.PORT)
})