import { useState, useEffect, useMemo } from 'react'

// LocalStorage helpers
const storage = {
  get: (key, fallback) => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : fallback
    } catch { return fallback }
  },
  set: (key, value) => localStorage.setItem(key, JSON.stringify(value))
}

// Generate unique IDs
const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2)

// Sample data for initial load
const sampleContacts = [
  { id: '1', name: 'James Wilson', email: 'james.w@email.com', phone: '07700 123456', company: 'Wilson Angling Club', type: 'business', notes: 'Bulk buyer, interested in carp equipment', createdAt: '2025-11-15' },
  { id: '2', name: 'Sarah Chen', email: 's.chen@email.com', phone: '07700 234567', company: '', type: 'individual', notes: 'Fly fishing enthusiast', createdAt: '2025-12-01' },
  { id: '3', name: 'Mike Thompson', email: 'mike.t@email.com', phone: '07700 345678', company: 'Lakeside Tackle Shop', type: 'business', notes: 'Potential wholesale partner', createdAt: '2026-01-10' },
  { id: '4', name: 'Emma Davies', email: 'emma.d@email.com', phone: '07700 456789', company: '', type: 'individual', notes: 'Regular customer, pike fishing specialist', createdAt: '2025-10-20' },
  { id: '5', name: 'Tom Richards', email: 'tom.r@email.com', phone: '07700 567890', company: 'Sea Breeze Charters', type: 'business', notes: 'Charter boat operator, needs saltwater gear', createdAt: '2026-01-25' },
]

const sampleDeals = [
  { id: '1', title: 'Wilson Club Equipment Order', value: 2500, stage: 'proposal', contactId: '1', probability: 70, expectedClose: '2026-02-28', notes: 'Annual equipment refresh' },
  { id: '2', title: 'Fly Fishing Starter Kit', value: 350, stage: 'qualified', contactId: '2', probability: 80, expectedClose: '2026-02-15', notes: 'Complete beginner setup' },
  { id: '3', title: 'Lakeside Wholesale Partnership', value: 15000, stage: 'negotiation', contactId: '3', probability: 50, expectedClose: '2026-03-31', notes: 'Monthly supply agreement' },
  { id: '4', title: 'Pike Lure Collection', value: 180, stage: 'won', contactId: '4', probability: 100, expectedClose: '2026-01-20', notes: 'Premium lure set' },
  { id: '5', title: 'Charter Saltwater Package', value: 4200, stage: 'lead', contactId: '5', probability: 30, expectedClose: '2026-04-15', notes: 'Full charter boat equipment' },
  { id: '6', title: 'Budget Rod Bundle', value: 120, stage: 'lost', contactId: '2', probability: 0, expectedClose: '2026-01-10', notes: 'Customer went with competitor' },
]

const sampleActivities = [
  { id: '1', type: 'call', contactId: '1', dealId: '1', description: 'Discussed equipment needs for upcoming season', date: '2026-02-01T10:30:00' },
  { id: '2', type: 'email', contactId: '3', dealId: '3', description: 'Sent wholesale pricing proposal', date: '2026-02-01T14:00:00' },
  { id: '3', type: 'meeting', contactId: '5', dealId: '5', description: 'On-site visit to Sea Breeze marina', date: '2026-01-30T09:00:00' },
  { id: '4', type: 'note', contactId: '2', dealId: '2', description: 'Customer confirmed budget of £400', date: '2026-01-29T16:45:00' },
  { id: '5', type: 'call', contactId: '4', dealId: '4', description: 'Follow-up on delivered pike lures - very satisfied', date: '2026-01-25T11:00:00' },
  { id: '6', type: 'email', contactId: '1', dealId: '1', description: 'Sent updated quote with volume discount', date: '2026-01-28T13:30:00' },
]

