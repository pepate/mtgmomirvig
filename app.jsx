const { useState, useEffect, useRef, useCallback } = React;

// PWA install prompt
let deferredInstallPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  window.dispatchEvent(new Event('pwainstallready'));
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js');
}

async function fetchRandomCreature(cmc) {
  const q = encodeURIComponent(`t:creature cmc=${cmc} legal:vintage -is:digital`);
  const url = `https://api.scryfall.com/cards/random?q=${q}`;
  const res = await fetch(url);
  if (!res.ok) {
    if (cmc === 0 || cmc >= 13) {
      const url2 = `https://api.scryfall.com/cards/random?q=${encodeURIComponent(`t:creature cmc=${cmc} -is:digital`)}`;
      const res2 = await fetch(url2);
      if (!res2.ok) throw new Error(`No creature found for CMC ${cmc}`);
      return res2.json();
    }
    throw new Error(`No creature found for CMC ${cmc}`);
  }
  return res.json();
}

function getImageUrl(card) {
  if (!card) return null;
  if (card.image_uris) return card.image_uris.normal || card.image_uris.large;
  if (card.card_faces && card.card_faces[0].image_uris) {
    return card.card_faces[0].image_uris.normal || card.card_faces[0].image_uris.large;
  }
  return null;
}

function Logo({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <path d="M16 6 L24 22 L8 22 Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
      <circle cx="16" cy="17" r="3" fill="currentColor" />
    </svg>
  );
}

function FloatingControls({ onSummon, loading, error, lastCmc, flipped, onBack }) {
  const [open, setOpen] = useState(false);
  const [cmc, setCmc] = useState(lastCmc ?? 1);

  useEffect(() => {
    if (lastCmc !== null && lastCmc !== undefined) setCmc(lastCmc);
  }, [lastCmc]);

  const dec = (e) => { e.stopPropagation(); setCmc(v => Math.max(0, v - 1)); };
  const inc = (e) => { e.stopPropagation(); setCmc(v => Math.min(16, v + 1)); };

  const submit = (e) => {
    e.stopPropagation();
    if (loading) return;
    onSummon(cmc);
    setOpen(false);
  };

  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDoc);
    return () => document.removeEventListener('pointerdown', onDoc);
  }, [open]);

  const Pill = ({ children, onClick, ariaLabel, accent, big }) => (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={loading}
      style={{
        width: 56, height: 56, flexShrink: 0,
        borderRadius: '50%',
        background: accent
          ? 'linear-gradient(180deg, oklch(0.78 0.13 175) 0%, oklch(0.65 0.13 175) 100%)'
          : 'rgba(20,30,32,0.92)',
        border: accent ? 'none' : '1px solid rgba(255,255,255,0.14)',
        color: accent ? '#062019' : 'var(--text)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 6px 16px rgba(0,0,0,0.5)',
        backdropFilter: accent ? 'none' : 'blur(8px)',
        transition: 'transform 80ms ease, opacity 200ms ease',
        opacity: loading ? 0.6 : 1,
        cursor: loading ? 'not-allowed' : 'pointer',
        fontFamily: 'Fraunces', fontSize: big ? 22 : 16, fontWeight: 500,
      }}
      onPointerDown={e => e.currentTarget.style.transform = 'scale(0.92)'}
      onPointerUp={e => e.currentTarget.style.transform = 'scale(1)'}
      onPointerLeave={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      {children}
    </button>
  );

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        ...(flipped
          ? { top: 14, right: 14, transformOrigin: 'center center' }
          : { bottom: 14, left: 14, transformOrigin: 'center center' }),
        zIndex: 40,
        transform: flipped ? 'rotate(180deg)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 10,
      }}
    >
      {error && open && (
        <div style={{
          padding: '8px 12px',
          borderRadius: 10,
          background: 'rgba(220,80,80,0.18)',
          border: '1px solid rgba(220,80,80,0.35)',
          color: 'oklch(0.88 0.12 25)',
          fontSize: 12,
          maxWidth: 240,
          backdropFilter: 'blur(6px)',
        }}>
          {error}
        </div>
      )}

      {open && (
        <button
          onClick={(e) => { e.stopPropagation(); onBack(); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 12px',
            borderRadius: 999,
            background: 'rgba(20,30,32,0.92)',
            border: '1px solid var(--line)',
            color: 'var(--text-dim)',
            fontSize: 10, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase',
            backdropFilter: 'blur(8px)',
            cursor: 'pointer',
          }}
        >
          <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
            <path d="M9 5H1M1 5L4 2M1 5L4 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Menu
        </button>
      )}

      {open ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Pill onClick={dec} ariaLabel="Decrease">
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
              <path d="M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </Pill>
          <Pill onClick={submit} ariaLabel="Summon" accent big>
            {loading ? (
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" opacity="0.3" />
                <path d="M11 3 A8 8 0 0 1 19 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <animateTransform attributeName="transform" type="rotate" from="0 11 11" to="360 11 11" dur="0.9s" repeatCount="indefinite" />
                </path>
              </svg>
            ) : cmc}
          </Pill>
          <Pill onClick={inc} ariaLabel="Increase">
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
              <path d="M3 8H13M8 3V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </Pill>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open summon controls"
          style={{
            width: 56, height: 56,
            borderRadius: '50%',
            background: 'linear-gradient(180deg, oklch(0.78 0.13 175) 0%, oklch(0.65 0.13 175) 100%)',
            border: 'none',
            color: '#062019',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.08) inset',
            cursor: 'pointer',
            transition: 'transform 100ms ease',
          }}
          onPointerDown={e => e.currentTarget.style.transform = 'scale(0.94)'}
          onPointerUp={e => e.currentTarget.style.transform = 'scale(1)'}
          onPointerLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M11 4V18M4 11H18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  );
}

