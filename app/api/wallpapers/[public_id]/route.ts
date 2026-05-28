import { NextResponse } from 'next/server'

export async function DELETE(
  request: Request,
  { params }: { params: { public_id: string } }
) {
  return NextResponse.json(
    {
      error: 'Delete API is not supported',
      public_id: params.public_id,
    },
    { status: 501 }
  )
}
