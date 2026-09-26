import { NextResponse } from 'next/server'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ public_id: string }> }
) {
  const { public_id } = await params
  return NextResponse.json(
    {
      error: 'Delete API is not supported',
      public_id,
    },
    { status: 501 }
  )
}