function CreatureCard({ creature, onTap, onRemove, isNew, widthCss }) {
  const img = getImageUrl(creature.card);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [entered, setEntered] = useState(!isNew);

  useEffect(() => {
    if (isNew) {
      requestAnimationFrame(() => setEntered(true));
    }
  }, [isNew]);

  const w = widthCss || 'clamp(140px, 22vh, 220px)';

  return (
    <div
      style={{
        position: 'relative',
        flexShrink: 0,
        width: w,
        aspectRatio: '63 / 88',
        transition: 'transform 280ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 280ms ease, width 200ms ease',
        transform: `${entered ? 'scale(1)' : 'scale(0.7) translateY(20px)'} ${creature.tapped ? 'rotate(90deg)' : 'rotate(0deg)'}`,
        opacity: entered ? 1 : 0,
        transformOrigin: 'center center',
        marginRight: creature.tapped ? `calc(${w} * 0.18)` : 0,
      }}
    >
      <button
        onClick={onTap}
        style={{
          width: '100%',
          height: '100%',
          padding: 0,
          borderRadius: 12,
          overflow: 'hidden',
          background: 'rgba(0,0,0,0.4)',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          boxShadow: creature.tapped
            ? '0 4px 12px rgba(0,0,0,0.4)'
            : '0 8px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06) inset',
        }}
      >
        {img && (
          <img
            src={img}
            alt={creature.card.name}
            onLoad={() => setImgLoaded(true)}
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
              objectFit: 'cover',
              opacity: imgLoaded ? 1 : 0,
              transition: 'opacity 200ms ease',
            }}
          />
        )}
        {!imgLoaded && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #1a2a30 0%, #0e1a1d 100%)',
            color: 'var(--text-mute)', fontSize: 11, fontFamily: 'Inter',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Fraunces', fontSize: 32, color: 'var(--accent)', marginBottom: 4 }}>{creature.cmc}</div>
              <div style={{ letterSpacing: '0.15em', textTransform: 'uppercase' }}>loading</div>
            </div>
          </div>
        )}
      </button>

      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        aria-label="Remove creature"
        style={{
          position: 'absolute',
          bottom: 8,
          left: 8,
          width: 26,
          height: 26,
          borderRadius: '50%',
          background: 'rgba(15,22,25,0.85)',
          backdropFilter: 'blur(4px)',
          border: '1px solid rgba(255,255,255,0.18)',
          color: 'var(--text)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          fontWeight: 600,
          boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
          transform: creature.tapped ? 'rotate(-90deg)' : 'none',
          zIndex: 2,
        }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 2L10 10M10 2L2 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

function Battlefield({ creatures, onTap, onRemove, flipped, empty, fitCap }) {
  const scrollRef = useRef(null);
  const containerRef = useRef(null);
  const prevLen = useRef(creatures.length);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(entries => {
      for (const e of entries) {
        setContainerSize({ w: e.contentRect.width, h: e.contentRect.height });
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const PAD_Y = 56;
  const PAD_X = 56;
  const GAP = 16;
  const TAPPED_EXTRA = 0.18;
  const MAX_W = 260;
  const MIN_W = 80;

  let cardWidth = 180;
  let needsScroll = false;

  if (containerSize.h && containerSize.w && creatures.length > 0) {
    const maxByHeight = Math.max(MIN_W, Math.min(MAX_W, ((containerSize.h - PAD_Y) * 63 / 88)));
    const cap = fitCap || creatures.length;
    const sizingCount = Math.min(creatures.length, cap);
    const tappedConsidered = creatures.slice(0, sizingCount).filter(c => c.tapped).length;
    const effectiveCount = sizingCount + tappedConsidered * TAPPED_EXTRA;
    const maxByWidth = Math.max(MIN_W, (containerSize.w - PAD_X - GAP * Math.max(0, sizingCount - 1)) / effectiveCount);
    cardWidth = Math.min(maxByHeight, maxByWidth);
    if (creatures.length > cap) needsScroll = true;
  } else if (containerSize.h && containerSize.w) {
    cardWidth = Math.max(MIN_W, Math.min(MAX_W, ((containerSize.h - PAD_Y) * 63 / 88)));
  }

  const widthCss = `${cardWidth}px`;

  useEffect(() => {
    if (needsScroll && creatures.length > prevLen.current && scrollRef.current) {
      requestAnimationFrame(() => {
        const el = scrollRef.current;
        if (el) el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
      });
    }
    prevLen.current = creatures.length;
  }, [creatures.length, needsScroll]);

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        transform: flipped ? 'rotate(180deg)' : 'none',
        position: 'relative',
      }}
    >
      {empty && creatures.length === 0 ? (
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-mute)', fontSize: 12, letterSpacing: '0.15em', textTransform: 'uppercase',
        }}>
          Tap + to summon
        </div>
      ) : (
        <div
          ref={scrollRef}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: needsScroll ? 'flex-start' : 'center',
            gap: GAP,
            padding: '32px 28px 24px',
            overflowX: needsScroll ? 'auto' : 'hidden',
            overflowY: 'hidden',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255,255,255,0.15) transparent',
          }}
        >
          {creatures.map((c) => (
            <CreatureCard
              key={c.id}
              creature={c}
              onTap={() => onTap(c.id)}
              onRemove={() => onRemove(c.id)}
              isNew={c.isNew}
              widthCss={widthCss}
            />
          ))}
          {needsScroll && <div style={{ width: 4, flexShrink: 0 }} />}
        </div>
      )}
    </div>
  );
}

