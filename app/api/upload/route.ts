import { existsSync } from "fs"
import { mkdir } from "fs/promises"
import { NextRequest, NextResponse } from "next/server"
import { join } from "path"

export async function POST(request: NextRequest) {
   
    const data = await request.formData()
    const  file : File | null = data.get("file") as unknown as File

    if (!file) {
        return NextResponse.json({ success: false })
        
    }
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadDir = join(process.cwd(), "public", "uploads")
    if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, {recursive : true})
    }

    const ext = file.name.split('.').pop()
    const UniqueName = crypto.randomUUID() + '.' + ext
    const filePath = join(uploadDir, UniqueName)
    const publicPath = `/uploads/${UniqueName}`
    return NextResponse.json({success: true, path: publicPath})

 

}