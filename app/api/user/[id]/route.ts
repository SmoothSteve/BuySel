import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getSession } from '@/lib/auth/session'

const TABLE = process.env.SUPABASE_PROFILE_TABLE || "user_profiles"

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const numericId = Number.parseInt(id, 10)

    if (Number.isNaN(numericId)) {
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 })
    }

    const { data: profile, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("id", numericId)
      .maybeSingle()

    if (error) {
      throw new Error(`Failed to fetch profile by id: ${error.message}`)
    }

    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (session.user.role !== 'admin' && session.user.id !== String(profile.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error("[api/user/:id][GET] error:", error)
    return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 })
  }
}
