
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowDown, ArrowRight, ArrowUpRight, Instagram, Menu, X, MapPin,
  Clock3, CalendarDays, Users, Footprints, ShieldCheck, Ticket,
  Camera, CircleDot, Flag, Mail, Phone, Play, CreditCard, Heart
} from 'lucide-react';
import './style.css';
import { supabase, testSupabaseConnection } from './supabase';

const eventData = [
  {
    id: 'AFC-001',
    tag: 'COMMUNITY SESSION',
    title: 'Play. Connect. Belong.',
    date: 'Date to be announced',
    time: '6:00 AM – 8:30 AM',
    venue: 'Azad Kick & Hit Turf, KLD Road',
    fee: '₹149',
    status: 'Registration details to be confirmed',
    image: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=1200&q=85'
  },
  {
    id: 'AFC-002',
    tag: 'COMING SOON',
    title: 'The next chapter',
    date: 'Coming soon',
    time: 'To be announced',
    venue: 'Anantapur',
    fee: 'TBA',
    status: 'Stay tuned',
    image: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1200&q=85'
  }
];

const gallery = [
  { title: 'The beautiful game', type: 'MATCHDAY', image: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1000&q=85' },
  { title: 'One team. One heartbeat.', type: 'COMMUNITY', image: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=1000&q=85' },
  { title: 'Chase every ball', type: 'ON THE PITCH', image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1000&q=85' },
  { title: 'Made for matchdays', type: 'THE GAME', image: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=1000&q=85' },
  { title: 'Find your people', type: 'TOGETHER', image: 'https://images.unsplash.com/photo-1518604666860-9ed391f76460?auto=format&fit=crop&w=1000&q=85' },
  { title: 'The pitch is calling', type: 'FOOTBALL', image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1000&q=85' }
];

const milestones = [
  { no: '01', title: 'The idea', text: 'A simple belief: adults deserve a place to play, move and reconnect through football.', date: 'THE BEGINNING' },
  { no: '02', title: 'A community takes shape', text: 'Bringing local football lovers together around accessible, welcoming sessions.', date: 'BUILDING TOGETHER' },
  { no: '03', title: 'The journey continues', text: 'More matchdays, more friendships and more stories still waiting to be written.', date: 'WHAT COMES NEXT' }
];

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    age: '',
    position: '',
    emergency: ''
  });
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeImage, setActiveImage] = useState(null);
  const [progress, setProgress] = useState(0);

  // Test Supabase connection when the website loads.
  useEffect(() => {
    testSupabaseConnection();
  }, []);

  // Scroll progress animation.
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? window.scrollY / max : 0);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  };

  const update = (key, value) => {
    setForm((old) => ({ ...old, [key]: value }));
  };

  // Submit registration to Supabase.
  const submit = async (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.phone || !form.age) {
      setNotice('Please complete your name, mobile number and age.');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(form.phone)) {
      setNotice('Enter a valid 10-digit Indian mobile number.');
      return;
    }

    if (Number(form.age) < 18 || Number(form.age) > 100) {
      setNotice('AFC community sessions are currently for participants aged 18+.');
      return;
    }

    setSubmitting(true);
    setNotice('Submitting your registration...');

    try {
      const { data, error } = await supabase.rpc(
        'afc_register_interest',
        {
          p_full_name: form.name.trim(),
          p_phone: form.phone,
          p_age: Number(form.age),
          p_emergency_contact: form.emergency || null
        }
      );

      if (error) throw error;

      setNotice(
        `Registration request received! Your reference number is ${data}. This is not yet a confirmed booking.`
      );

      setForm({
        name: '',
        phone: '',
        age: '',
        position: '',
        emergency: ''
      });
    } catch (error) {
      console.error('AFC registration error:', error);
      setNotice(
        error.message || 'Registration could not be submitted. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const navItems = [
    ['OUR STORY', 'story'],
    ['MATCHDAY', 'events'],
    ['GALLERY', 'gallery'],
    ['TIMELINE', 'timeline']
  ];

  return (
    <div className="site-shell">
      <div
        className="scroll-progress"
        style={{ transform: `scaleX(${progress})` }}
      />

      <header className="header">
        <a className="brand" href="#home" onClick={(e) => {
          e.preventDefault();
          scrollTo('home');
        }}>
          <span className="brand-mark"><Footprints size={22}/><i>A</i></span>
          <span className="brand-copy">
            <b>ANANTAPUR</b>
            <small>FOOTBALL CLUB</small>
          </span>
        </a>

        <nav className="desktop-nav">
          {navItems.map(([label, id]) => (
            <button key={id} onClick={() => scrollTo(id)}>{label}</button>
          ))}
        </nav>

        <button className="header-cta" onClick={() => scrollTo('join')}>
          JOIN THE GAME <ArrowUpRight size={15}/>
        </button>

        <button
          className="menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
        >
          {menuOpen ? <X/> : <Menu/>}
        </button>

        {menuOpen && (
          <nav className="mobile-nav">
            {navItems.map(([label, id]) => (
              <button key={id} onClick={() => scrollTo(id)}>
                {label}<ArrowRight size={15}/>
              </button>
            ))}
            <button onClick={() => scrollTo('join')}>
              JOIN AFC <ArrowRight size={15}/>
            </button>
          </nav>
        )}
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-image"/>
          <div className="hero-shade"/>
          <div className="hero-topline">
            <span><i className="pulse-dot"/> THE PEOPLE'S FOOTBALL CLUB</span>
            <span>ANANTAPUR · ANDHRA PRADESH</span>
          </div>

          <div className="hero-copy">
            <p className="eyebrow">A CITY UNITED BY FOOTBALL</p>
            <h1>THE CITY.<br/><em>THE GAME.</em><br/>THE PEOPLE.</h1>
            <p className="hero-description">
              A local football community built for movement, connection and the love of the game. Find your people. Find your pitch.
            </p>
            <div className="hero-buttons">
              <button className="btn btn-lime" onClick={() => scrollTo('events')}>
                EXPLORE MATCHDAY <ArrowRight size={17}/>
              </button>
              <button className="btn btn-ghost" onClick={() => scrollTo('story')}>
                <Play size={15}/> DISCOVER AFC
              </button>
            </div>
          </div>

          <div className="hero-side-note">
            <span>PLAY</span><span>CONNECT</span><span>BELONG</span>
          </div>

          <div className="hero-bottom">
            <span>EST. 2026 / ANANTAPUR FOOTBALL CLUB</span>
            <button onClick={() => scrollTo('story')}>
              SCROLL TO EXPLORE <ArrowDown size={14}/>
            </button>
            <span>01 — 06</span>
          </div>

          <div className="hero-orbit">
            <div className="orbit-ring"/>
            <div className="orbit-ball"><CircleDot size={38}/></div>
            <span>FOOTBALL<br/>IS OUR COMMON<br/>LANGUAGE</span>
          </div>
        </section>

        <div className="marquee">
          <div>
            FOOTBALL IS FOR EVERYONE <b>✳</b> BUILT IN ANANTAPUR <b>✳</b>
            PLAY MORE. LIVE MORE. <b>✳</b> FOOTBALL IS FOR EVERYONE <b>✳</b>
            BUILT IN ANANTAPUR <b>✳</b>
          </div>
        </div>

        <section className="story section-pad" id="story">
          <div className="section-label">
            <span>01 / THE CLUB</span><span>OUR STORY</span>
          </div>
          <div className="story-grid">
            <div className="story-heading">
              <p className="eyebrow">NOT JUST NINETY MINUTES</p>
              <h2>WE PLAY<br/>FOR THE <em>FEELING.</em></h2>
              <div className="scribble-line"/>
            </div>
            <div className="story-text">
              <p className="big-copy">Life gets busy. The game brings us back.</p>
              <p>
                Anantapur Football Club is a community-first football initiative created to make sport part of everyday life for adults. No matter your experience, the pitch is a place to move, meet people and belong.
              </p>
              <button className="text-link" onClick={() => scrollTo('join')}>
                BECOME PART OF THE STORY <ArrowUpRight size={16}/>
              </button>
            </div>
          </div>
          <div className="principles">
            <article><span>01</span><Footprints/><h3>PLAY</h3><p>Move your body. Enjoy every touch.</p></article>
            <article><span>02</span><Users/><h3>CONNECT</h3><p>Meet good people. Build friendships.</p></article>
            <article><span>03</span><Heart/><h3>BELONG</h3><p>Find your place in the local game.</p></article>
            <article className="principle-stat">
              <strong>18<sup>+</sup></strong><small>COMMUNITY<br/>AGE GROUP</small>
            </article>
          </div>
        </section>

        <section className="matchday section-pad" id="events">
          <div className="section-label">
            <span>02 / THE FIXTURES</span><span>SHOW UP & PLAY</span>
          </div>
          <div className="section-title-row">
            <div>
              <p className="eyebrow">YOUR PITCH IS WAITING</p>
              <h2>UP NEXT<span className="lime-dot">.</span></h2>
            </div>
            <div className="title-aside">Every great story<br/>starts with a kickoff.</div>
          </div>

          <div className="event-list">
            {eventData.map((event, i) => (
              <article
                className={`event-card ${i === 0 ? 'featured' : ''}`}
                key={event.id}
              >
                <div
                  className="event-photo"
                  style={{ backgroundImage: `url(${event.image})` }}
                >
                  <span>{event.id}</span>
                  <b>{String(i + 1).padStart(2, '0')}</b>
                </div>
                <div className="event-content">
                  <p className="eyebrow">{event.tag}</p>
                  <h3>{event.title}</h3>
                  <div className="event-details">
                    <span><CalendarDays/>{event.date}</span>
                    <span><Clock3/>{event.time}</span>
                    <span><MapPin/>{event.venue}</span>
                  </div>
                  <div className="event-bottom">
                    <div className="event-fee">
                      <small>SESSION CONTRIBUTION</small>
                      <strong>{event.fee}</strong>
                    </div>
                    <button
                      className="round-arrow"
                      onClick={() => scrollTo('join')}
                      aria-label="Register for event"
                    >
                      <ArrowUpRight/>
                    </button>
                  </div>
                  <small className="event-note">{event.status}</small>
                </div>
              </article>
            ))}
          </div>

          <div className="capacity-strip">
            <div className="capacity-icon"><Users/></div>
            <div>
              <b>SMALL SIDES. BIG ENERGY.</b>
              <span>Past AFC session format: up to 40 players · 18+ community</span>
            </div>
            <button className="text-link" onClick={() => scrollTo('join')}>
              REGISTER INTEREST <ArrowRight size={15}/>
            </button>
          </div>
          <p className="disclaimer">
            Event dates and availability are announced by AFC. Please confirm the next session before travelling or making payment.
          </p>
        </section>

        <section className="gallery-section section-pad" id="gallery">
          <div className="section-label">
            <span>03 / THE MOMENTS</span><span>FRAME BY FRAME</span>
          </div>
          <div className="section-title-row gallery-heading">
            <div>
              <p className="eyebrow">MEMORIES MADE ON THE PITCH</p>
              <h2>THE GAME<br/><em>IN MOTION.</em></h2>
            </div>
            <p className="title-aside">Every pass. Every goal.<br/>Every new connection.</p>
          </div>

          <div className="gallery-grid">
            {gallery.map((item, i) => (
              <button
                className={`gallery-item gallery-${i + 1}`}
                key={item.title}
                onClick={() => setActiveImage(item)}
                style={{ backgroundImage: `url(${item.image})` }}
              >
                <span className="gallery-overlay"/>
                <span className="gallery-meta">
                  <small>{item.type}</small><b>{item.title}</b>
                </span>
                <span className="gallery-open"><ArrowUpRight size={19}/></span>
              </button>
            ))}
          </div>
          <div className="gallery-foot">
            <Camera size={17}/>
            <span>OFFICIAL AFC EVENT PHOTOS WILL APPEAR HERE</span>
            <span className="gallery-line"/>
          </div>
        </section>

        <section className="timeline-section section-pad" id="timeline">
          <div className="section-label">
            <span>04 / OUR JOURNEY</span><span>THE AFC TIMELINE</span>
          </div>
          <div className="timeline-heading">
            <p className="eyebrow">ONE CLUB. MANY CHAPTERS.</p>
            <h2>THIS IS JUST<br/>THE <em>START.</em></h2>
          </div>
          <div className="timeline-track">
            <div className="timeline-pitch">
              <span className="pitch-center"/>
              <span className="pitch-ball"><CircleDot/></span>
            </div>
            {milestones.map((m) => (
              <article className="milestone" key={m.no}>
                <span className="milestone-no">{m.no}</span>
                <div>
                  <small>{m.date}</small>
                  <h3>{m.title}</h3>
                  <p>{m.text}</p>
                </div>
                <Flag size={19}/>
              </article>
            ))}
          </div>
        </section>

        <section className="join-section section-pad" id="join">
          <div className="join-image"/>
          <div className="join-shade"/>
          <div className="join-content">
            <div className="section-label">
              <span>05 / YOUR MOVE</span><span>JOIN THE COMMUNITY</span>
            </div>
            <div className="join-grid">
              <div>
                <p className="eyebrow">THE NEXT PASS IS YOURS</p>
                <h2>DON'T JUST<br/>WATCH THE <em>GAME.</em><br/>BE IN IT.</h2>
                <p className="join-intro">
                  Leave your details to register your interest in upcoming AFC sessions. Our team will share confirmed event information through official club channels.
                </p>
                <div className="join-points">
                  <span><ShieldCheck/> 18+ community</span>
                  <span><Users/> All skill levels welcome</span>
                  <span><MapPin/> Anantapur, Andhra Pradesh</span>
                </div>
              </div>

              <form className="join-form" onSubmit={submit}>
                <div className="form-heading">
                  <span>PLAYER INTEREST FORM</span><Ticket size={20}/>
                </div>

                <label>FULL NAME
                  <input
                    value={form.name}
                    onChange={e => update('name', e.target.value)}
                    placeholder="Enter your name"
                    required
                  />
                </label>

                <div className="form-row">
                  <label>MOBILE NUMBER
                    <input
                      value={form.phone}
                      onChange={e => update('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="10-digit number"
                      inputMode="numeric"
                      required
                    />
                  </label>
                  <label>AGE
                    <input
                      type="number"
                      min="18"
                      max="100"
                      value={form.age}
                      onChange={e => update('age', e.target.value)}
                      placeholder="18+"
                      required
                    />
                  </label>
                </div>

                <label>PLAYING POSITION
                  <select
                    value={form.position}
                    onChange={e => update('position', e.target.value)}
                  >
                    <option value="">Choose position (optional)</option>
                    <option>Goalkeeper</option>
                    <option>Defender</option>
                    <option>Midfielder</option>
                    <option>Forward</option>
                    <option>Any position</option>
                  </select>
                </label>

                <label>EMERGENCY CONTACT
                  <input
                    value={form.emergency}
                    onChange={e => update('emergency', e.target.value)}
                    placeholder="Name and number (optional)"
                  />
                </label>

                <button
                  className="btn btn-lime form-submit"
                  type="submit"
                  disabled={submitting}
                >
                  {submitting ? 'SUBMITTING...' : 'SEND MY INTEREST'}
                  <ArrowRight size={17}/>
                </button>

                {notice && <p className="form-notice">{notice}</p>}

                <p className="form-legal">
                  Registration requests are stored securely in AFC's registration database. Submission does not confirm a booking or process payment. AFC will communicate confirmed event details separately.
                </p>
              </form>
            </div>
          </div>
        </section>

        <section className="payment-social section-pad" id="connect">
          <div className="payment-card">
            <div className="payment-icon"><CreditCard/></div>
            <p className="eyebrow">PAYMENT INFORMATION</p>
            <h3>KEEP IT<br/><em>SIMPLE.</em></h3>
            <p>
              For the previously announced community session, the contribution was ₹149 with payment on arrival. Confirm the current fee and payment instructions through AFC's official channels before paying.
            </p>
            <div className="pay-note">
              <ShieldCheck size={17}/>
              <span>AFC will not ask you to transfer money to an unverified personal account.</span>
            </div>
          </div>

          <div className="social-card">
            <div className="social-top">
              <Instagram size={24}/><span>THE AFC SOCIAL CLUB</span>
            </div>
            <p className="eyebrow">FOLLOW THE JOURNEY</p>
            <h3>THE BEST<br/>MOMENTS LIVE<br/><em>TOGETHER.</em></h3>
            <p>Matchday updates, community stories and moments from Anantapur.</p>
            <a
              className="social-link"
              href="https://www.instagram.com/anantapurfc/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Visit Anantapur Football Club on Instagram"
            >
              FOLLOW @ANANTAPURFC <ArrowUpRight size={17}/>
            </a>
            <small>@ANANTAPURFC · OFFICIAL AFC INSTAGRAM</small>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="footer-main">
          <a className="brand footer-brand" href="#home" onClick={(e) => {
            e.preventDefault();
            scrollTo('home');
          }}>
            <span className="brand-mark"><Footprints size={22}/><i>A</i></span>
            <span className="brand-copy">
              <b>ANANTAPUR</b><small>FOOTBALL CLUB</small>
            </span>
          </a>
          <p>MORE THAN A GAME.<br/><em>A COMMUNITY.</em></p>
          <button className="back-top" onClick={() => scrollTo('home')}>
            BACK TO TOP <ArrowUpRight size={16}/>
          </button>
        </div>
        <div className="footer-bottom">
          <span>© 2026 ANANTAPUR FOOTBALL CLUB</span>
          <span>PLAY. CONNECT. BELONG.</span>
          <span>MADE FOR THE LOVE OF FOOTBALL.</span>
        </div>
      </footer>

      {activeImage && (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={activeImage.title}
          onClick={() => setActiveImage(null)}
        >
          <button
            className="lightbox-close"
            onClick={() => setActiveImage(null)}
            aria-label="Close image"
          >
            <X/>
          </button>
          <img src={activeImage.image} alt={activeImage.title}/>
          <div>
            <small>{activeImage.type}</small>
            <h3>{activeImage.title}</h3>
          </div>
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App/>);