const STAGES = ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost']
const STAGE_COLORS = { lead: '#64748b', qualified: '#0ea5e9', proposal: '#8b5cf6', negotiation: '#f59e0b', won: '#10b981', lost: '#ef4444' }
const ACTIVITY_ICONS = { call: '📞', email: '✉️', meeting: '🤝', note: '📝' }

export default function App() {
  const [view, setView] = useState('dashboard')
  const [contacts, setContacts] = useState(() => storage.get('hl_contacts', sampleContacts))
  const [deals, setDeals] = useState(() => storage.get('hl_deals', sampleDeals))
  const [activities, setActivities] = useState(() => storage.get('hl_activities', sampleActivities))
  const [selectedContact, setSelectedContact] = useState(null)
  const [editingContact, setEditingContact] = useState(null)
  const [editingDeal, setEditingDeal] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [draggedDeal, setDraggedDeal] = useState(null)
  const [showActivityForm, setShowActivityForm] = useState(false)

  // Persist to localStorage
  useEffect(() => { storage.set('hl_contacts', contacts) }, [contacts])
  useEffect(() => { storage.set('hl_deals', deals) }, [deals])
  useEffect(() => { storage.set('hl_activities', activities) }, [activities])

  // KPIs
  const kpis = useMemo(() => {
    const activeDeals = deals.filter(d => !['won', 'lost'].includes(d.stage))
    const pipelineValue = activeDeals.reduce((sum, d) => sum + d.value * (d.probability / 100), 0)
    const wonValue = deals.filter(d => d.stage === 'won').reduce((sum, d) => sum + d.value, 0)
    return {
      totalContacts: contacts.length,
      activeDeals: activeDeals.length,
      pipelineValue,
      wonValue,
      recentActivities: activities.slice(0, 5)
    }
  }, [contacts, deals, activities])

  // Filtered contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.company.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = filterType === 'all' || c.type === filterType
      return matchesSearch && matchesType
    })
  }, [contacts, searchTerm, filterType])

  // Handlers
  const saveContact = (contact) => {
    if (contact.id) {
      setContacts(prev => prev.map(c => c.id === contact.id ? contact : c))
    } else {
      setContacts(prev => [...prev, { ...contact, id: genId(), createdAt: new Date().toISOString().split('T')[0] }])
    }
    setEditingContact(null)
  }

  const deleteContact = (id) => {
    if (confirm('Delete this contact and all associated deals?')) {
      setContacts(prev => prev.filter(c => c.id !== id))
      setDeals(prev => prev.filter(d => d.contactId !== id))
      setActivities(prev => prev.filter(a => a.contactId !== id))
      setSelectedContact(null)
    }
  }

  const saveDeal = (deal) => {
    if (deal.id) {
      setDeals(prev => prev.map(d => d.id === deal.id ? deal : d))
    } else {
      setDeals(prev => [...prev, { ...deal, id: genId() }])
    }
    setEditingDeal(null)
  }

  const deleteDeal = (id) => {
    if (confirm('Delete this deal?')) {
      setDeals(prev => prev.filter(d => d.id !== id))
      setActivities(prev => prev.filter(a => a.dealId !== id))
    }
  }

  const handleDragStart = (deal) => setDraggedDeal(deal)
  const handleDragOver = (e) => e.preventDefault()
  const handleDrop = (stage) => {
    if (draggedDeal) {
      const newProbability = stage === 'won' ? 100 : stage === 'lost' ? 0 : draggedDeal.probability
      setDeals(prev => prev.map(d => d.id === draggedDeal.id ? { ...d, stage, probability: newProbability } : d))
      setDraggedDeal(null)
    }
  }

  const saveActivity = (activity) => {
    setActivities(prev => [{ ...activity, id: genId(), date: new Date().toISOString() }, ...prev])
    setShowActivityForm(false)
  }

  const getContactName = (id) => contacts.find(c => c.id === id)?.name || 'Unknown'
  const getDealTitle = (id) => deals.find(d => d.id === id)?.title || ''

  const formatCurrency = (val) => '£' + val.toLocaleString('en-GB', { minimumFractionDigits: 0 })
  const formatDate = (date) => new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  const formatDateTime = (date) => new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

  return (
    <div style={styles.container}>
      <style>{cssStyles}</style>

      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.logo}>🎣 <span>Hook & Line</span></div>
        <nav>
          {[
            { id: 'dashboard', icon: '📊', label: 'Dashboard' },
            { id: 'contacts', icon: '👥', label: 'Contacts' },
            { id: 'deals', icon: '💼', label: 'Deals' },
            { id: 'activities', icon: '📋', label: 'Activities' },
          ].map(item => (
            <div
              key={item.id}
              style={{ ...styles.navItem, ...(view === item.id ? styles.navItemActive : {}) }}
              onClick={() => { setView(item.id); setSelectedContact(null); setEditingContact(null); setEditingDeal(null) }}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main style={styles.main}>
        {/* Dashboard View */}
        {view === 'dashboard' && (
          <>
            <h1 style={styles.pageTitle}>Dashboard</h1>
            <div style={styles.metrics}>
              <MetricCard label="Total Contacts" value={kpis.totalContacts} icon="👥" />
              <MetricCard label="Active Deals" value={kpis.activeDeals} icon="💼" />
              <MetricCard label="Pipeline Value" value={formatCurrency(kpis.pipelineValue)} icon="📈" />
              <MetricCard label="Won This Year" value={formatCurrency(kpis.wonValue)} icon="🏆" color="#10b981" />
            </div>

            <div style={styles.dashboardGrid}>
              <div style={styles.card}>
                <h2 style={styles.cardTitle}>Recent Activities</h2>
                {kpis.recentActivities.map(a => (
                  <div key={a.id} style={styles.activityItem}>
                    <span style={styles.activityIcon}>{ACTIVITY_ICONS[a.type]}</span>
                    <div style={styles.activityContent}>
                      <div style={styles.activityDesc}>{a.description}</div>
                      <div style={styles.activityMeta}>{getContactName(a.contactId)} • {formatDateTime(a.date)}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={styles.card}>
                <h2 style={styles.cardTitle}>Deal Pipeline</h2>
                {STAGES.filter(s => !['won', 'lost'].includes(s)).map(stage => {
                  const stageDeals = deals.filter(d => d.stage === stage)
                  const stageValue = stageDeals.reduce((sum, d) => sum + d.value, 0)
                  return (
                    <div key={stage} style={styles.pipelineRow}>
                      <div style={styles.pipelineStage}>
                        <span style={{ ...styles.stageDot, background: STAGE_COLORS[stage] }}></span>
                        {stage.charAt(0).toUpperCase() + stage.slice(1)}
                      </div>
                      <div style={styles.pipelineValue}>{stageDeals.length} deals • {formatCurrency(stageValue)}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {/* Contacts View */}
        {view === 'contacts' && !selectedContact && !editingContact && (
          <>
            <div style={styles.headerRow}>
              <h1 style={styles.pageTitle}>Contacts</h1>
              <button style={styles.btn} onClick={() => setEditingContact({ name: '', email: '', phone: '', company: '', type: 'individual', notes: '' })}>
                + Add Contact
              </button>
            </div>
            <div style={styles.filters}>
              <input
                type="text"
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.search}
              />
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={styles.select}>
                <option value="all">All Types</option>
                <option value="individual">Individuals</option>
                <option value="business">Businesses</option>
              </select>
            </div>
            <div style={styles.card}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Email</th>
                    <th style={styles.th} className="hide-mobile">Company</th>
                    <th style={styles.th} className="hide-mobile">Type</th>
                    <th style={styles.th}>Deals</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContacts.map(c => (
                    <tr key={c.id} style={styles.tr} onClick={() => setSelectedContact(c)}>
                      <td style={styles.td}>{c.name}</td>
                      <td style={styles.td}>{c.email}</td>
                      <td style={styles.td} className="hide-mobile">{c.company || '-'}</td>
                      <td style={styles.td} className="hide-mobile">
                        <span style={{ ...styles.badge, background: c.type === 'business' ? '#dbeafe' : '#fef3c7', color: c.type === 'business' ? '#1e40af' : '#92400e' }}>
                          {c.type}
                        </span>
                      </td>
                      <td style={styles.td}>{deals.filter(d => d.contactId === c.id).length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Contact Detail View */}
        {view === 'contacts' && selectedContact && !editingContact && (
          <>
            <button style={styles.backBtn} onClick={() => setSelectedContact(null)}>← Back to Contacts</button>
            <div style={styles.detailHeader}>
              <div>
                <h1 style={styles.pageTitle}>{selectedContact.name}</h1>
                <span style={{ ...styles.badge, background: selectedContact.type === 'business' ? '#dbeafe' : '#fef3c7', color: selectedContact.type === 'business' ? '#1e40af' : '#92400e' }}>
                  {selectedContact.type}
                </span>
              </div>
              <div style={styles.btnGroup}>
                <button style={styles.btn} onClick={() => setEditingContact(selectedContact)}>Edit</button>
                <button style={{ ...styles.btn, background: '#ef4444' }} onClick={() => deleteContact(selectedContact.id)}>Delete</button>
              </div>
            </div>
            <div style={styles.detailGrid}>
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Contact Info</h3>
                <div style={styles.infoRow}><span style={styles.infoLabel}>Email:</span> {selectedContact.email}</div>
                <div style={styles.infoRow}><span style={styles.infoLabel}>Phone:</span> {selectedContact.phone}</div>
                <div style={styles.infoRow}><span style={styles.infoLabel}>Company:</span> {selectedContact.company || '-'}</div>
                <div style={styles.infoRow}><span style={styles.infoLabel}>Added:</span> {formatDate(selectedContact.createdAt)}</div>
                {selectedContact.notes && <div style={styles.infoRow}><span style={styles.infoLabel}>Notes:</span> {selectedContact.notes}</div>}
              </div>
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Deals ({deals.filter(d => d.contactId === selectedContact.id).length})</h3>
                {deals.filter(d => d.contactId === selectedContact.id).map(d => (
                  <div key={d.id} style={styles.dealItem}>
                    <div style={styles.dealTitle}>{d.title}</div>
                    <div style={styles.dealMeta}>
                      <span style={{ ...styles.stageBadge, background: STAGE_COLORS[d.stage] }}>{d.stage}</span>
                      {formatCurrency(d.value)}
                    </div>
                  </div>
                ))}
                {deals.filter(d => d.contactId === selectedContact.id).length === 0 && <p style={styles.emptyText}>No deals yet</p>}
              </div>
            </div>
          </>
        )}

        {/* Contact Form */}
        {view === 'contacts' && editingContact && (
          <ContactForm
            contact={editingContact}
            onSave={saveContact}
            onCancel={() => { setEditingContact(null); if (!editingContact.id) setSelectedContact(null) }}
          />
        )}

        {/* Deals Kanban View */}
        {view === 'deals' && !editingDeal && (
          <>
            <div style={styles.headerRow}>
              <h1 style={styles.pageTitle}>Deals</h1>
              <button style={styles.btn} onClick={() => setEditingDeal({ title: '', value: 0, stage: 'lead', contactId: '', probability: 30, expectedClose: '', notes: '' })}>
                + Add Deal
              </button>
            </div>
            <div style={styles.kanban}>
              {STAGES.map(stage => (
                <div
                  key={stage}
                  style={styles.kanbanColumn}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(stage)}
                >
                  <div style={styles.kanbanHeader}>
                    <span style={{ ...styles.stageDot, background: STAGE_COLORS[stage] }}></span>
                    {stage.charAt(0).toUpperCase() + stage.slice(1)}
                    <span style={styles.kanbanCount}>{deals.filter(d => d.stage === stage).length}</span>
                  </div>
                  <div style={styles.kanbanCards}>
                    {deals.filter(d => d.stage === stage).map(deal => (
                      <div
                        key={deal.id}
                        style={styles.kanbanCard}
                        draggable
                        onDragStart={() => handleDragStart(deal)}
                        onClick={() => setEditingDeal(deal)}
                      >
                        <div style={styles.kanbanCardTitle}>{deal.title}</div>
                        <div style={styles.kanbanCardMeta}>
                          <span>{getContactName(deal.contactId)}</span>
                          <span style={styles.kanbanCardValue}>{formatCurrency(deal.value)}</span>
                        </div>
                        {deal.expectedClose && <div style={styles.kanbanCardDate}>Close: {formatDate(deal.expectedClose)}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Deal Form */}
        {view === 'deals' && editingDeal && (
          <DealForm
            deal={editingDeal}
            contacts={contacts}
            onSave={saveDeal}
            onDelete={editingDeal.id ? () => deleteDeal(editingDeal.id) : null}
            onCancel={() => setEditingDeal(null)}
          />
        )}

        {/* Activities View */}
        {view === 'activities' && (
          <>
            <div style={styles.headerRow}>
              <h1 style={styles.pageTitle}>Activities</h1>
              <button style={styles.btn} onClick={() => setShowActivityForm(true)}>+ Add Activity</button>
            </div>

            {showActivityForm && (
              <ActivityForm
                contacts={contacts}
                deals={deals}
                onSave={saveActivity}
                onCancel={() => setShowActivityForm(false)}
              />
            )}

            <div style={styles.timeline}>
              {activities.map(a => (
                <div key={a.id} style={styles.timelineItem}>
                  <div style={styles.timelineIcon}>{ACTIVITY_ICONS[a.type]}</div>
                  <div style={styles.timelineContent}>
                    <div style={styles.timelineHeader}>
                      <span style={styles.timelineType}>{a.type.charAt(0).toUpperCase() + a.type.slice(1)}</span>
                      <span style={styles.timelineDate}>{formatDateTime(a.date)}</span>
                    </div>
                    <div style={styles.timelineDesc}>{a.description}</div>
                    <div style={styles.timelineMeta}>
                      {getContactName(a.contactId)}
                      {a.dealId && ` • ${getDealTitle(a.dealId)}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

// Contact Form Component
function ContactForm({ contact, onSave, onCancel }) {
  const [form, setForm] = useState(contact)
  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  return (
    <div style={styles.card}>
      <h2 style={styles.cardTitle}>{contact.id ? 'Edit Contact' : 'New Contact'}</h2>
      <div style={styles.formGrid}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Name *</label>
          <input style={styles.input} value={form.name} onChange={e => update('name', e.target.value)} placeholder="Full name" />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Email *</label>
          <input style={styles.input} type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="email@example.com" />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Phone</label>
          <input style={styles.input} value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="07700 123456" />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Company</label>
          <input style={styles.input} value={form.company} onChange={e => update('company', e.target.value)} placeholder="Company name" />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Type</label>
          <select style={styles.input} value={form.type} onChange={e => update('type', e.target.value)}>
            <option value="individual">Individual</option>
            <option value="business">Business</option>
          </select>
        </div>
        <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
          <label style={styles.label}>Notes</label>
          <textarea style={{ ...styles.input, minHeight: '80px' }} value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="Add notes..." />
        </div>
      </div>
      <div style={styles.formActions}>
        <button style={styles.btnSecondary} onClick={onCancel}>Cancel</button>
        <button style={styles.btn} onClick={() => onSave(form)} disabled={!form.name || !form.email}>Save Contact</button>
      </div>
    </div>
  )
}

// Deal Form Component
function DealForm({ deal, contacts, onSave, onDelete, onCancel }) {
  const [form, setForm] = useState(deal)
  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  return (
    <div style={styles.card}>
      <h2 style={styles.cardTitle}>{deal.id ? 'Edit Deal' : 'New Deal'}</h2>
      <div style={styles.formGrid}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Title *</label>
          <input style={styles.input} value={form.title} onChange={e => update('title', e.target.value)} placeholder="Deal title" />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Contact *</label>
          <select style={styles.input} value={form.contactId} onChange={e => update('contactId', e.target.value)}>
            <option value="">Select contact...</option>
            {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Value (£)</label>
          <input style={styles.input} type="number" value={form.value} onChange={e => update('value', Number(e.target.value))} />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Stage</label>
          <select style={styles.input} value={form.stage} onChange={e => update('stage', e.target.value)}>
            {STAGES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Probability (%)</label>
          <input style={styles.input} type="number" min="0" max="100" value={form.probability} onChange={e => update('probability', Number(e.target.value))} />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Expected Close</label>
          <input style={styles.input} type="date" value={form.expectedClose} onChange={e => update('expectedClose', e.target.value)} />
        </div>
        <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
          <label style={styles.label}>Notes</label>
          <textarea style={{ ...styles.input, minHeight: '80px' }} value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="Add notes..." />
        </div>
      </div>
      <div style={styles.formActions}>
        {onDelete && <button style={{ ...styles.btn, background: '#ef4444' }} onClick={onDelete}>Delete</button>}
        <div style={{ flex: 1 }}></div>
        <button style={styles.btnSecondary} onClick={onCancel}>Cancel</button>
        <button style={styles.btn} onClick={() => onSave(form)} disabled={!form.title || !form.contactId}>Save Deal</button>
      </div>
    </div>
  )
}

// Activity Form Component
function ActivityForm({ contacts, deals, onSave, onCancel }) {
  const [form, setForm] = useState({ type: 'call', contactId: '', dealId: '', description: '' })
  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }))
  const contactDeals = form.contactId ? deals.filter(d => d.contactId === form.contactId) : []

  return (
    <div style={{ ...styles.card, marginBottom: '20px' }}>
      <h3 style={styles.cardTitle}>Log Activity</h3>
      <div style={styles.formGrid}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Type</label>
          <select style={styles.input} value={form.type} onChange={e => update('type', e.target.value)}>
            <option value="call">📞 Call</option>
            <option value="email">✉️ Email</option>
            <option value="meeting">🤝 Meeting</option>
            <option value="note">📝 Note</option>
          </select>
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Contact *</label>
          <select style={styles.input} value={form.contactId} onChange={e => update('contactId', e.target.value)}>
            <option value="">Select contact...</option>
            {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Deal (optional)</label>
          <select style={styles.input} value={form.dealId} onChange={e => update('dealId', e.target.value)} disabled={!form.contactId}>
            <option value="">No deal</option>
            {contactDeals.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
          </select>
        </div>
        <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
          <label style={styles.label}>Description *</label>
          <textarea style={{ ...styles.input, minHeight: '60px' }} value={form.description} onChange={e => update('description', e.target.value)} placeholder="What happened?" />
        </div>
      </div>
      <div style={styles.formActions}>
        <button style={styles.btnSecondary} onClick={onCancel}>Cancel</button>
        <button style={styles.btn} onClick={() => onSave(form)} disabled={!form.contactId || !form.description}>Log Activity</button>
      </div>
    </div>
  )
}

// Metric Card Component
function MetricCard({ label, value, icon, color }) {
  return (
    <div style={styles.metricCard}>
      <div style={styles.metricIcon}>{icon}</div>
      <div>
        <div style={styles.metricLabel}>{label}</div>
        <div style={{ ...styles.metricValue, color: color || '#0d6e8c' }}>{value}</div>
      </div>
    </div>
  )
}

// CSS-in-JS Styles
const styles = {
  container: { display: 'flex', minHeight: '100vh', background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)' },
  sidebar: { width: '240px', background: 'linear-gradient(180deg, #0c4a5e 0%, #0d3d4d 100%)', color: 'white', padding: '20px 0', position: 'fixed', height: '100vh', boxShadow: '2px 0 10px rgba(0,0,0,0.1)' },
  logo: { padding: '0 20px 30px', fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' },
  navItem: { padding: '14px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.2s', borderLeft: '3px solid transparent', fontSize: '0.95rem' },
  navItemActive: { background: 'rgba(255,255,255,0.1)', borderLeftColor: '#14b8a6' },
  navIcon: { fontSize: '1.2rem' },
  main: { marginLeft: '240px', flex: 1, padding: '24px', maxWidth: 'calc(100vw - 240px)' },
  pageTitle: { fontSize: '1.8rem', fontWeight: 700, color: '#0c4a5e', marginBottom: '20px' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' },
  btn: { background: 'linear-gradient(135deg, #0d6e8c 0%, #0c5a72 100%)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500, transition: 'transform 0.2s, box-shadow 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  btnSecondary: { background: 'white', color: '#0d6e8c', border: '1px solid #e2e8f0', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500 },
  btnGroup: { display: 'flex', gap: '10px' },
  backBtn: { background: 'none', border: 'none', color: '#0d6e8c', cursor: 'pointer', marginBottom: '16px', fontSize: '0.9rem', padding: 0 },
  metrics: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' },
  metricCard: { background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '16px' },
  metricIcon: { fontSize: '2rem', background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)', padding: '12px', borderRadius: '12px' },
  metricLabel: { color: '#64748b', fontSize: '0.85rem', marginBottom: '4px' },
  metricValue: { fontSize: '1.5rem', fontWeight: 700 },
  card: { background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: '20px' },
  cardTitle: { fontSize: '1.1rem', fontWeight: 600, color: '#0c4a5e', marginBottom: '16px' },
  dashboardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' },
  activityItem: { display: 'flex', gap: '12px', padding: '12px 0', borderBottom: '1px solid #f1f5f9' },
  activityIcon: { fontSize: '1.2rem', background: '#f0f9ff', padding: '8px', borderRadius: '8px', height: 'fit-content' },
  activityContent: { flex: 1 },
  activityDesc: { fontSize: '0.9rem', color: '#1e293b', marginBottom: '4px' },
  activityMeta: { fontSize: '0.8rem', color: '#64748b' },
  pipelineRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9' },
  pipelineStage: { display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 },
  pipelineValue: { fontSize: '0.85rem', color: '#64748b' },
  stageDot: { width: '10px', height: '10px', borderRadius: '50%' },
  filters: { display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' },
  search: { padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.9rem', background: 'white', minWidth: '200px' },
  select: { padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.9rem', background: 'white' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '12px', textAlign: 'left', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontWeight: 500, fontSize: '0.85rem' },
  td: { padding: '12px', borderBottom: '1px solid #f1f5f9', fontSize: '0.9rem' },
  tr: { cursor: 'pointer', transition: 'background 0.2s' },
  badge: { padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 500 },
  stageBadge: { padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 500, color: 'white' },
  detailHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' },
  detailGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' },
  infoRow: { padding: '10px 0', borderBottom: '1px solid #f1f5f9', fontSize: '0.9rem' },
  infoLabel: { fontWeight: 500, color: '#64748b', marginRight: '8px' },
  dealItem: { padding: '12px 0', borderBottom: '1px solid #f1f5f9' },
  dealTitle: { fontWeight: 500, marginBottom: '4px' },
  dealMeta: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: '#64748b' },
  emptyText: { color: '#94a3b8', fontStyle: 'italic', fontSize: '0.9rem' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '0.85rem', fontWeight: 500, color: '#475569' },
  input: { padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.9rem', transition: 'border-color 0.2s', outline: 'none' },
  formActions: { display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' },
  kanban: { display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '20px' },
  kanbanColumn: { minWidth: '260px', flex: '1', background: 'rgba(255,255,255,0.5)', borderRadius: '12px', padding: '12px' },
  kanbanHeader: { display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, marginBottom: '12px', fontSize: '0.9rem', color: '#0c4a5e' },
  kanbanCount: { background: '#e2e8f0', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', marginLeft: 'auto' },
  kanbanCards: { display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '200px' },
  kanbanCard: { background: 'white', padding: '14px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', cursor: 'grab', transition: 'transform 0.2s, box-shadow 0.2s' },
  kanbanCardTitle: { fontWeight: 500, marginBottom: '8px', fontSize: '0.9rem' },
  kanbanCardMeta: { display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748b' },
  kanbanCardValue: { fontWeight: 600, color: '#0d6e8c' },
  kanbanCardDate: { fontSize: '0.75rem', color: '#94a3b8', marginTop: '6px' },
  timeline: { display: 'flex', flexDirection: 'column', gap: '0' },
  timelineItem: { display: 'flex', gap: '16px', padding: '20px 0', borderBottom: '1px solid #e2e8f0' },
  timelineIcon: { fontSize: '1.5rem', background: 'white', padding: '12px', borderRadius: '50%', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', height: 'fit-content' },
  timelineContent: { flex: 1 },
  timelineHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' },
  timelineType: { fontWeight: 600, color: '#0c4a5e' },
  timelineDate: { fontSize: '0.85rem', color: '#64748b' },
  timelineDesc: { fontSize: '0.95rem', marginBottom: '8px' },
  timelineMeta: { fontSize: '0.85rem', color: '#64748b' },
}

// Additional CSS for hover states and responsive
const cssStyles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }

  .nav-item:hover { background: rgba(255,255,255,0.1) !important; }
  tr:hover { background: #f8fafc; }
  button:hover { transform: translateY(-1px); box-shadow: 0 4px 8px rgba(0,0,0,0.15); }
  button:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
  input:focus, select:focus, textarea:focus { border-color: #0d6e8c !important; }

  .kanban-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }

  /* Wave pattern background */
  body::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: url("data:image/svg+xml,%3Csvg width='100' height='20' viewBox='0 0 100 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M21.184 20c.357-.13.72-.264 1.088-.402l1.768-.661C33.64 15.347 39.647 14 50 14c10.271 0 15.362 1.222 24.629 4.928.955.383 1.869.74 2.75 1.072h6.225c-2.51-.73-5.139-1.691-8.233-2.928C65.888 13.278 60.562 12 50 12c-10.626 0-16.855 1.397-26.66 5.063l-1.767.662c-2.475.923-4.66 1.674-6.724 2.275h6.335zm0-20C13.258 2.892 8.077 4 0 4V2c5.744 0 9.951-.574 14.85-2h6.334zM77.38 0C85.239 2.966 90.502 4 100 4V2c-6.842 0-11.386-.542-16.396-2h-6.225zM0 14c8.44 0 13.718-1.21 22.272-4.402l1.768-.661C33.64 5.347 39.647 4 50 4c10.271 0 15.362 1.222 24.629 4.928C84.112 12.722 89.438 14 100 14v-2c-10.271 0-15.362-1.222-24.629-4.928C65.888 3.278 60.562 2 50 2 39.374 2 33.145 3.397 23.34 7.063l-1.767.662C13.223 10.84 8.163 12 0 12v2z' fill='%230d6e8c' fill-opacity='0.03' fill-rule='evenodd'/%3E%3C/svg%3E");
    pointer-events: none;
    z-index: 0;
  }

  #root { position: relative; z-index: 1; }

  @media (max-width: 768px) {
    .sidebar { width: 70px !important; }
    .sidebar .logo span, .nav-label { display: none !important; }
    .main { margin-left: 70px !important; padding: 16px !important; max-width: calc(100vw - 70px) !important; }
    .hide-mobile { display: none !important; }
    .kanban { flex-direction: column; }
    .kanban-column { min-width: 100% !important; }
  }
`