function PlayerPanel({ flipped, onBack, fitCap }) {
  const [creatures, setCreatures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastCmc, setLastCmc] = useState(null);

  const summon = useCallback(async (cmc) => {
    setLoading(true);
    setError(null);
    try {
      const card = await fetchRandomCreature(cmc);
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setCreatures(prev => [...prev, { id, card, cmc, tapped: false, isNew: true }]);
      setLastCmc(cmc);
      setTimeout(() => {
        setCreatures(prev => prev.map(c => c.id === id ? { ...c, isNew: false } : c));
      }, 400);
    } catch (e) {
      setError(e.message || 'Could not fetch creature');
    } finally {
      setLoading(false);
    }
  }, []);

  const tap = useCallback((id) => {
    setCreatures(prev => prev.map(c => c.id === id ? { ...c, tapped: !c.tapped } : c));
  }, []);

  const remove = useCallback((id) => {
    setCreatures(prev => prev.filter(c => c.id !== id));
  }, []);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      minHeight: 0,
      minWidth: 0,
      position: 'relative',
      background: 'radial-gradient(ellipse at center, rgba(40,180,180,0.06) 0%, transparent 70%)',
    }}>
      <Battlefield
        creatures={creatures}
        onTap={tap}
        onRemove={remove}
        flipped={flipped}
        empty={true}
        fitCap={fitCap}
      />
      <FloatingControls
        onSummon={summon}
        loading={loading}
        error={error}
        lastCmc={lastCmc}
        flipped={flipped}
        onBack={onBack}
      />
    </div>
  );
}

