import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No PDF file provided.' }, { status: 400 })
    }

    // Forward the formData to the Python microservice on Hetzner
    const response = await fetch('http://89.167.48.64:3002/parse', {
      method: 'POST',
      body: formData, // Next.js fetch can handle FormData directly
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Python parser error:', response.status, errorText)
      return NextResponse.json({ error: 'Failed to parse resume.' }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error proxying parse request:', error)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
