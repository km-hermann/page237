import { z } from 'zod'

export const ListingSchema = z.object({
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be under 100 characters'),
  author: z.string()
    .max(100, 'Author must be under 100 characters')
    .optional()
    .or(z.literal('')),
  description: z.string()
    .max(1000, 'Description must be under 1000 characters')
    .optional()
    .or(z.literal('')),
  price: z.preprocess(
    (val) => (val === '' ? undefined : Number(val)),
    z.number({
      message: 'Price must be a number',
    })
      .min(0, 'Price must be 0 or greater')
  ),
  condition: z.enum(['new', 'good', 'fair', 'worn']).refine((value) => ['new', 'good', 'fair', 'worn'].includes(value), {
    message: 'Please select a book condition',
  }),
  sectionId: z.string().uuid('Please select a valid section'),
  classId: z.string().uuid('Please select a valid class'),
  subjectId: z.string().uuid('Please select a valid subject'),
  imageUrls: z.array(z.string().url('Invalid image URL')).max(5, 'You can upload up to 5 images'),
})

export type ListingFormValues = z.infer<typeof ListingSchema>
