import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import path from 'path'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const files = formData.getAll('files') as File[]

  const saved: string[] = []

  for (const file of files) {
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const ext = file.name.split('.').pop() || 'png'
    const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
    const filepath = path.join(process.cwd(), 'public', 'uploads', filename)
    await writeFile(filepath, buffer)
    saved.push(`/uploads/${filename}`)
  }

  return NextResponse.json({ paths: saved })
}
