import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { supabase } from './src/lib/supabase.js'
// import sessionRoutes from './routes/session.js'
// import journalRoutes from './routes/journal.js'

const app = express()
const PORT = process.env.PORT || 8080

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

// Routes
// app.use('/api/session', sessionRoutes)
// app.use('/api/journal', journalRoutes)

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }))

// Test DB
app.get('/test-db', async (req, res) => {
  const { data, error } = await supabase.from('sessions').select('*')
  res.json({ data, error })
})

app.listen(PORT, () => {
  console.log(`AfterThought server running on http://localhost:${PORT}`)
})