import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  createClassAction,
  createSectionAction,
  createSubjectAction,
  deleteClassAction,
  deleteSectionAction,
  deleteSubjectAction,
  markListingStatusAction,
  removeListingAction,
  resolveReportAction,
  updateClassAction,
  updateSectionAction,
  updateSubjectAction,
} from '@/lib/actions/admin'
import styles from './page.module.css'

const sidebarSections = [
  { key: 'overview', label: 'Overview' },
  { key: 'listings', label: 'Listings' },
  { key: 'taxonomy', label: 'Taxonomy' },
  { key: 'reports', label: 'Reports' },
] as const

type AdminView = (typeof sidebarSections)[number]['key']

export const metadata = {
  title: 'Admin Dashboard — Page237',
  description: 'Moderate listings and manage the platform taxonomy for Page237.',
}

interface AdminPageProps {
  searchParams: Promise<{ view?: string }>
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = await searchParams
  const rawView = params.view
  const view: AdminView = sidebarSections.some((item) => item.key === rawView)
    ? (rawView as AdminView)
    : 'overview'

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

  const [{ data: listings }, { data: reports }, { data: sections }, { data: classes }, { data: subjects }] = await Promise.all([
    supabase
      .from('listings')
      .select('id, title, status, created_at, seller_id')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('reports')
      .select('id, reason, status, created_at, listing_id')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase.from('sections').select('id, name, display_order').order('display_order', { ascending: true }),
    supabase.from('classes').select('id, section_id, name, display_order').order('display_order', { ascending: true }),
    supabase.from('subjects').select('id, name, active').order('name', { ascending: true }),
  ])

  const safeListings = listings || []
  const safeReports = reports || []
  const safeSections = sections || []
  const safeClasses = classes || []
  const safeSubjects = subjects || []

  const totalListings = safeListings.length
  const availableListings = safeListings.filter((item) => item.status === 'available').length
  const soldListings = safeListings.filter((item) => item.status === 'sold').length
  const openReports = safeReports.filter((item) => item.status === 'open').length

