
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity, ArrowDownRight, ArrowUpRight, Bell, CalendarDays, Check,
  ChevronDown, CircleHelp, Code2, Compass, GraduationCap,
  LayoutDashboard, Menu, Plus, Search, Settings, ShieldCheck,
  Sparkles, Users, X, Pencil, Trash2, Clock3, MapPin, Music2,
  Camera, Cpu, Trophy, Palette, Dumbbell, HeartHandshake, LoaderCircle
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
const LOCAL_SIH_KEY = 'campusly_local_sih_events';

const categories = [
  'Technology', 'Cultural', 'Arts', 'Sports', 'Social Service', 'Academic'
];

// SIH events are stored locally, not in MongoDB.
function readLocalSihEvents() {
  try {
    const saved = JSON.parse(localStorage.getItem(LOCAL_SIH_KEY) || '[]');
    return Array.isArray(saved)
      ? saved.filter(event => String(event._id || '').startsWith('local-sih-'))
      : [];
  } catch {
    return [];
  }
}

function writeLocalSihEvents(events) {
  localStorage.setItem(LOCAL_SIH_KEY, JSON.stringify(events));
}

const isSihEvent = (data, id) =>
  Boolean(
    String(id || '').startsWith('local-sih-') ||
    String(data?.title || '').trim().toLowerCase() === 'sih'
  );

const iconFor = (name = '') => {
  const n = name.toLowerCase();
  if (n.includes('tech') || n.includes('coding') || n.includes('robot')) return Code2;
  if (n.includes('music') || n.includes('dance')) return Music2;
  if (n.includes('photo') || n.includes('film')) return Camera;
  if (n.includes('sport') || n.includes('fitness')) return Dumbbell;
  if (n.includes('social') || n.includes('volunteer')) return HeartHandshake;
  if (n.includes('art') || n.includes('design')) return Palette;
  return GraduationCap;
};

const initialClubs = [
  { _id: 'demo1', name: 'CodeCraft Society', category: 'Technology', description: 'Building the future, one line at a time.', president: 'Aarav Sharma', membersCount: 128 },
  { _id: 'demo2', name: 'The Creative Canvas', category: 'Arts', description: 'A home for artists, designers and makers.', president: 'Ananya Rao', membersCount: 86 },
  { _id: 'demo3', name: 'Rhythm & Roots', category: 'Cultural', description: 'Celebrating culture through music and dance.', president: 'Rohan Das', membersCount: 94 },
  { _id: 'demo4', name: 'Impact Collective', category: 'Social Service', description: 'Small acts. Meaningful change.', president: 'Meera Nair', membersCount: 72 }
];

const initialEvents = [
  { _id: 'ev1', title: 'Build-a-thon 2026', club: 'CodeCraft Society', date: '2026-10-24', venue: 'Innovation Lab', status: 'Upcoming' },
  { _id: 'ev2', title: 'Campus Open Mic', club: 'Rhythm & Roots', date: '2026-10-28', venue: 'Amphitheatre', status: 'Upcoming' },
  { _id: 'ev3', title: 'Design for Good', club: 'The Creative Canvas', date: '2026-11-02', venue: 'Studio 2', status: 'Upcoming' }
];

const initialMembers = [
  { _id: 'm1', name: 'Ishita Verma', email: 'ishita@example.edu', studentId: 'CS2024012', club: 'CodeCraft Society', status: 'Active' },
  { _id: 'm2', name: 'Kabir Reddy', email: 'kabir@example.edu', studentId: 'CS2024038', club: 'The Creative Canvas', status: 'Active' },
  { _id: 'm3', name: 'Diya Menon', email: 'diya@example.edu', studentId: 'CS2024071', club: 'Impact Collective', status: 'Pending' }
];

const today = new Date().toISOString().slice(0, 10);

const prettyDate = d =>
  d
    ? new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    : 'Date TBD';

