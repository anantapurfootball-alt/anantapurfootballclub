
import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowDown, ArrowRight, ArrowUpRight, Instagram, Menu, X,
  MapPin, Clock3, CalendarDays, Users, Footprints, ShieldCheck,
  Ticket, Camera, CircleDot, ChevronRight, Mail, Phone, Play,
  CreditCard, Heart, Flag, Search, LogOut, Lock, RefreshCw
} from 'lucide-react';
import { supabase } from './supabase';
import { QRCodeSVG } from 'qrcode.react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import './style.css';

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

const roles = [
  'admin',
  'staff',
  'event_manager',
  'gallery_manager',
  'checkin_staff'
];

function AdminDashboard() {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState('');
  const [activeTab, setActiveTab] = useState('registrations');
  const [players, setPlayers] = useState([]);
  const [playerSearch, setPlayerSearch] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [playerCode, setPlayerCode] = useState('');
  const [playerBusy, setPlayerBusy] = useState(false);
  const [selectedQr, setSelectedQr] = useState(null);
  const [scanResult, setScanResult] = useState('');
  const [scanBusy, setScanBusy] = useState(false);
  const scanLockRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    async function checkLogin() {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        if (mounted) {
          setNotice(error.message);
          setLoading(false);
        }
        return;
      }

      if (data.session && mounted) {
        setSession(data.session);
        await loadProfile(data.session.user.id, mounted);
      } else if (mounted) {
        setLoading(false);
      }
    }

    checkLogin();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!mounted) return;

        setSession(newSession);

        if (newSession) {
          await loadProfile(newSession.user.id, mounted);
        } else {
          setRole('');
          setRegistrations([]);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function loadProfile(userId, mounted = true) {
    if (mounted) {
      setLoading(true);
      setNotice('');
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (!mounted) return;

    if (error || !data || !roles.includes(data.role)) {
      setRole('');
      setNotice('Your account does not have an authorised AFC staff role.');
      setLoading(false);
      return;
    }

    setRole(data.role);

    if (data.role === 'admin' || data.role === 'staff') {
      await loadRegistrations();
      if (data.role === 'admin') await loadPlayers();
    } else if (data.role === 'checkin_staff') {
      setLoading(false);
    } else {
      setNotice(
        data.role === 'event_manager'
          ? 'Event Manager access verified. Registration records are not enabled for this role yet.'
          : data.role === 'gallery_manager'
          ? 'Gallery Manager access verified. Gallery management will be added next.'
          : 'Check-in Staff access verified. QR check-in will be added next.'
      );
      setLoading(false);
    }
  }

  async function loadRegistrations() {
    setBusy(true);
    setNotice('');

    const { data, error } = await supabase
      .from('registrations')
      .select('id, registration_code, full_name, phone, age, status, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      setNotice('Could not load registrations: ' + error.message);
      setRegistrations([]);
    } else {
      setRegistrations(data || []);
    }

    setBusy(false);
    setLoading(false);
  }

  async function loadPlayers() {
    const { data, error } = await supabase.rpc('afc_admin_list_players');
    if (error) {
      setNotice('Player directory is not enabled yet. Apply the AFC player-management SQL included with this project. ' + error.message);
      setPlayers([]);
      return;
    }
    setPlayers(data || []);
  }

  function suggestedPlayerCode(player) {
    const firstName = (player.full_name || '').trim().split(/\s+/)[0];
    const phone = String(player.phone || '');
    if (!firstName || phone.length < 2) return '';
    return firstName.replace(/[^a-z]/gi, '').slice(0, 3).toUpperCase() + phone.slice(-2) + phone.slice(0, 2);
  }

  async function savePlayerCode() {
    if (!selectedPlayer || !playerCode.trim()) return;
    setPlayerBusy(true);
    setNotice('');
    const { error } = await supabase.rpc('afc_admin_assign_player_code', {
      p_player_id: selectedPlayer.id,
      p_player_code: playerCode.trim().toUpperCase()
    });
    if (error) {
      if (error.code === '23505' || /duplicate|already exists/i.test(error.message)) {
        setNotice('Player ID already taken. Try ' + playerCode.trim().toUpperCase() + '01, ' + playerCode.trim().toUpperCase() + '02, or enter another available ID.');
      } else {
        setNotice(error.message);
      }
    } else {
      setNotice('Permanent Player ID assigned successfully.');
      setSelectedPlayer(null);
      setPlayerCode('');
      await loadPlayers();
    }
    setPlayerBusy(false);
  }

  useEffect(() => {
    if (activeTab !== 'scanner' || !session || !['admin', 'staff', 'checkin_staff'].includes(role)) return;
    const scanner = new Html5QrcodeScanner('afc-qr-reader', {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      rememberLastUsedCamera: true
    }, false);
    scanner.render(async (decodedText) => {
      // QR cameras can decode the same code many times per second.
      // A ref provides an immediate lock before React has time to re-render.
      if (scanLockRef.current) return;
      scanLockRef.current = true;
      const scanStartedAt = Date.now();
      const registrationId = decodedText.startsWith('AFCREG:')
        ? decodedText.slice(7).trim()
        : decodedText.trim();
      setScanBusy(true);
      setScanResult('QR detected. Verifying…');
      let finalMessage = '';
      try {
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(registrationId)) {
          finalMessage = 'Invalid AFC QR code. Please scan a registration QR generated by this dashboard.';
        } else {
          const { data, error } = await supabase.rpc('afc_check_in', {
            p_registration_id: registrationId
          });
          if (error) throw error;
          finalMessage = data === 'ALREADY_CHECKED_IN'
            ? 'Already checked in. This QR code has been used.'
            : 'Check-in successful! Attendance has been recorded.';
        }
      } catch (err) {
        finalMessage = err.message || 'Check-in failed.';
      }
      // Keep the scan feedback visible for at least 2 seconds from detection,
      // even when the server responds immediately.
      const remainingDelay = Math.max(0, 2000 - (Date.now() - scanStartedAt));
      window.setTimeout(() => {
        setScanResult(finalMessage);
        setScanBusy(false);
        scanLockRef.current = false;
      }, remainingDelay);
    }, () => {});
    return () => { scanner.clear().catch(() => {}); };
  }, [activeTab, session, role]);

  async function handleCheckIn(registrationId) {
    setScanBusy(true);
    setScanResult('Verifying registration…');
    try {
      const { data, error } = await supabase.rpc('afc_check_in', {
        p_registration_id: registrationId
      });
      if (error) throw error;
      setScanResult(data === 'ALREADY_CHECKED_IN'
        ? 'Already checked in. This QR code has been used.'
        : 'Check-in successful! Attendance has been recorded.');
    } catch (err) {
      setScanResult(err.message || 'Check-in failed.');
    } finally {
      setScanBusy(false);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setBusy(true);
    setNotice('');

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });

    if (error) {
      setNotice(error.message);
    }

    setBusy(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setSession(null);
    setRole('');
    setRegistrations([]);
    setNotice('');
  }

  const filtered = registrations.filter((item) => {
    const term = search.toLowerCase();

    return (
      (item.full_name || '').toLowerCase().includes(term) ||
      (item.phone || '').includes(term) ||
      (item.registration_code || '').toLowerCase().includes(term)
    );
  });

  const adminStyle = {
    minHeight: '100vh',
    background: '#10130f',
    color: '#f5f5ef',
    padding: '28px 5%',
    fontFamily: 'Arial, sans-serif'
  };

  const cardStyle = {
    background: '#1b2019',
    border: '1px solid #343b30',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '18px'
  };

  const inputStyle = {
    width: '100%',
    padding: '13px',
    marginTop: '8px',
    borderRadius: '7px',
    border: '1px solid #444',
    background: '#10130f',
    color: 'white',
    boxSizing: 'border-box'
  };

  if (loading) {
    return (
      <div style={adminStyle}>
        <h2>AFC ADMIN</h2>
        <p>Checking your account...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div style={{ ...adminStyle, display: 'grid', placeItems: 'center' }}>
        <div style={{ ...cardStyle, width: 'min(420px, 100%)', boxSizing: 'border-box' }}>
          <h2 style={{ fontSize: 28, marginBottom: 5 }}>AFC ADMIN</h2>
          <p style={{ color: '#b3b8ad' }}>ANANTAPUR FOOTBALL CLUB</p>
          <div style={{ height: 1, background: '#343b30', margin: '24px 0' }} />

          <form onSubmit={handleLogin}>
            <label>
              EMAIL ADDRESS
              <input
                style={inputStyle}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Admin email"
                autoComplete="username"
                required
              />
            </label>

            <label style={{ display: 'block', marginTop: 18 }}>
              PASSWORD
              <input
                style={inputStyle}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                autoComplete="current-password"
                required
              />
            </label>

            <button
              type="submit"
              disabled={busy}
              style={{
                width: '100%',
                padding: 14,
                marginTop: 22,
                border: 0,
                borderRadius: 7,
                background: '#c9f36b',
                color: '#111',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              {busy ? 'SIGNING IN...' : 'SIGN IN'}
            </button>
          </form>

          {notice && (
            <p style={{ color: '#ffb5a8', marginTop: 18 }}>
              {notice}
            </p>
          )}

          <p style={{ color: '#92998d', fontSize: 12, marginTop: 22 }}>
            Authorised AFC team members only.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={adminStyle}>
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 15,
        flexWrap: 'wrap',
        marginBottom: 30
      }}>
        <div>
          <h1 style={{ margin: 0 }}>AFC ADMIN</h1>
          <p style={{ color: '#b3b8ad' }}>ANANTAPUR FOOTBALL CLUB</p>
        </div>

        <button
          onClick={handleLogout}
          style={{
            padding: '11px 16px',
            background: '#30382b',
            color: 'white',
            border: '1px solid #4a5542',
            borderRadius: 7,
            cursor: 'pointer'
          }}
        >
          <LogOut size={15} style={{ verticalAlign: 'middle' }} /> LOG OUT
        </button>
      </header>

      <div style={cardStyle}>
        <p style={{ color: '#c9f36b', fontSize: 12, fontWeight: 700 }}>
          ACCOUNT VERIFIED
        </p>
        <h2 style={{ margin: '8px 0' }}>Welcome to AFC Dashboard</h2>
        <p style={{ color: '#b3b8ad' }}>
          Signed in as: {session.user.email}
        </p>
        <p>
          Your role: <strong style={{ color: '#c9f36b' }}>{role}</strong>
        </p>
      </div>

      {(role === 'admin' || role === 'staff' || role === 'checkin_staff') && (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: 15,
            marginBottom: 22
          }}>
            <div style={cardStyle}>
              <p style={{ color: '#b3b8ad' }}>TOTAL REGISTRATIONS</p>
              <h1 style={{ fontSize: 38, margin: 0 }}>{registrations.length}</h1>
            </div>
            <div style={cardStyle}>
              <p style={{ color: '#b3b8ad' }}>CURRENT EVENT CAPACITY</p>
              <h1 style={{ fontSize: 38, margin: 0 }}>40</h1>
            </div>
          </div>

          <div style={{ ...cardStyle, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {role !== 'checkin_staff' && <button onClick={() => setActiveTab('registrations')} style={{ padding: '10px 15px', border: 0, borderRadius: 7, background: activeTab === 'registrations' ? '#c9f36b' : '#30382b', color: activeTab === 'registrations' ? '#111' : '#fff', cursor: 'pointer' }}>REGISTRATIONS</button>}
            {role === 'admin' && <button onClick={() => { setActiveTab('players'); loadPlayers(); }} style={{ padding: '10px 15px', border: 0, borderRadius: 7, background: activeTab === 'players' ? '#c9f36b' : '#30382b', color: activeTab === 'players' ? '#111' : '#fff', cursor: 'pointer' }}>PLAYER MANAGEMENT</button>}
            {['admin', 'staff', 'checkin_staff'].includes(role) && <button onClick={() => { setActiveTab('scanner'); setScanResult(''); }} style={{ padding: '10px 15px', border: 0, borderRadius: 7, background: activeTab === 'scanner' ? '#c9f36b' : '#30382b', color: activeTab === 'scanner' ? '#111' : '#fff', cursor: 'pointer' }}>QR CHECK-IN</button>}
          </div>

          {activeTab === 'scanner' ? (
            <div style={cardStyle}>
              <h2>QR Check-in Scanner</h2>
              <p style={{ color: '#b3b8ad' }}>Allow camera access and scan a player's AFC registration QR code. Camera access requires localhost or HTTPS.</p>
              <div id="afc-qr-reader" style={{ maxWidth: 520, background: '#fff', color: '#111', padding: 12, borderRadius: 10 }} />
              {scanResult && <p role="status" style={{ marginTop: 16, color: scanResult.includes('successful') ? '#c9f36b' : '#f5d18b' }}>{scanResult}</p>}
              {scanBusy && <p>Processing check-in…</p>}
            </div>
          ) : activeTab === 'players' && role === 'admin' ? (
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <div><h2>Player Management</h2><p style={{ color: '#b3b8ad' }}>Assign permanent Player IDs. Only Admin can perform this action.</p></div>
                <button onClick={loadPlayers} style={{ padding: '10px 14px', border: 0, borderRadius: 7, background: '#c9f36b', cursor: 'pointer' }}>REFRESH PLAYERS</button>
              </div>
              <input style={inputStyle} value={playerSearch} onChange={e => setPlayerSearch(e.target.value)} placeholder="Search player name or phone" />
              {notice && <p style={{ color: '#f5d18b' }}>{notice}</p>}
              <div style={{ overflowX: 'auto', marginTop: 16 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 650, textAlign: 'left' }}>
                  <thead><tr style={{ color: '#c9f36b' }}>{['PLAYER','PHONE','PERMANENT ID','ATTENDANCE','ACTION'].map(h => <th key={h} style={{ padding: 12, borderBottom: '1px solid #444' }}>{h}</th>)}</tr></thead>
                  <tbody>{players.filter(p => (p.full_name || '').toLowerCase().includes(playerSearch.toLowerCase()) || (p.phone || '').includes(playerSearch)).map(player => <tr key={player.id}>
                    <td style={{ padding: 12, borderBottom: '1px solid #343b30' }}>{player.full_name}</td>
                    <td style={{ padding: 12, borderBottom: '1px solid #343b30' }}>{player.phone}</td>
                    <td style={{ padding: 12, borderBottom: '1px solid #343b30', color: '#c9f36b' }}>{player.player_code || 'Not assigned'}</td>
                    <td style={{ padding: 12, borderBottom: '1px solid #343b30' }}>{player.attendance_count ?? 0}</td>
                    <td style={{ padding: 12, borderBottom: '1px solid #343b30' }}><button onClick={() => { setSelectedPlayer(player); setPlayerCode(player.player_code || suggestedPlayerCode(player)); setNotice(''); }} style={{ padding: '8px 11px', border: 0, borderRadius: 6, background: '#c9f36b', cursor: 'pointer' }}>{player.player_code ? 'EDIT ID' : 'ASSIGN ID'}</button></td>
                  </tr>)}</tbody>
                </table>
                {players.length === 0 && <p style={{ color: '#b3b8ad' }}>No player records found, or the secure Player Management SQL has not been applied.</p>}
              </div>
              {selectedPlayer && <div style={{ marginTop: 22, padding: 18, border: '1px solid #59634e', borderRadius: 9 }}>
                <h3>Assign permanent Player ID</h3><p style={{ color: '#b3b8ad' }}>{selectedPlayer.full_name} · {selectedPlayer.phone}</p>
                <label>PLAYER ID<input style={inputStyle} value={playerCode} onChange={e => setPlayerCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} /></label>
                <p style={{ color: '#92998d', fontSize: 12 }}>Suggested format: first 3 letters of first name + last 2 digits + first 2 digits of mobile number. You can edit it before saving.</p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}><button disabled={playerBusy || !playerCode.trim()} onClick={savePlayerCode} style={{ padding: '11px 16px', border: 0, borderRadius: 7, background: '#c9f36b', cursor: 'pointer' }}>{playerBusy ? 'SAVING...' : 'SAVE PLAYER ID'}</button><button onClick={() => { setSelectedPlayer(null); setPlayerCode(''); }} style={{ padding: '11px 16px', border: '1px solid #59634e', borderRadius: 7, background: 'transparent', color: '#fff', cursor: 'pointer' }}>CANCEL</button></div>
              </div>}
            </div>
          ) : (
          <div style={cardStyle}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 12,
              alignItems: 'center',
              flexWrap: 'wrap'
            }}>
              <h2>Player Registrations</h2>
              <button
                onClick={loadRegistrations}
                disabled={busy}
                style={{
                  padding: '10px 14px',
                  borderRadius: 7,
                  border: 0,
                  background: '#c9f36b',
                  cursor: 'pointer'
                }}
              >
                <RefreshCw size={14} style={{ verticalAlign: 'middle' }} /> REFRESH
              </button>
            </div>

            <div style={{ position: 'relative', margin: '18px 0' }}>
              <Search
                size={17}
                style={{ position: 'absolute', left: 12, top: 15, color: '#999' }}
              />
              <input
                style={{ ...inputStyle, paddingLeft: 40, marginTop: 0 }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search player, phone or registration ID"
              />
            </div>

            {notice && <p style={{ color: '#f5d18b' }}>{notice}</p>}

            {filtered.length === 0 ? (
              <p style={{ color: '#b3b8ad' }}>
                No registrations to display.
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  minWidth: 650,
                  textAlign: 'left'
                }}>
                  <thead>
                    <tr style={{ color: '#c9f36b' }}>
                      {['PLAYER', 'REGISTRATION ID', 'PHONE', 'AGE', 'STATUS', 'QR CODE'].map((heading) => (
                        <th key={heading} style={{ padding: 12, borderBottom: '1px solid #444' }}>
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((item) => (
                      <tr key={item.id}>
                        <td style={{ padding: 12, borderBottom: '1px solid #343b30' }}>
                          {item.full_name}
                        </td>
                        <td style={{ padding: 12, borderBottom: '1px solid #343b30' }}>
                          {item.registration_code}
                        </td>
                        <td style={{ padding: 12, borderBottom: '1px solid #343b30' }}>
                          {item.phone}
                        </td>
                        <td style={{ padding: 12, borderBottom: '1px solid #343b30' }}>
                          {item.age}
                        </td>
                        <td style={{ padding: 12, borderBottom: '1px solid #343b30' }}>
                          {item.status || 'Pending'}
                        </td>
                        <td style={{ padding: 12, borderBottom: '1px solid #343b30' }}><button onClick={() => setSelectedQr(item)} style={{ padding: '7px 10px', border: 0, borderRadius: 6, background: '#c9f36b', cursor: 'pointer' }}>SHOW QR</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          )}
        </>
      )}

      {selectedQr && (
        <div onClick={() => setSelectedQr(null)} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.82)', display: 'grid', placeItems: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#1b2019', color: '#fff', border: '1px solid #59634e', borderRadius: 14, padding: 24, width: 'min(360px, 100%)', textAlign: 'center' }}>
            <h2>AFC Registration QR</h2>
            <p>{selectedQr.full_name}</p>
            <p style={{ color: '#c9f36b' }}>{selectedQr.registration_code}</p>
            <div style={{ background: '#fff', display: 'inline-block', padding: 14, borderRadius: 8 }}>
              <QRCodeSVG value={`AFCREG:${selectedQr.id}`} size={220} level="M" includeMargin />
            </div>
            <p style={{ color: '#b3b8ad', fontSize: 12 }}>Show this code to AFC check-in staff.</p>
            <button onClick={() => setSelectedQr(null)} style={{ padding: '10px 16px', border: 0, borderRadius: 7, background: '#c9f36b', cursor: 'pointer' }}>CLOSE</button>
          </div>
        </div>
      )}

      {role !== 'admin' && role !== 'staff' && role !== 'checkin_staff' && (
        <div style={cardStyle}>
          <h2>Team Workspace</h2>
          <p style={{ color: '#b3b8ad' }}>{notice}</p>
        </div>
      )}

      <p style={{ color: '#8e9687', fontSize: 12, marginTop: 35 }}>
        AFC ADMIN · Secure team access · Anantapur
      </p>
    </div>
  );
}

function Website() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    age: '',
    position: '',
    emergency: ''
  });
  const [notice, setNotice] = useState('');
  const [noticeType, setNoticeType] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeImage, setActiveImage] = useState(null);
  const [progress, setProgress] = useState(0);

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

  const submit = async (e) => {
    e.preventDefault();
    setNotice('');
    setNoticeType('');

    const fullName = form.name.trim();
    const phone = form.phone.trim();
    const age = Number(form.age);

    if (!fullName || !phone || !form.age) {
      setNoticeType('error');
      setNotice('Please complete your name, mobile number and age.');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(phone)) {
      setNoticeType('error');
      setNotice('Enter a valid 10-digit Indian mobile number.');
      return;
    }

    if (!Number.isInteger(age) || age < 18 || age > 100) {
      setNoticeType('error');
      setNotice('AFC community sessions are for participants aged 18 to 100.');
      return;
    }

    setSubmitting(true);

    try {
      const { data, error } = await supabase.rpc('afc_register_interest', {
        p_full_name: fullName,
        p_phone: phone,
        p_age: age,
        p_emergency_contact: form.emergency.trim() || null
      });

      if (error) {
        const raw = [error.message, error.details, error.hint]
          .filter(Boolean).join(' ').toLowerCase();

        if (raw.includes('already registered') || raw.includes('duplicate key') || error.code === '23505') {
          throw new Error('You are already registered for this event. Please contact AFC if you need help finding your registration.');
        }
        if (raw.includes('slots are full') || raw.includes('capacity')) {
          throw new Error('Sorry! All event slots are filled. Please follow AFC for the next session.');
        }
        if (raw.includes('not currently open') || raw.includes('draft') || raw.includes('published')) {
          throw new Error('Registration is currently closed. Please check AFC official channels for updates.');
        }
        if (raw.includes('valid indian mobile')) {
          throw new Error('Enter a valid 10-digit Indian mobile number.');
        }
        if (raw.includes('18 or older')) {
          throw new Error('AFC community sessions are currently for participants aged 18+.');
        }
        throw new Error(error.message || 'Registration could not be submitted. Please try again.');
      }

      if (typeof data !== 'string' || !data.trim()) {
        throw new Error('We could not confirm your registration. Please try again or contact AFC.');
      }

      setNoticeType('success');
      setNotice(`Registration successful! Your AFC registration ID is ${data}. Please save this reference. This is not a payment receipt.`);
      setForm({ name: '', phone: '', age: '', position: '', emergency: '' });
    } catch (error) {
      console.error('AFC registration error:', error);
      setNoticeType('error');
      setNotice(error.message || 'Unable to submit your registration. Check your internet connection and try again.');
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
      <div className="scroll-progress" style={{ transform: `scaleX(${progress})` }} />

      <header className="header">
        <a className="brand" href="#home" onClick={(e) => {
          e.preventDefault();
          scrollTo('home');
        }}>
          <span className="brand-mark"><Footprints size={22}/><i>A</i></span>
          <span className="brand-copy"><b>ANANTAPUR</b><small>FOOTBALL CLUB</small></span>
        </a>

        <nav className="desktop-nav">
          {navItems.map(([label, id]) => (
            <button key={id} onClick={() => scrollTo(id)}>{label}</button>
          ))}
        </nav>

        <button className="header-cta" onClick={() => scrollTo('join')}>
          JOIN THE GAME <ArrowUpRight size={15}/>
        </button>

        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation">
          {menuOpen ? <X/> : <Menu/>}
        </button>

        {menuOpen && (
          <nav className="mobile-nav">
            {navItems.map(([label, id]) => (
              <button key={id} onClick={() => scrollTo(id)}>
                {label}<ArrowRight size={15}/>
              </button>
            ))}
            <button onClick={() => scrollTo('join')}>JOIN AFC <ArrowRight size={15}/></button>
          </nav>
        )}
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-image" />
          <div className="hero-shade" />
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
            <button onClick={() => scrollTo('story')}>SCROLL TO EXPLORE <ArrowDown size={14}/></button>
            <span>01 — 06</span>
          </div>
          <div className="hero-orbit">
            <div className="orbit-ring"/>
            <div className="orbit-ball"><CircleDot size={38}/></div>
            <span>FOOTBALL<br/>IS OUR COMMON<br/>LANGUAGE</span>
          </div>
        </section>

        <div className="marquee">
          <div>FOOTBALL IS FOR EVERYONE <b>✳</b> BUILT IN ANANTAPUR <b>✳</b> PLAY MORE. LIVE MORE. <b>✳</b> FOOTBALL IS FOR EVERYONE <b>✳</b> BUILT IN ANANTAPUR <b>✳</b></div>
        </div>

        <section className="story section-pad" id="story">
          <div className="section-label"><span>01 / THE CLUB</span><span>OUR STORY</span></div>
          <div className="story-grid">
            <div className="story-heading">
              <p className="eyebrow">NOT JUST NINETY MINUTES</p>
              <h2>WE PLAY<br/>FOR THE <em>FEELING.</em></h2>
              <div className="scribble-line"/>
            </div>
            <div className="story-text">
              <p className="big-copy">Life gets busy. The game brings us back.</p>
              <p>Anantapur Football Club is a community-first football initiative created to make sport part of everyday life for adults. No matter your experience, the pitch is a place to move, meet people and belong.</p>
              <button className="text-link" onClick={() => scrollTo('join')}>
                BECOME PART OF THE STORY <ArrowUpRight size={16}/>
              </button>
            </div>
          </div>
          <div className="principles">
            <article><span>01</span><Footprints/><h3>PLAY</h3><p>Move your body. Enjoy every touch.</p></article>
            <article><span>02</span><Users/><h3>CONNECT</h3><p>Meet good people. Build friendships.</p></article>
            <article><span>03</span><Heart/><h3>BELONG</h3><p>Find your place in the local game.</p></article>
            <article className="principle-stat"><strong>18<sup>+</sup></strong><small>COMMUNITY<br/>AGE GROUP</small></article>
          </div>
        </section>

        <section className="matchday section-pad" id="events">
          <div className="section-label"><span>02 / THE FIXTURES</span><span>SHOW UP & PLAY</span></div>
          <div className="section-title-row">
            <div><p className="eyebrow">YOUR PITCH IS WAITING</p><h2>UP NEXT<span className="lime-dot">.</span></h2></div>
            <div className="title-aside">Every great story<br/>starts with a kickoff.</div>
          </div>
          <div className="event-list">
            {eventData.map((event, i) => (
              <article className={`event-card ${i === 0 ? 'featured' : ''}`} key={event.id}>
                <div className="event-photo" style={{ backgroundImage: `url(${event.image})` }}>
                  <span>{event.id}</span><b>{String(i + 1).padStart(2, '0')}</b>
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
                    <div className="event-fee"><small>SESSION CONTRIBUTION</small><strong>{event.fee}</strong></div>
                    <button className="round-arrow" onClick={() => scrollTo('join')} aria-label="Register for event"><ArrowUpRight/></button>
                  </div>
                  <small className="event-note">{event.status}</small>
                </div>
              </article>
            ))}
          </div>
          <div className="capacity-strip">
            <div className="capacity-icon"><Users/></div>
            <div><b>SMALL SIDES. BIG ENERGY.</b><span>Past AFC session format: up to 40 players · 18+ community</span></div>
            <button className="text-link" onClick={() => scrollTo('join')}>REGISTER INTEREST <ArrowRight size={15}/></button>
          </div>
          <p className="disclaimer">Event dates and availability are announced by AFC. Please confirm the next session before travelling or making payment.</p>
        </section>

        <section className="gallery-section section-pad" id="gallery">
          <div className="section-label"><span>03 / THE MOMENTS</span><span>FRAME BY FRAME</span></div>
          <div className="section-title-row gallery-heading">
            <div><p className="eyebrow">MEMORIES MADE ON THE PITCH</p><h2>THE GAME<br/><em>IN MOTION.</em></h2></div>
            <p className="title-aside">Every pass. Every goal.<br/>Every new connection.</p>
          </div>
          <div className="gallery-grid">
            {gallery.map((item, i) => (
              <button className={`gallery-item gallery-${i + 1}`} key={item.title} onClick={() => setActiveImage(item)} style={{ backgroundImage: `url(${item.image})` }}>
                <span className="gallery-overlay"/>
                <span className="gallery-meta"><small>{item.type}</small><b>{item.title}</b></span>
                <span className="gallery-open"><ArrowUpRight size={19}/></span>
              </button>
            ))}
          </div>
          <div className="gallery-foot">
            <Camera size={17}/><span>OFFICIAL AFC EVENT PHOTOS WILL APPEAR HERE</span><span className="gallery-line"/>
          </div>
        </section>

        <section className="timeline-section section-pad" id="timeline">
          <div className="section-label"><span>04 / OUR JOURNEY</span><span>THE AFC TIMELINE</span></div>
          <div className="timeline-heading">
            <p className="eyebrow">ONE CLUB. MANY CHAPTERS.</p>
            <h2>THIS IS JUST<br/>THE <em>START.</em></h2>
          </div>
          <div className="timeline-track">
            <div className="timeline-pitch"><span className="pitch-center"/><span className="pitch-ball"><CircleDot/></span></div>
            {milestones.map((m) => (
              <article className="milestone" key={m.no}>
                <span className="milestone-no">{m.no}</span>
                <div><small>{m.date}</small><h3>{m.title}</h3><p>{m.text}</p></div>
                <Flag size={19}/>
              </article>
            ))}
          </div>
        </section>

        <section className="join-section section-pad" id="join">
          <div className="join-image"/><div className="join-shade"/>
          <div className="join-content">
            <div className="section-label"><span>05 / YOUR MOVE</span><span>JOIN THE COMMUNITY</span></div>
            <div className="join-grid">
              <div>
                <p className="eyebrow">THE NEXT PASS IS YOURS</p>
                <h2>DON'T JUST<br/>WATCH THE <em>GAME.</em><br/>BE IN IT.</h2>
                <p className="join-intro">Leave your details to register your interest in upcoming AFC sessions. Our team will share confirmed event information through official club channels.</p>
                <div className="join-points">
                  <span><ShieldCheck/> 18+ community</span>
                  <span><Users/> All skill levels welcome</span>
                  <span><MapPin/> Anantapur, Andhra Pradesh</span>
                </div>
              </div>

              <form className="join-form" onSubmit={submit}>
                <div className="form-heading"><span>PLAYER INTEREST FORM</span><Ticket size={20}/></div>

                <label>FULL NAME
                  <input value={form.name} onChange={e => update('name', e.target.value)} placeholder="Enter your name" required/>
                </label>

                <div className="form-row">
                  <label>MOBILE NUMBER
                    <input value={form.phone} onChange={e => update('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit number" inputMode="numeric" required/>
                  </label>
                  <label>AGE
                    <input type="number" min="18" value={form.age} onChange={e => update('age', e.target.value)} placeholder="18+" required/>
                  </label>
                </div>

                <label>PLAYING POSITION
                  <select value={form.position} onChange={e => update('position', e.target.value)}>
                    <option value="">Choose position (optional)</option>
                    <option>Goalkeeper</option>
                    <option>Defender</option>
                    <option>Midfielder</option>
                    <option>Forward</option>
                    <option>Any position</option>
                  </select>
                </label>

                <label>EMERGENCY CONTACT
                  <input value={form.emergency} onChange={e => update('emergency', e.target.value)} placeholder="Name and number (optional)"/>
                </label>

                <button className="btn btn-lime form-submit" type="submit" disabled={submitting}>
                  {submitting ? 'SENDING...' : 'SEND MY INTEREST'} <ArrowRight size={17}/>
                </button>

                {notice && <div className={`form-notice ${noticeType === 'error' ? 'form-notice-error' : 'form-notice-success'}`} role={noticeType === 'error' ? 'alert' : 'status'} aria-live="polite">{notice}</div>}

                <p className="form-legal">
                  This is a registration request, not a confirmed booking. Payment and slot confirmation will be communicated separately by AFC.
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
            <p>For the previously announced community session, the contribution was ₹149 with payment on arrival. Confirm the current fee and payment instructions through AFC's official channels before paying.</p>
            <div className="pay-note"><ShieldCheck size={17}/><span>AFC will not ask you to transfer money to an unverified personal account.</span></div>
          </div>

          <div className="social-card">
            <div className="social-top"><Instagram size={24}/><span>THE AFC SOCIAL CLUB</span></div>
            <p className="eyebrow">FOLLOW THE JOURNEY</p>
            <h3>THE BEST<br/>MOMENTS LIVE<br/><em>TOGETHER.</em></h3>
            <p>Matchday updates, community stories and moments from Anantapur.</p>
            <a className="social-link" href="https://www.instagram.com/anantapurfc/" target="_blank" rel="noopener noreferrer" aria-label="Visit Anantapur Football Club on Instagram">
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
            <span className="brand-copy"><b>ANANTAPUR</b><small>FOOTBALL CLUB</small></span>
          </a>
          <p>MORE THAN A GAME.<br/><em>A COMMUNITY.</em></p>
          <button className="back-top" onClick={() => scrollTo('home')}>BACK TO TOP <ArrowUpRight size={16}/></button>
        </div>
        <div className="footer-bottom">
          <span>© 2026 ANANTAPUR FOOTBALL CLUB</span>
          <span>PLAY. CONNECT. BELONG.</span>
          <span>MADE FOR THE LOVE OF FOOTBALL.</span>
        </div>
      </footer>

      {activeImage && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={activeImage.title} onClick={() => setActiveImage(null)}>
          <button className="lightbox-close" onClick={() => setActiveImage(null)} aria-label="Close image"><X/></button>
          <img src={activeImage.image} alt={activeImage.title}/>
          <div><small>{activeImage.type}</small><h3>{activeImage.title}</h3></div>
        </div>
      )}
    </div>
  );
}

function App() {
  const isAdmin = window.location.pathname.replace(/\/+$/, '') === '/admin';

  return isAdmin ? <AdminDashboard/> : <Website/>;
}

createRoot(document.getElementById('root')).render(<App/>);