  return (
    <div className={`${styles.container} container`}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Admin dashboard</h1>
          <p className={styles.subtitle}>Moderate listings, manage taxonomy, and keep the platform organised.</p>
        </div>
      </div>

      <div className={styles.workspace}>
        <aside className={`${styles.sidebar} glass-panel`}>
          <div className={styles.sidebarTitle}>Platform tools</div>
          <nav className={styles.sidebarNav}>
            {sidebarSections.map((item) => (
              <a
                key={item.key}
                href={`/admin?view=${item.key}`}
                className={`${styles.sidebarLink} ${view === item.key ? styles.activeLink : ''}`}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </aside>

        <div className={styles.content}>
          {view === 'overview' && (
            <section id="overview" className={styles.section}>
              <div className={styles.statsGrid}>
                <div className={`${styles.statCard} glass-panel`}>
                  <span className={styles.statLabel}>Total listings</span>
                  <span className={styles.statValue}>{totalListings}</span>
                </div>
                <div className={`${styles.statCard} glass-panel`}>
                  <span className={styles.statLabel}>Available</span>
                  <span className={styles.statValue}>{availableListings}</span>
                </div>
                <div className={`${styles.statCard} glass-panel`}>
                  <span className={styles.statLabel}>Sold</span>
                  <span className={styles.statValue}>{soldListings}</span>
                </div>
                <div className={`${styles.statCard} glass-panel`}>
                  <span className={styles.statLabel}>Open reports</span>
                  <span className={styles.statValue}>{openReports}</span>
                </div>
              </div>
            </section>
          )}

          {view === 'listings' && (
            <section id="listings" className={`${styles.panel} glass-panel`}>
              <h2 className={styles.panelTitle}>Listings</h2>
              {safeListings.length === 0 ? (
                <div className={styles.emptyState}>No listings found.</div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {safeListings.map((listing) => (
                      <tr key={listing.id}>
                        <td>{listing.title}</td>
                        <td><span className={styles.badge}>{listing.status}</span></td>
                        <td>{new Date(listing.created_at).toLocaleDateString()}</td>
                        <td>
                          <div className={styles.actions}>
                            <Link href={`/listings/${listing.id}`} className={styles.secondaryButton}>View</Link>
                            {listing.status !== 'available' && (
                              <form action={markListingStatusAction}>
                                <input type="hidden" name="listingId" value={listing.id} />
                                <input type="hidden" name="status" value="available" />
                                <button className={styles.actionButton} type="submit">Restore</button>
                              </form>
                            )}
                            {listing.status !== 'sold' && (
                              <form action={markListingStatusAction}>
                                <input type="hidden" name="listingId" value={listing.id} />
                                <input type="hidden" name="status" value="sold" />
                                <button className={styles.actionButton} type="submit">Mark sold</button>
                              </form>
                            )}
                            {listing.status !== 'removed' && (
                              <form action={removeListingAction}>
                                <input type="hidden" name="listingId" value={listing.id} />
                                <button className={styles.secondaryButton} type="submit">Remove</button>
                              </form>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          )}

          {view === 'taxonomy' && (
            <section id="taxonomy" className={`${styles.panel} glass-panel`}>
              <h2 className={styles.panelTitle}>Taxonomy management</h2>

              <div className={styles.taxonomySection}>
                <h3>Sections</h3>
                <form action={createSectionAction} className={styles.inlineForm}>
                  <input className={styles.input} name="name" placeholder="Section name" required />
                  <input className={styles.input} name="displayOrder" type="number" defaultValue={0} placeholder="Order" />
                  <button className={styles.actionButton} type="submit">Add section</button>
                </form>
                <div className={styles.listStack}>
                  {safeSections.map((section) => (
                    <div key={section.id} className={styles.rowForm}>
                      <form action={updateSectionAction} className={styles.inlineForm}>
                        <input type="hidden" name="id" value={section.id} />
                        <input className={styles.input} name="name" defaultValue={section.name} required />
                        <input className={styles.input} name="displayOrder" type="number" defaultValue={section.display_order ?? 0} />
                        <button className={styles.actionButton} type="submit">Save</button>
                      </form>
                      <form action={deleteSectionAction}>
                        <input type="hidden" name="id" value={section.id} />
                        <button className={styles.secondaryButton} type="submit">Delete</button>
                      </form>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.taxonomySection}>
                <h3>Classes</h3>
                <form action={createClassAction} className={styles.inlineForm}>
                  <select className={styles.select} name="sectionId" required>
                    <option value="">Select section</option>
                    {safeSections.map((section) => (
                      <option key={section.id} value={section.id}>{section.name}</option>
                    ))}
                  </select>
                  <input className={styles.input} name="name" placeholder="Class name" required />
                  <input className={styles.input} name="displayOrder" type="number" defaultValue={0} />
                  <button className={styles.actionButton} type="submit">Add class</button>
                </form>
                <div className={styles.listStack}>
                  {safeClasses.map((classItem) => (
                    <div key={classItem.id} className={styles.rowForm}>
                      <form action={updateClassAction} className={styles.inlineForm}>
                        <input type="hidden" name="id" value={classItem.id} />
                        <select className={styles.select} name="sectionId" defaultValue={classItem.section_id} required>
                          {safeSections.map((section) => (
                            <option key={section.id} value={section.id}>{section.name}</option>
                          ))}
                        </select>
                        <input className={styles.input} name="name" defaultValue={classItem.name} required />
                        <input className={styles.input} name="displayOrder" type="number" defaultValue={classItem.display_order ?? 0} />
                        <button className={styles.actionButton} type="submit">Save</button>
                      </form>
                      <form action={deleteClassAction}>
                        <input type="hidden" name="id" value={classItem.id} />
                        <button className={styles.secondaryButton} type="submit">Delete</button>
                      </form>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.taxonomySection}>
                <h3>Subjects</h3>
                <form action={createSubjectAction} className={styles.inlineForm}>
                  <input className={styles.input} name="name" placeholder="Subject name" required />
                  <label className={styles.checkboxRow}>
                    <input type="checkbox" name="active" value="true" defaultChecked />
                    Active
                  </label>
                  <button className={styles.actionButton} type="submit">Add subject</button>
                </form>
                <div className={styles.listStack}>
                  {safeSubjects.map((subject) => (
                    <div key={subject.id} className={styles.rowForm}>
                      <form action={updateSubjectAction} className={styles.inlineForm}>
                        <input type="hidden" name="id" value={subject.id} />
                        <input className={styles.input} name="name" defaultValue={subject.name} required />
                        <label className={styles.checkboxRow}>
                          <input type="checkbox" name="active" value="true" defaultChecked={subject.active} />
                          Active
                        </label>
                        <button className={styles.actionButton} type="submit">Save</button>
                      </form>
                      <form action={deleteSubjectAction}>
                        <input type="hidden" name="id" value={subject.id} />
                        <button className={styles.secondaryButton} type="submit">Delete</button>
                      </form>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {view === 'reports' && (
            <section id="reports" className={`${styles.panel} glass-panel`}>
              <h2 className={styles.panelTitle}>Reports</h2>
              {safeReports.length === 0 ? (
                <div className={styles.emptyState}>No reports found.</div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Reason</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {safeReports.map((report) => (
                      <tr key={report.id}>
                        <td>{report.reason}</td>
                        <td><span className={styles.badge}>{report.status}</span></td>
                        <td>{new Date(report.created_at).toLocaleDateString()}</td>
                        <td>
                          {report.status !== 'resolved' && (
                            <form action={resolveReportAction}>
                              <input type="hidden" name="reportId" value={report.id} />
                              <button className={styles.actionButton} type="submit">Resolve</button>
                            </form>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
