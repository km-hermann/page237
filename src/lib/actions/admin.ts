'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

async function getAdminProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirectTo=/admin')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, is_admin')
    .eq('user_id', user.id)
    .single()

  if (!profile?.is_admin) {
    redirect('/')
  }

  return { supabase }
}

export async function removeListingAction(formData: FormData) {
  const listingId = String(formData.get('listingId') || '')
  if (!listingId) {
    return
  }

  const { supabase } = await getAdminProfile()
  const { error } = await supabase
    .from('listings')
    .update({ status: 'removed' })
    .eq('id', listingId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/admin')
  redirect('/admin')
}

export async function markListingStatusAction(formData: FormData) {
  const listingId = String(formData.get('listingId') || '')
  const status = String(formData.get('status') || '')
  if (!listingId || !status) {
    return
  }

  const { supabase } = await getAdminProfile()
  const { error } = await supabase
    .from('listings')
    .update({ status })
    .eq('id', listingId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/admin')
  redirect('/admin')
}

export async function resolveReportAction(formData: FormData) {
  const reportId = String(formData.get('reportId') || '')
  if (!reportId) {
    return
  }

  const { supabase } = await getAdminProfile()
  const { error } = await supabase
    .from('reports')
    .update({ status: 'resolved' })
    .eq('id', reportId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/admin')
  redirect('/admin')
}

export async function createSectionAction(formData: FormData) {
  const name = String(formData.get('name') || '').trim()
  const displayOrder = Number(formData.get('displayOrder') || 0)

  if (!name) {
    return
  }

  const { supabase } = await getAdminProfile()
  const { error } = await supabase.from('sections').insert({ name, display_order: displayOrder })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/admin')
  redirect('/admin')
}

export async function updateSectionAction(formData: FormData) {
  const id = String(formData.get('id') || '')
  const name = String(formData.get('name') || '').trim()
  const displayOrder = Number(formData.get('displayOrder') || 0)

  if (!id || !name) {
    return
  }

  const { supabase } = await getAdminProfile()
  const { error } = await supabase
    .from('sections')
    .update({ name, display_order: displayOrder })
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/admin')
  redirect('/admin')
}

export async function deleteSectionAction(formData: FormData) {
  const id = String(formData.get('id') || '')
  if (!id) {
    return
  }

  const { supabase } = await getAdminProfile()
  const { error } = await supabase.from('sections').delete().eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/admin')
  redirect('/admin')
}

export async function createClassAction(formData: FormData) {
  const sectionId = String(formData.get('sectionId') || '')
  const name = String(formData.get('name') || '').trim()
  const displayOrder = Number(formData.get('displayOrder') || 0)

  if (!sectionId || !name) {
    return
  }

  const { supabase } = await getAdminProfile()
  const { error } = await supabase.from('classes').insert({ section_id: sectionId, name, display_order: displayOrder })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/admin')
  redirect('/admin')
}

export async function updateClassAction(formData: FormData) {
  const id = String(formData.get('id') || '')
  const sectionId = String(formData.get('sectionId') || '')
  const name = String(formData.get('name') || '').trim()
  const displayOrder = Number(formData.get('displayOrder') || 0)

  if (!id || !sectionId || !name) {
    return
  }

  const { supabase } = await getAdminProfile()
  const { error } = await supabase
    .from('classes')
    .update({ section_id: sectionId, name, display_order: displayOrder })
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/admin')
  redirect('/admin')
}

export async function deleteClassAction(formData: FormData) {
  const id = String(formData.get('id') || '')
  if (!id) {
    return
  }

  const { supabase } = await getAdminProfile()
  const { error } = await supabase.from('classes').delete().eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/admin')
  redirect('/admin')
}

export async function createSubjectAction(formData: FormData) {
  const name = String(formData.get('name') || '').trim()
  const active = String(formData.get('active') || 'true') === 'true'

  if (!name) {
    return
  }

  const { supabase } = await getAdminProfile()
  const { error } = await supabase.from('subjects').insert({ name, active })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/admin')
  redirect('/admin')
}

export async function updateSubjectAction(formData: FormData) {
  const id = String(formData.get('id') || '')
  const name = String(formData.get('name') || '').trim()
  const active = String(formData.get('active') || 'true') === 'true'

  if (!id || !name) {
    return
  }

  const { supabase } = await getAdminProfile()
  const { error } = await supabase
    .from('subjects')
    .update({ name, active })
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/admin')
  redirect('/admin')
}

export async function deleteSubjectAction(formData: FormData) {
  const id = String(formData.get('id') || '')
  if (!id) {
    return
  }

  const { supabase } = await getAdminProfile()
  const { error } = await supabase.from('subjects').delete().eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/admin')
  redirect('/admin')
}
