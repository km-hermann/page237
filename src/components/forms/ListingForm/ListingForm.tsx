'use client'

import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Upload, X, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ListingSchema, type ListingFormValues } from '@/lib/schemas/listing'
import Input from '@/components/ui/Input/Input'
import Select from '@/components/ui/Select/Select'
import Button from '@/components/ui/Button/Button'
import styles from './ListingForm.module.css'

interface TaxonomyItem {
  id: string
  name: string
}

interface ClassItem extends TaxonomyItem {
  section_id: string
}

interface ListingFormProps {
  sections: TaxonomyItem[]
  classes: ClassItem[]
  subjects: TaxonomyItem[]
  initialData?: {
    id: string
    title: string
    author?: string | null
    description?: string | null
    price: number
    condition: 'new' | 'good' | 'fair' | 'worn'
    section_id: string
    class_id: string
    subject_id: string
    image_urls: string[]
  }
  onSubmitAction: (values: ListingFormValues) => Promise<{ error?: string; success?: boolean; listingId?: string }>
}

export default function ListingForm({
  sections,
  classes,
  subjects,
  initialData,
  onSubmitAction,
}: ListingFormProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadedImages, setUploadedImages] = useState<string[]>(initialData?.image_urls || [])

  const resolver = zodResolver(ListingSchema) as unknown as Resolver<ListingFormValues>

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ListingFormValues>({
    resolver,
    defaultValues: {
      title: initialData?.title || '',
      author: initialData?.author || '',
      description: initialData?.description || '',
      price: initialData?.price || 0,
      condition: initialData?.condition || 'good',
      sectionId: initialData?.section_id || '',
      classId: initialData?.class_id || '',
      subjectId: initialData?.subject_id || '',
      imageUrls: initialData?.image_urls || [],
    },
  })

  const sectionId = watch('sectionId')

  // When section changes, clear class selection
  useEffect(() => {
    if (initialData && sectionId === initialData.section_id) {
      // Don't clear on initial load if editing
      return
    }
    setValue('classId', '')
  }, [sectionId, setValue, initialData])

  // Sync uploaded images state with form field
  useEffect(() => {
    setValue('imageUrls', uploadedImages, { shouldValidate: true })
  }, [uploadedImages, setValue])

  const filteredClasses = classes.filter((c) => c.section_id === sectionId)

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    if (uploadedImages.length + files.length > 5) {
      setError('You can upload a maximum of 5 images.')
      return
    }

    setUploading(true)
    setError(null)

    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      setError('You must be logged in to upload images.')
      setUploading(false)
      return
    }

    const newUrls: string[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      // Check file size (cap at 2MB to save storage space)
      if (file.size > 2 * 1024 * 1024) {
        setError(`File "${file.name}" is too large. Max size is 2MB.`)
        continue
      }

      // Generate unique file path
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`
      const filePath = `${session.user.id}/${fileName}`

      try {
        const { error: uploadError } = await supabase.storage
          .from('listing-images')
          .upload(filePath, file)

        if (uploadError) {
          throw uploadError
        }

        const { data: { publicUrl } } = supabase.storage
          .from('listing-images')
          .getPublicUrl(filePath)

        newUrls.push(publicUrl)
      } catch (err: any) {
        console.error('Image upload failed:', err)
        setError(err.message || 'Failed to upload image. Please try again.')
      }
    }

    setUploadedImages((prev) => [...prev, ...newUrls])
    setUploading(false)

    // Reset file input value
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeImage = (urlToRemove: string) => {
    setUploadedImages((prev) => prev.filter((url) => url !== urlToRemove))
  }

  const onSubmit = async (values: ListingFormValues) => {
    setError(null)
    const result = await onSubmitAction(values)

    if (result.error) {
      setError(result.error)
    } else if (result.success) {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      {error && (
        <div className="glass-panel" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.75rem 1rem', borderRadius: 'var(--border-radius-sm)', color: 'var(--error)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className={styles.row}>
        <Input
          id="title"
          label="Book/Pamphlet Title"
          required
          placeholder="e.g. Mastering Advanced Level Mathematics"
          error={errors.title?.message}
          {...register('title')}
        />

        <Input
          id="author"
          label="Author (Optional)"
          placeholder="e.g. J. K. Toya"
          error={errors.author?.message}
          {...register('author')}
        />
      </div>

      <div className={styles.row}>
        <Input
          id="price"
          label="Price (FCFA)"
          type="number"
          required
          placeholder="e.g. 5000"
          error={errors.price?.message}
          {...register('price')}
        />

        <Select
          id="condition"
          label="Book Condition"
          required
          error={errors.condition?.message}
          {...register('condition')}
        >
          <option className={styles.option} value="new">New / Like New</option>
          <option className={styles.option} value="good">Good (Lightly Used)</option>
          <option className={styles.option} value="fair">Fair (Some Wear)</option>
          <option className={styles.option} value="worn">Worn (Well Used)</option>
        </Select>
      </div>

      <div className={styles.row}>
        <Select
          id="sectionId"
          label="Section"
          required
          error={errors.sectionId?.message}
          {...register('sectionId')}
        >
          <option className={styles.option} value="">-- Select Section --</option>
          {sections.map((s) => (
            <option key={s.id} className={styles.option} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>

        <Select
          id="classId"
          label="Class"
          required
          disabled={!sectionId}
          error={errors.classId?.message}
          {...register('classId')}
        >
          <option className={styles.option} value="">
            {sectionId ? '-- Select Class --' : '-- Choose Section First --'}
          </option>
          {filteredClasses.map((c) => (
            <option key={c.id} className={styles.option} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>

      <Select
        id="subjectId"
        label="Subject"
        required
        error={errors.subjectId?.message}
        {...register('subjectId')}
      >
        <option className={styles.option} value="">-- Select Subject --</option>
        {subjects.map((s) => (
          <option key={s.id} className={styles.option} value={s.id}>
            {s.name}
          </option>
        ))}
      </Select>

      {/* Description Textarea */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <label htmlFor="description" style={{ fontSize: '0.9rem', fontWeight: 600 }}>
          Description / Additional Details
        </label>
        <textarea
          id="description"
          placeholder="Include details like publication year, notes written inside, chapters missing, or meeting location..."
          className={`${styles.textarea} glass-panel`}
          style={{ background: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)' }}
          {...register('description')}
        />
        {errors.description && <span className={styles.error}>{errors.description.message}</span>}
      </div>

      {/* Image Upload Dropzone */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>
          Photos (Max 5, Cap at 2MB per photo)
        </label>
        <div className={styles.uploadZone} onClick={handleUploadClick}>
          <Upload className={styles.uploadIcon} size={28} />
          <span className={styles.uploadTitle}>
            {uploading ? 'Uploading images...' : 'Click to upload photos'}
          </span>
          <span className={styles.uploadSubtitle}>
            Supports PNG, JPG, JPEG (will be compressed/resized on upload)
          </span>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            accept="image/*"
            style={{ display: 'none' }}
            disabled={uploading || uploadedImages.length >= 5}
          />
        </div>
        {errors.imageUrls && <span className={styles.error}>{errors.imageUrls.message}</span>}

        {/* Thumbnail Preview list */}
        {uploadedImages.length > 0 && (
          <div className={styles.imageGrid}>
            {uploadedImages.map((url, index) => (
              <div key={index} className={styles.imageContainer}>
                <Image
                  src={url}
                  alt={`Book preview ${index + 1}`}
                  fill
                  className={styles.image}
                  sizes="80px"
                />
                <button
                  type="button"
                  className={styles.removeButton}
                  onClick={() => removeImage(url)}
                  aria-label="Remove image"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.actions}>
        <Button
          type="button"
          variant="secondary"
          disabled={isSubmitting || uploading}
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting || uploading}>
          {initialData ? 'Update Listing' : 'Post Listing'}
        </Button>
      </div>
    </form>
  )
}