export default function App() {
  const [page, setPage] = useState('Overview');
  const [clubs, setClubs] = useState(initialClubs);
  const [events, setEvents] = useState(() => readLocalSihEvents());
  const [localSihEvents, setLocalSihEvents] = useState(() => readLocalSihEvents());
  const [members, setMembers] = useState(initialMembers);
  const [connected, setConnected] = useState(false);
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [busy, setBusy] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  const request = useCallback(async (path, options = {}) => {
    const response = await fetch(`${API}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  }, []);

  const refresh = useCallback(async () => {
    try {
      const [c, e, m] = await Promise.all([
        request('/clubs'),
        request('/events'),
        request('/members')
      ]);

      const localEvents = readLocalSihEvents();

      setClubs(c);
      setEvents([
        ...e.filter(event => !String(event._id || '').startsWith('local-sih-')),
        ...localEvents
      ]);
      setLocalSihEvents(localEvents);
      setMembers(m);
      setConnected(true);
    } catch {
      setConnected(false);
      // Keep locally stored SIH events visible even if the API is offline.
      setLocalSihEvents(readLocalSihEvents());
      setEvents(prev => {
        const localEvents = readLocalSihEvents();
        const databaseEvents = prev.filter(
          event => !String(event._id || '').startsWith('local-sih-')
        );
        return [...databaseEvents, ...localEvents];
      });
    }
  }, [request]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(''), 3500);
    return () => clearTimeout(id);
  }, [notice]);

  const counts = {
    clubs: clubs.length,
    members: members.length,
    events: events.length,
    upcoming: events.filter(e => e.status === 'Upcoming' && e.date >= today).length
  };

  const filteredClubs = useMemo(
    () => clubs.filter(c =>
      `${c.name} ${c.category} ${c.president}`.toLowerCase().includes(search.toLowerCase())
    ),
    [clubs, search]
  );

  const filteredEvents = useMemo(
    () => events.filter(e =>
      `${e.title} ${e.club || ''} ${e.venue}`.toLowerCase().includes(search.toLowerCase())
    ),
    [events, search]
  );

  const filteredMembers = useMemo(
    () => members.filter(m =>
      `${m.name} ${m.email} ${m.studentId} ${m.club}`.toLowerCase().includes(search.toLowerCase())
    ),
    [members, search]
  );

  async function saveItem(type, data, id) {
    setBusy(true);

    try {
      if (type === 'events' && isSihEvent(data, id)) {
        // SIH is the one special event that never calls the database API.
        const savedEvents = readLocalSihEvents();
        const existingIndex = savedEvents.findIndex(event => event._id === id);

        const localEvent = {
          ...data,
          _id: id || `local-sih-${Date.now()}`
        };

        if (existingIndex >= 0) {
          savedEvents[existingIndex] = localEvent;
        } else {
          savedEvents.push(localEvent);
        }

        writeLocalSihEvents(savedEvents);
        setLocalSihEvents(savedEvents);

        // Refresh the list immediately without sending SIH to MongoDB.
        setEvents(prev => {
          const withoutThisEvent = prev.filter(event => event._id !== localEvent._id);
          return [...withoutThisEvent, localEvent];
        });

        setModal(null);
        setNotice(id ? 'SIH event changes saved on this device.' : 'SIH event added on this device.');
        return;
      }

      if (type === 'clubs') {
        await request(id ? `/clubs/${id}` : '/clubs', {
          method: id ? 'PUT' : 'POST',
          body: JSON.stringify(data)
        });
      }

      if (type === 'events') {
        await request(id ? `/events/${id}` : '/events', {
          method: id ? 'PUT' : 'POST',
          body: JSON.stringify(data)
        });
      }

      if (type === 'members') {
        await request('/members', {
          method: 'POST',
          body: JSON.stringify(data)
        });
      }

      await refresh();
      setModal(null);
      setNotice(id ? 'Changes saved successfully.' : 'Added successfully.');
    } catch (e) {
      setNotice(e.message || 'Unable to save the record.');
    } finally {
      setBusy(false);
    }
  }

  async function deleteItem(type, id) {
    if (!window.confirm('Are you sure you want to delete this record?')) return;

    // Delete local SIH events from local storage, not from the API.
    if (type === 'events' && String(id).startsWith('local-sih-')) {
      try {
        const savedEvents = readLocalSihEvents().filter(event => event._id !== id);
        writeLocalSihEvents(savedEvents);
        setLocalSihEvents(savedEvents);
        setEvents(prev => prev.filter(event => event._id !== id));
        setNotice('SIH event deleted from this device.');
      } catch {
        setNotice('Unable to delete the local SIH event.');
      }
      return;
    }

    try {
      await request(`/${type}/${id}`, { method: 'DELETE' });
      await refresh();
      setNotice('Record deleted.');
    } catch (e) {
      setNotice(e.message);
    }
  }

  const nav = [
    {
      label: 'WORKSPACE',
      items: [
        ['Overview', LayoutDashboard],
        ['Clubs', GraduationCap],
        ['Events', CalendarDays],
        ['Members', Users]
      ]
    },
    {
      label: 'PREFERENCES',
      items: [
        ['Settings', Settings],
        ['Help & support', CircleHelp]
      ]
    }
  ];

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? 'show' : ''}`}>
      <div className="brand">
        <div className="brand-mark"><Sparkles size={19} /></div>
        <div className="brand-name">campusly<span>.</span><small>STUDENT LIFE, CONNECTED</small></div>
        <button className="icon-btn close-nav" onClick={() => setMobileNav(false)}><X size={18} /></button>
      </div>

      <div className="campus-switch">
        <div className="campus-icon"><GraduationCap size={19} /></div>
        <div><strong>GITAM University</strong><small>Visakhapatnam campus</small></div>
        <ChevronDown size={15} />
      </div>

      {nav.map(group =>
        <div className="nav-group" key={group.label}>
          <div className="nav-label">{group.label}</div>
          {group.items.map(([label, Icon]) =>
            <button
              key={label}
              className={`nav-item ${page === label ? 'active' : ''}`}
              onClick={() => {
                setPage(label);
                setSearch('');
                setMobileNav(false);
              }}
            >
              <Icon size={18} />
              <span>{label}</span>
              {label === 'Events' && <span className="nav-count">{counts.upcoming}</span>}
            </button>
          )}
        </div>
      )}

      <div className="sidebar-bottom">
        <div className="help-card">
          <div className="help-icon"><ShieldCheck size={17} /></div>
          <strong>Your campus, in sync.</strong>
          <p>Everything happening in your student community, all in one place.</p>
          <button onClick={() => setPage('Help & support')}>Explore guide <span>↗</span></button>
        </div>
        <div className="profile">
          <div className="avatar">KC</div>
          <div className="profile-text"><strong>Charan K.</strong><small>Student administrator</small></div>
          <button className="icon-btn"><Settings size={16} /></button>
        </div>
      </div>
    </aside>

    {mobileNav && <div className="scrim" onClick={() => setMobileNav(false)} />}

    <main className="main-area">
      <header className="topbar">
        <button className="icon-btn mobile-menu" onClick={() => setMobileNav(true)}><Menu size={20} /></button>
        <div className="breadcrumbs">Workspace <span>/</span> <strong>{page}</strong></div>
        <div className="topbar-right">
          <div className={`connection ${connected ? 'online' : 'offline'}`}>
            <span />{connected ? 'Database connected' : 'Demo preview'}
          </div>
          <button className="icon-btn notification" aria-label="Notifications"><Bell size={18} /><i /></button>
          <div className="top-avatar">KC</div>
        </div>
      </header>

      <div className="content">
        {page === 'Overview' &&
          <Overview
            clubs={clubs}
            events={events}
            members={members}
            counts={counts}
            setPage={setPage}
            openAdd={type => setModal({ type })}
          />
        }

        {page === 'Clubs' &&
          <section>
            <PageHeading
              eyebrow="YOUR COMMUNITY"
              title="Club directory"
              subtitle="Discover, organise, and grow your campus communities."
              action="+ Add a club"
              onAction={() => setModal({ type: 'clubs' })}
            />
            <Searchbar value={search} onChange={setSearch} placeholder="Search clubs, categories, presidents..." />
            <div className="club-grid">
              {filteredClubs.map(c =>
                <ClubCard
                  key={c._id}
                  club={c}
                  onEdit={() => setModal({ type: 'clubs', item: c })}
                  onDelete={() => deleteItem('clubs', c._id)}
                />
              )}
              {!filteredClubs.length && <Empty title="No clubs found" text="Try another search or add your first club." />}
            </div>
          </section>
        }

        {page === 'Events' &&
          <section>
            <PageHeading
              eyebrow="WHAT'S HAPPENING"
              title="Events & activities"
              subtitle="The moments, meetups, and milestones that bring campus to life."
              action="+ Create event"
              onAction={() => setModal({ type: 'events' })}
            />
            <Searchbar value={search} onChange={setSearch} placeholder="Search events, clubs, venues..." />
            <div className="panel">
              <div className="panel-head">
                <div><h3>All events</h3><p>{filteredEvents.length} events in your community</p></div>
                <span className="subtle-chip"><CalendarDays size={14} /> 2026–27</span>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>EVENT</th><th>DATE</th><th>CLUB</th><th>VENUE</th><th>STATUS</th><th></th></tr>
                  </thead>
                  <tbody>
                    {filteredEvents.map(e =>
                      <tr key={e._id}>
                        <td><strong>{e.title}</strong></td>
                        <td>{prettyDate(e.date)}</td>
                        <td>{e.club || 'SIH'}</td>
                        <td><span className="inline-icon"><MapPin size={13} />{e.venue}</span></td>
                        <td><Status value={e.status} /></td>
                        <td>
                          <Actions
                            onEdit={() => setModal({ type: 'events', item: e })}
                            onDelete={() => deleteItem('events', e._id)}
                          />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                {!filteredEvents.length && <Empty title="No events yet" text="Create an event to get your campus calendar started." />}
              </div>
            </div>
          </section>
        }

        {page === 'Members' &&
          <section>
            <PageHeading
              eyebrow="PEOPLE & MEMBERSHIPS"
              title="Member directory"
              subtitle="Keep track of the people who make every club special."
              action="+ Add member"
              onAction={() => setModal({ type: 'members' })}
            />
            <Searchbar value={search} onChange={setSearch} placeholder="Search name, email, student ID..." />
            <div className="panel">
              <div className="panel-head">
                <div><h3>Registered students</h3><p>{filteredMembers.length} student memberships</p></div>
                <span className="subtle-chip"><Users size={14} /> Memberships</span>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>STUDENT</th><th>STUDENT ID</th><th>CLUB</th><th>STATUS</th><th></th></tr>
                  </thead>
                  <tbody>
                    {filteredMembers.map((m, i) =>
                      <tr key={m._id}>
                        <td>
                          <div className="member-cell">
                            <div className={`mini-avatar tone-${i % 4}`}>{m.name.split(' ').map(n => n[0]).slice(0, 2).join('')}</div>
                            <div><strong>{m.name}</strong><small>{m.email}</small></div>
                          </div>
                        </td>
                        <td>{m.studentId}</td>
                        <td>{m.club}</td>
                        <td><Status value={m.status} /></td>
                        <td><Actions onDelete={() => deleteItem('members', m._id)} /></td>
                      </tr>
                    )}
                  </tbody>
                </table>
                {!filteredMembers.length && <Empty title="No members found" text="Register a student to get started." />}
              </div>
            </div>
          </section>
        }

        {page === 'Settings' &&
          <section>
            <PageHeading eyebrow="PREFERENCES" title="Settings" subtitle="Application and connection information." />
            <div className="panel settings-panel">
              <div className="setting-row">
                <div className="setting-icon"><Activity size={19} /></div>
                <div><strong>API connection</strong><p>Express backend at {API}</p></div>
                <Status value={connected ? 'Connected' : 'Demo mode'} />
              </div>
              <div className="setting-row">
                <div className="setting-icon"><ShieldCheck size={19} /></div>
                <div><strong>Database</strong><p>MongoDB database: college_club_management</p></div>
                <button className="btn-secondary" onClick={refresh}>Check connection</button>
              </div>
              <div className="setting-row">
                <div className="setting-icon"><GraduationCap size={19} /></div>
                <div><strong>Campus profile</strong><p>GITAM University · Visakhapatnam</p></div>
              </div>
            </div>
          </section>
        }

        {page === 'Help & support' &&
          <section>
            <PageHeading eyebrow="HERE TO HELP" title="Help & support" subtitle="A quick guide to getting your club management system running." />
            <div className="help-grid">
              <div className="panel help-article">
                <div className="setting-icon"><Code2 /></div>
                <h3>Start the backend</h3>
                <p>Open a terminal in the <code>server</code> folder, configure your MongoDB URI in <code>.env</code>, then run <code>npm install</code> and <code>npm run dev</code>.</p>
              </div>
              <div className="panel help-article">
                <div className="setting-icon"><Cpu /></div>
                <h3>Connect MongoDB</h3>
                <p>Start your local MongoDB service or use a MongoDB Atlas connection string. The status indicator in the top bar shows whether the API loaded records.</p>
              </div>
              <div className="panel help-article">
                <div className="setting-icon"><Users /></div>
                <h3>Manage your community</h3>
                <p>Use Clubs to create and update clubs, Events to schedule activities, and Members to register students. Changes are saved to MongoDB when connected, except the special local SIH event.</p>
              </div>
            </div>
          </section>
        }

        <footer className="footer">
          <span>© 2026 Campusly. Made for student communities.</span>
          <span><span className="footer-dot" /> Built for a better campus life</span>
        </footer>
      </div>
    </main>

    {modal &&
      <Modal
        modal={modal}
        clubs={clubs}
        onClose={() => setModal(null)}
        onSave={saveItem}
        busy={busy}
      />
    }

    {notice &&
      <div className="toast">
        <Check size={17} />{notice}
        <button onClick={() => setNotice('')}><X size={15} /></button>
      </div>
    }
  </div>;
}

function Overview({ clubs, events, members, counts, setPage, openAdd }) {
  const recent = [...events].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4);

  return <section>
    <div className="welcome-row">
      <div>
        <div className="eyebrow"><Sparkles size={13} /> TUESDAY, OCTOBER 20, 2026</div>
        <h1>Good Morning/Evening <span className="wave">✳</span></h1>
        <p>Here's what's happening across your campus today.</p>
      </div>
      <button className="btn-primary" onClick={() => openAdd('events')}><Plus size={17} /> Create an event</button>
    </div>

    <div className="hero-banner">
      <div className="hero-copy">
        <div className="hero-tag"><span /> CAMPUS PULSE</div>
        <h2>Big ideas start<br />with <em>coming together.</em></h2>
        <p>Your community is growing. Keep the momentum going — one club, one event, one connection at a time.</p>
        <button onClick={() => setPage('Clubs')}>Explore your clubs <span>↗</span></button>
      </div>
      <div className="hero-art">
        <div className="orbit orbit-one" />
        <div className="orbit orbit-two" />
        <div className="art-spark spark-a">✦</div>
        <div className="art-spark spark-b">✳</div>
        <div className="art-core"><GraduationCap size={60} strokeWidth={1.2} /></div>
        <div className="float-card float-top">
          <div className="float-icon violet"><Users size={15} /></div>
          <div><strong>{counts.members} members</strong><small>in your community</small></div>
        </div>
        <div className="float-card float-bottom">
          <div className="float-icon mint"><CalendarDays size={15} /></div>
          <div><strong>{counts.upcoming} upcoming</strong><small>events to look forward to</small></div>
        </div>
      </div>
    </div>

    <div className="section-title-row">
      <div><h2>Your campus at a glance</h2><p>A little snapshot of your student community.</p></div>
      <button className="text-link" onClick={() => setPage('Clubs')}>View all data <span>↗</span></button>
    </div>

    <div className="stats-grid">
      <StatCard label="Active clubs" value={counts.clubs} note="Communities to explore" icon={GraduationCap} tone="lavender" trend="+12%" up />
      <StatCard label="Student members" value={counts.members} note="Across all communities" icon={Users} tone="mint" trend="+8.4%" up />
      <StatCard label="Upcoming events" value={counts.upcoming} note="More moments ahead" icon={CalendarDays} tone="peach" trend="This month" />
      <StatCard label="Total events" value={counts.events} note="Campus memories made" icon={Trophy} tone="blue" trend="All time" />
    </div>

    <div className="overview-lower">
      <div className="panel upcoming-panel">
        <div className="panel-head">
          <div><h3>Coming up next</h3><p>Don't miss what's happening on campus.</p></div>
          <button className="text-link" onClick={() => setPage('Events')}>All events <span>↗</span></button>
        </div>
        <div className="event-list">
          {recent.map((e, i) =>
            <div className="event-row" key={e._id}>
              <div className={`date-tile date-${i % 4}`}>
                <strong>{e.date ? new Date(`${e.date}T00:00:00`).getDate() : '—'}</strong>
                <span>{e.date ? new Date(`${e.date}T00:00:00`).toLocaleDateString('en-IN', { month: 'short' }) : 'TBD'}</span>
              </div>
              <div className="event-info">
                <strong>{e.title}</strong>
                <span>{e.club || 'SIH'}</span>
                <small><Clock3 size={12} />{prettyDate(e.date)} <i /> <MapPin size={12} />{e.venue}</small>
              </div>
              <span className="event-arrow">↗</span>
            </div>
          )}
          {!recent.length && <Empty title="No events planned" text="Add an event to get started." />}
        </div>
      </div>

      <div className="panel clubs-panel">
        <div className="panel-head">
          <div><h3>Community spotlight</h3><p>Meet the clubs making a difference.</p></div>
          <button className="icon-btn" onClick={() => setPage('Clubs')}><ArrowUpRight size={17} /></button>
        </div>
        <div className="spotlight-list">
          {clubs.slice(0, 4).map((c, i) => {
            const Icon = iconFor(c.category);
            return <div className="spotlight-row" key={c._id}>
              <div className={`club-icon club-tone-${i % 4}`}><Icon size={19} /></div>
              <div className="spotlight-text"><strong>{c.name}</strong><small>{c.category}</small></div>
              <div className="spotlight-count"><strong>{c.membersCount || 0}</strong><small>members</small></div>
            </div>;
          })}
        </div>
        <button className="discover-btn" onClick={() => setPage('Clubs')}>Discover all clubs <span>→</span></button>
      </div>
    </div>

    <div className="quick-actions">
      <div><strong>Make something happen</strong><p>Your next great campus moment starts here.</p></div>
      <button className="quick-action" onClick={() => openAdd('clubs')}>
        <span className="qa-icon purple"><Plus size={17} /></span>
        <span><strong>Start a club</strong><small>Bring people together</small></span>
        <ArrowDownRight size={17} />
      </button>
      <button className="quick-action" onClick={() => openAdd('members')}>
        <span className="qa-icon green"><Users size={17} /></span>
        <span><strong>Register a member</strong><small>Grow your community</small></span>
        <ArrowDownRight size={17} />
      </button>
      <button className="quick-action" onClick={() => openAdd('events')}>
        <span className="qa-icon orange"><CalendarDays size={17} /></span>
        <span><strong>Plan an event</strong><small>Make it memorable</small></span>
        <ArrowDownRight size={17} />
      </button>
    </div>
  </section>;
}

function StatCard({ label, value, note, icon: Icon, tone, trend, up }) {
  return <div className="stat-card">
    <div className="stat-top">
      <div className={`stat-icon ${tone}`}><Icon size={19} /></div>
      <span className={`trend ${up ? 'trend-up' : ''}`}>{up && <ArrowUpRight size={13} />} {trend}</span>
    </div>
    <div className="stat-value">{value}</div>
    <div className="stat-label">{label}</div>
    <div className="stat-note">{note}</div>
  </div>;
}

function PageHeading({ eyebrow, title, subtitle, action, onAction }) {
  return <div className="page-heading">
    <div>
      <div className="eyebrow">{eyebrow}</div>
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </div>
    {action && <button className="btn-primary" onClick={onAction}><Plus size={17} />{action.replace(/^\+\s*/, '')}</button>}
  </div>;
}

function Searchbar({ value, onChange, placeholder }) {
  return <div className="searchbar">
    <Search size={18} />
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    {value && <button onClick={() => onChange('')}><X size={15} /></button>}
  </div>;
}

function ClubCard({ club, onEdit, onDelete }) {
  const Icon = iconFor(club.category);
  return <div className="club-card">
    <div className="club-card-top">
      <div className={`club-icon club-tone-${club.name.length % 4}`}><Icon size={22} /></div>
      <div className="card-actions">
        <button className="icon-btn" title="Edit club" onClick={onEdit}><Pencil size={15} /></button>
        <button className="icon-btn danger-hover" title="Delete club" onClick={onDelete}><Trash2 size={15} /></button>
      </div>
    </div>
    <span className="category-label">{club.category}</span>
    <h3>{club.name}</h3>
    <p>{club.description || 'A community for students to connect, learn and grow.'}</p>
    <div className="club-card-bottom">
      <div className="club-members"><Users size={15} /><strong>{club.membersCount || 0}</strong> members</div>
      <span>President: {club.president}</span>
    </div>
  </div>;
}

function Status({ value }) {
  const cls = String(value || 'Pending').toLowerCase().replace(/\s/g, '-');
  return <span className={`status status-${cls}`}><i />{value || 'Pending'}</span>;
}

function Actions({ onEdit, onDelete }) {
  return <div className="row-actions">
    {onEdit && <button className="icon-btn" title="Edit" onClick={onEdit}><Pencil size={15} /></button>}
    {onDelete && <button className="icon-btn danger-hover" title="Delete" onClick={onDelete}><Trash2 size={15} /></button>}
  </div>;
}

function Empty({ title, text }) {
  return <div className="empty-state">
    <div className="empty-icon"><Compass size={23} /></div>
    <strong>{title}</strong>
    <p>{text}</p>
  </div>;
}

function Modal({ modal, clubs, onClose, onSave, busy }) {
  const editing = modal.item;
  const type = modal.type;

  const [form, setForm] = useState(() =>
    editing
      ? { ...editing }
      : { category: 'Technology', status: type === 'events' ? 'Upcoming' : 'Active', date: '2026-10-30' }
  );

  const update = e => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = e => {
    e.preventDefault();

    const payload = { ...form };

    delete payload._id;
    delete payload.__v;
    delete payload.createdAt;
    delete payload.updatedAt;

    onSave(type, payload, editing ? editing._id : null);
  };

  const title = editing ? 'Edit' : 'Add';

  return <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="modal">
      <div className="modal-header">
        <div>
          <div className="eyebrow">COMMUNITY MANAGEMENT</div>
          <h2>{title} {type === 'clubs' ? 'club' : type === 'events' ? 'event' : 'member'}</h2>
          <p>Fill in the details below to {editing ? 'update this record' : 'save a new record'}.</p>
        </div>
        <button className="icon-btn" onClick={onClose}><X size={19} /></button>
      </div>

      <form onSubmit={submit}>
        <div className="form-grid">
          {type === 'clubs' &&
            <>
              <Field label="Club name" name="name" value={form.name || ''} onChange={update} placeholder="e.g. CodeCraft Society" required />
              <Field label="Category" name="category" value={form.category || 'Technology'} onChange={update} options={categories} />
              <Field label="Club president" name="president" value={form.president || ''} onChange={update} placeholder="Student name" required />
              <Field label="Member count" name="membersCount" type="number" value={form.membersCount ?? 0} onChange={update} required />
              <div className="field full">
                <label>Description</label>
                <textarea name="description" value={form.description || ''} onChange={update} placeholder="What is this club about?" rows="3" />
              </div>
            </>
          }

          {type === 'events' &&
            <>
              <Field label="Event title" name="title" value={form.title || ''} onChange={update} placeholder="e.g. Campus Hackathon" required />
              <Field label="Organising club" name="club" value={form.club || ''} onChange={update} options={clubs.map(c => c.name)} required />
              <Field label="Date" name="date" type="date" value={form.date || ''} onChange={update} required />
              <Field label="Venue" name="venue" value={form.venue || ''} onChange={update} placeholder="e.g. Main auditorium" required />
              <Field label="Status" name="status" value={form.status || 'Upcoming'} onChange={update} options={['Upcoming', 'Completed', 'Cancelled']} />
              <div className="field full">
                <label>Description</label>
                <textarea name="description" value={form.description || ''} onChange={update} placeholder="A short event description" rows="2" />
              </div>
            </>
          }

          {type === 'members' &&
            <>
              <Field label="Student name" name="name" value={form.name || ''} onChange={update} placeholder="Full name" required />
              <Field label="Student ID" name="studentId" value={form.studentId || ''} onChange={update} placeholder="e.g. CS2026012" required />
              <Field label="Email address" name="email" type="email" value={form.email || ''} onChange={update} placeholder="student@university.edu" required />
              <Field label="Club" name="club" value={form.club || ''} onChange={update} options={clubs.map(c => c.name)} required />
              <Field label="Status" name="status" value={form.status || 'Active'} onChange={update} options={['Active', 'Pending']} />
            </>
          }
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" type="submit" disabled={busy}>
            {busy ? <LoaderCircle size={16} className="spin" /> : <Check size={16} />}
            {' '}{busy ? 'Saving...' : editing ? 'Save changes' : 'Save record'}
          </button>
        </div>
      </form>
    </div>
  </div>;
}

function Field({ label, name, value, onChange, placeholder, type = 'text', options, required }) {
  return <div className="field">
    <label htmlFor={name}>{label}{required && <span> *</span>}</label>
    {options
      ? <select id={name} name={name} value={value} onChange={onChange} required={required}>
          {!required && <option value="">Select {label.toLowerCase()}</option>}
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      : <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          min={type === 'number' ? 0 : undefined}
        />
    }
  </div>;
}
