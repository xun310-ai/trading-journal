import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const files = formData.getAll('files') as File[]

  const paths: string[] = []

  for (const file of files) {
    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const mime = file.type || 'image/png'
    paths.push(`data:${mime};base64,${base64}`)
  }

  return NextResponse.json({ paths })
}