function InstallButton() {
  const [canInstall, setCanInstall] = useState(!!deferredInstallPrompt);
  const [installed, setInstalled] = useState(
    window.matchMedia('(display-mode: standalone)').matches
  );

  useEffect(() => {
    const onReady = () => setCanInstall(true);
    window.addEventListener('pwainstallready', onReady);
    const mq = window.matchMedia('(display-mode: standalone)');
    const onChange = (e) => setInstalled(e.matches);
    mq.addEventListener('change', onChange);
    return () => {
      window.removeEventListener('pwainstallready', onReady);
      mq.removeEventListener('change', onChange);
    };
  }, []);

  if (installed || !canInstall) return null;

  const handleInstall = async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    const result = await deferredInstallPrompt.userChoice;
    if (result.outcome === 'accepted') setInstalled(true);
    deferredInstallPrompt = null;
    setCanInstall(false);
  };

  return (
    <button
      onClick={handleInstall}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 20px',
        borderRadius: 999,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid var(--line)',
        color: 'var(--text-dim)',
        fontSize: 13, fontWeight: 500,
        cursor: 'pointer',
        transition: 'border-color 200ms ease, color 200ms ease',
      }}
      onPointerEnter={e => {
        e.currentTarget.style.borderColor = 'var(--accent)';
        e.currentTarget.style.color = 'var(--text)';
      }}
      onPointerLeave={e => {
        e.currentTarget.style.borderColor = 'var(--line)';
        e.currentTarget.style.color = 'var(--text-dim)';
      }}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 2v8M5 7l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 12h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      Install App
    </button>
  );
}

function StartScreen({ onPick }) {
  const Mode = ({ label, onClick, accent }) => (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        minHeight: 140,
        minWidth: 200,
        background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',
        border: '1px solid var(--line)',
        borderRadius: 20,
        padding: '24px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Fraunces',
        fontSize: 32,
        fontWeight: 500,
        color: 'var(--text)',
        letterSpacing: '-0.01em',
        transition: 'transform 200ms ease, border-color 200ms ease, background 200ms ease, color 200ms ease',
        cursor: 'pointer',
      }}
      onPointerEnter={e => {
        e.currentTarget.style.borderColor = accent;
        e.currentTarget.style.color = accent;
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onPointerLeave={e => {
        e.currentTarget.style.borderColor = 'var(--line)';
        e.currentTarget.style.color = 'var(--text)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 24, gap: 28,
    }}>
      <div style={{ color: 'var(--accent)' }}>
        <Logo size={36} />
      </div>
      <div style={{
        display: 'flex', gap: 14, width: '100%', maxWidth: 560, flexWrap: 'wrap',
      }}>
        <Mode label="Solo" onClick={() => onPick('solo')} accent="oklch(0.78 0.13 180)" />
        <Mode label="Two Players" onClick={() => onPick('split')} accent="oklch(0.78 0.13 145)" />
      </div>
      <InstallButton />
    </div>
  );
}

function App() {
  const [mode, setMode] = useState(null);

  if (!mode) return <StartScreen onPick={setMode} />;

  if (mode === 'solo') {
    return (
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        <PlayerPanel
          flipped={false}
          onBack={() => setMode(null)}
          fitCap={4}
        />
      </div>
    );
  }

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
    }}>
      <div style={{
        flex: 1, minHeight: 0, minWidth: 0,
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        position: 'relative',
      }}>
        <PlayerPanel
          flipped={true}
          onBack={() => setMode(null)}
          fitCap={6}
        />
      </div>

      <div style={{
        position: 'absolute',
        left: '30%', right: '30%', top: '50%', height: 1,
        transform: 'translateY(-0.5px)',
        background: 'linear-gradient(to right, transparent, var(--accent), transparent)',
        opacity: 0.5,
        pointerEvents: 'none',
        zIndex: 50,
      }} />

      <div style={{ flex: 1, minHeight: 0, minWidth: 0, position: 'relative' }}>
        <PlayerPanel
          flipped={false}
          onBack={() => setMode(null)}
          fitCap={6}
        />
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
