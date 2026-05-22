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

  res.status(201).json({
    group_plan_id: data.group_plan_id,
    message: '약속 방이 생성되었습니다.'
  })
})

export default router