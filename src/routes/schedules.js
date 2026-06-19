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

// DELETE /api/schedules/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  const schedule_id = req.params.id
  const user_id = req.user.id

  const { data: schedule, error: findError } = await supabase
    .from('user_schedules')
    .select('user_id')
    .eq('schedule_id', schedule_id)
    .single()

  if (findError) return res.status(404).json({ message: '해당 일정을 찾을 수 없습니다.' })

  if (schedule.user_id !== user_id) {
    return res.status(403).json({ message: '본인의 일정만 삭제할 수 있습니다.' })
  }

  const { error } = await supabase
    .from('user_schedules')
    .delete()
    .eq('schedule_id', schedule_id)

  if (error) return res.status(400).json({ message: error.message })

  res.json({ message: '일정이 삭제되었습니다.' })
})

export default router
