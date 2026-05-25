import express from 'express'
import supabase from '../supabase.js'
import authMiddleware from '../middleware/auth.js'

const router = express.Router()

// POST /api/schedules
router.post('/', authMiddleware, async (req, res) => {
  const user_id = req.user.id
  const { title, start_time, end_time } = req.body

  const { data, error } = await supabase
    .from('user_schedules')
    .insert({ user_id, title, start_time, end_time })
    .select('schedule_id')
    .single()

  if (error) return res.status(400).json({ message: error.message })

  res.status(201).json({ schedule_id: data.schedule_id, message: '일정이 등록되었습니다.' })
})

// GET /api/schedules
router.get('/', authMiddleware, async (req, res) => {
  const user_id = req.user.id

  const { data, error } = await supabase
    .from('user_schedules')
    .select('*')
    .eq('user_id', user_id)
    .order('start_time', { ascending: true })

  if (error) return res.status(400).json({ message: error.message })

  res.json(data)
})

export default router
