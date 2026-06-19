import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'

import authRouter from './src/routes/auth.js'
import groupRouter from './src/routes/groups.js'
import scheduleRouter from './src/routes/schedules.js'

dotenv.config()

const app = express()

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:8080',
  'http://127.0.0.1:8080',
  'https://schedule-project-d3es.onrender.com'
]

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error(`CORS 차단: ${origin}`))
    }
  },
  credentials: true
}

app.use(cors(corsOptions))
app.use(express.json())

app.get('/', (req, res) => {
  res.json({ success: true, message: '백엔드 정상 동작' })
})

app.use('/api/auth', authRouter)
app.use('/api/users', authRouter)
app.use('/api/groups', groupRouter)
app.use('/api/schedules', scheduleRouter)

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ success: false, message: err.message })
})

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`서버 실행 중: ${PORT}`)
})