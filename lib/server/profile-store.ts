import { supabase } from '@/lib/supabase'

export type UserProfile = {
  id?: number
  email: string
  firstname?: string | null
  lastname?: string | null
  middlename?: string | null
  dateofbirth?: string | null
  mobile?: string | null
  address?: string | null
  residencystatus?: 'citizen' | 'permanent' | 'temporary' | 'foreign' | '' | null
  maritalstatus?: 'single' | 'married' | 'divorced' | 'widowed' | 'defacto' | null
  powerofattorney?: string | null
  idtype?: 'passport' | 'driver' | 'none' | null
  idbloburl?: string | null
  idverified?: string | null
  termsconditions?: boolean | null
  privacypolicy?: boolean | null
  dte?: string | null
  ratesnotice?: string | null
  titlesearch?: string | null
  ratesnoticeverified?: string | null
  titlesearchverified?: string | null
  photoazurebloburl?: string | null
  photoverified?: string | null
  role?: string | null
  created_at?: string
  updated_at?: string
}

const TABLE = process.env.SUPABASE_PROFILE_TABLE || 'user_profiles'

const pickFields = (profile: Partial<UserProfile>) => ({
  id: profile.id,
  email: profile.email,
  firstname: profile.firstname ?? null,
  lastname: profile.lastname ?? null,
  middlename: profile.middlename ?? null,
  dateofbirth: profile.dateofbirth ?? null,
  mobile: profile.mobile ?? null,
  address: profile.address ?? null,
  residencystatus: profile.residencystatus ?? null,
  maritalstatus: profile.maritalstatus ?? null,
  powerofattorney: profile.powerofattorney ?? null,
  idtype: profile.idtype ?? 'none',
  idbloburl: profile.idbloburl ?? null,
  idverified: profile.idverified ?? null,
  termsconditions: profile.termsconditions ?? false,
  privacypolicy: profile.privacypolicy ?? false,
  dte: profile.dte ?? new Date().toISOString(),
  ratesnotice: profile.ratesnotice ?? null,
  titlesearch: profile.titlesearch ?? null,
  ratesnoticeverified: profile.ratesnoticeverified ?? null,
  titlesearchverified: profile.titlesearchverified ?? null,
  photoazurebloburl: profile.photoazurebloburl ?? null,
  photoverified: profile.photoverified ?? null,
  role: profile.role ?? 'user',
})

export async function getProfileByEmail(email: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('email', email)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to fetch profile by email: ${error.message}`)
  }

  return data as UserProfile | null
}

export async function getProfileById(id: number): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to fetch profile by id: ${error.message}`)
  }

  return data as UserProfile | null
}

export async function listProfiles(): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('id', { ascending: true })

  if (error) {
    throw new Error(`Failed to list profiles: ${error.message}`)
  }

  return (data || []) as UserProfile[]
}

export async function upsertProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
  if (!profile.email) {
    throw new Error('email is required to upsert profile')
  }

  const payload = pickFields(profile)

  const { data, error } = await supabase
    .from(TABLE)
    .upsert(payload, { onConflict: 'email' })
    .select('*')
    .single()

  if (error) {
    throw new Error(`Failed to upsert profile: ${error.message}`)
  }

  return data as UserProfile
}

export async function maybeDualWriteToAzure(profile: Partial<UserProfile>, method: 'POST' | 'PUT'): Promise<void> {
  if (process.env.PROFILE_DUAL_WRITE_AZURE !== 'true') {
    return
  }

  const azureBaseUrl = process.env.AZURE_BACKEND_API_URL || process.env.NEXT_PUBLIC_BACKEND_API_URL || 'https://buysel.azurewebsites.net'
  const response = await fetch(`${azureBaseUrl}/api/user`, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(profile),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Dual-write to Azure failed (${response.status}): ${errorText}`)
  }
}
