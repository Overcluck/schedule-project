import express from 'express'
import supabase from '../supabase.js'
import authMiddleware from '../middleware/auth.js'

const router = express.Router()

// POST /api/groups
router.post('/', authMiddleware, async (req, res) => {
  const { title, description, deadline } = req.body
  const owner_id = req.user.id

  const { data, error } = await supabase
    .from('group_plans')
    .insert({ title, description, deadline, owner_id, status: 'OPEN' })
    .select('group_plan_id')
    .single()

  if (error) return res.status(400).json({ message: error.message })

  await supabase
    .from('group_members')
    .insert({ group_plan_id: data.group_plan_id, user_id: owner_id })

  res.status(201).json({ group_plan_id: data.group_plan_id, message: '약속 방이 생성되었습니다.' })
})

// POST /api/groups/:id/join
router.post('/:id/join', authMiddleware, async (req, res) => {
  const group_plan_id = req.params.id
  const owner_id = req.user.id
  const { email } = req.body

  const { data: plan, error: planError } = await supabase
    .from('group_plans')
    .select('owner_id')
    .eq('group_plan_id', group_plan_id)
    .single()

  if (planError) return res.status(400).json({ message: planError.message })

  if (plan.owner_id !== owner_id) {
    return res.status(403).json({ message: '방장만 멤버를 초대할 수 있습니다.' })
  }

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('user_id')
    .eq('email', email)
    .single()

  if (userError || !user) return res.status(404).json({ message: '해당 이메일의 유저를 찾을 수 없습니다.' })

  const { error } = await supabase
    .from('group_members')
    .insert({ group_plan_id, user_id: user.user_id })
  if (error) {
    if (error.code === '23505') {
      return res.status(400).json({ message: '이미 참여 중인 멤버입니다.' })
    }
    return res.status(400).json({ message: error.message })
  }

  res.status(201).json({ message: '멤버가 초대되었습니다.' })
  })

// GET /api/groups/:id/members
router.get('/:id/members', authMiddleware, async (req, res) => {
  const group_plan_id = req.params.id

  const { data, error } = await supabase
    .from('group_members')
    .select('user_id, joined_at, users(nickname, email)')
    .eq('group_plan_id', group_plan_id)

  if (error) return res.status(400).json({ message: error.message })

  res.json(data)
})

// POST /api/groups/:id/availability
router.post('/:id/availability', authMiddleware, async (req, res) => {
  const group_plan_id = req.params.id
  const { schedule_id, is_available } = req.body

  const { error } = await supabase
    .from('availability')
    .insert({ group_plan_id, schedule_id, is_available })

  if (error) return res.status(400).json({ message: error.message })

  res.status(201).json({ message: '가능 시간이 등록되었습니다.' })
})

// GET /api/groups/:id/recommend
router.get('/:id/recommend', authMiddleware, async (req, res) => {
  const group_plan_id = req.params.id

  const { data: members, error: memberError } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_plan_id', group_plan_id)

  if (memberError) return res.status(400).json({ message: memberError.message })

  const totalMembers = members.length

  const { data: slots, error: slotError } = await supabase
    .from('availability')
    .select('schedule_id, is_available, user_schedules(start_time, end_time, title)')
    .eq('group_plan_id', group_plan_id)
    .eq('is_available', true)

  if (slotError) return res.status(400).json({ message: slotError.message })

  const timeMap = {}

  slots.forEach(slot => {
    const key = slot.user_schedules.start_time + '_' + slot.user_schedules.end_time
    if (!timeMap[key]) {
      timeMap[key] = {
        start_time: slot.user_schedules.start_time,
        end_time: slot.user_schedules.end_time,
        count: 0
      }
    }
    timeMap[key].count += 1
  })

  const recommended = Object.values(timeMap)
    .filter(slot => slot.count === totalMembers)
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))

  res.json({ total_members: totalMembers, recommended })
})

// POST /api/groups/:id/confirm
router.post('/:id/confirm', authMiddleware, async (req, res) => {
  const group_plan_id = req.params.id
  const user_id = req.user.id
  const { start_time, end_time } = req.body

  const { data: plan, error: planError } = await supabase
    .from('group_plans')
    .select('owner_id')
    .eq('group_plan_id', group_plan_id)
    .single()

  if (planError) return res.status(400).json({ message: planError.message })

  if (plan.owner_id !== user_id) {
    return res.status(403).json({ message: '방장만 약속을 확정할 수 있습니다.' })
  }

  const { error: meetingError } = await supabase
    .from('meetings')
    .insert({ group_plan_id, start_time, end_time })

  if (meetingError) return res.status(400).json({ message: meetingError.message })

  await supabase
    .from('group_plans')
    .update({ status: 'CONFIRMED' })
    .eq('group_plan_id', group_plan_id)

  res.json({ message: '약속이 확정되었습니다.' })
})

export default router
