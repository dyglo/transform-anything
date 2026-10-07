import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Layers3,
  LockKeyhole,
  Sparkles,
  Scan,
  GitBranch,
  Image,
  FileText,
  BarChart3,
  Monitor,
  Files,
  Type,
  Globe,
  Columns2,
} from 'lucide-react';
import { Brand } from '../ui/Brand';
import { InputDrop } from '../ui/InputDrop';
import { useWorkspace } from '../state/workspace';
const families = [
  {
    name: 'Image Prep',
    desc: 'Crop, resize, convert, optimize, remove backgrounds.',
    icon: Image,
    live: true,
  },
  {
    name: 'Screenshot Studio',
    desc: 'Text, arrows, outlines and highlights. Blur and frames planned.',
    icon: Scan,
    live: true,
    partial: true,
  },
  { name: 'Compare', desc: 'Find the difference. See the details.', icon: Columns2 },
  { name: 'ShareCard', desc: 'Turn a thought into something shareable.', icon: Sparkles },
  { name: 'Document Clean', desc: 'Make your documents work for you.', icon: FileText },
  { name: 'Data → Visual', desc: 'Give your numbers a little perspective.', icon: BarChart3 },
  { name: 'Mockup', desc: 'Put your work in the right frame.', icon: Monitor },
  { name: 'File Transformer', desc: 'The format you have. The format you need.', icon: Files },
  { name: 'Text → Visual', desc: 'Words worth a second look.', icon: Type },
  { name: 'Web Capture', desc: 'Bring a piece of the web with you.', icon: Globe },
];
export default function Landing() {
  const navigate = useNavigate();
  const [menu, setMenu] = useState(false);
  const store = useWorkspace();
  async function importFiles(files: File[]) {
    await store.importFiles(files);
    if (useWorkspace.getState().session.activeId) navigate('/workspace');
  }
  useEffect(() => {
    const listener = (e: ClipboardEvent) => {
      if (e.target instanceof Element && e.target.closest('input,textarea,[contenteditable]'))
        return;
      const files = Array.from(e.clipboardData?.files ?? []);
      if (files.length) {
        e.preventDefault();
        void useWorkspace
          .getState()
          .importFiles(files)
          .then(() => {
            if (useWorkspace.getState().session.activeId) navigate('/workspace');
          });
      } else if (e.clipboardData?.getData('text'))
        useWorkspace
          .getState()
          .report(
            'Text and URL transformations are planned. Paste or browse a PNG, JPEG, or WebP image to get started.',
          );
    };
    window.addEventListener('paste', listener);
    return () => window.removeEventListener('paste', listener);
  }, [navigate]);
  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <header className="site-header">
          <Brand />
          <nav aria-label="Main navigation" className={menu ? 'nav-open' : ''}>
            <a href="#features" onClick={() => setMenu(false)}>
              Features
            </a>
            <a href="#how-it-works" onClick={() => setMenu(false)}>
              How it works
            </a>
            <a href="#tools" onClick={() => setMenu(false)}>
              Tools
            </a>
            <a href="#about" onClick={() => setMenu(false)}>
              About
            </a>
          </nav>
          <div className="header-actions">
            <Link className="button header-cta" to="/workspace">
              Start transforming
            </Link>
            <button
              className="menu-button"
              aria-label="Toggle navigation"
              aria-expanded={menu}
              onClick={() => setMenu(!menu)}
            >
              <span />
              <span />
            </button>
          </div>
        </header>
        <div className="hero-copy">
          <div className="hero-badge">
            <span className="badge-symbol">
              <Layers3 size={12} />
            </span>
            Local-first. No account required.
          </div>
          <h1 id="hero-title">
            Make anything into
            <br />
            <span>what you need.</span>
          </h1>
          <p>
            Images, files, text, and data—transform, chain,
            <br className="desktop-break" /> and export in one workspace.
          </p>
          <Link className="button hero-cta" to="/workspace">
            Start transforming <ArrowUpRight size={15} />
          </Link>
        </div>
      </section>
      <main>
        <section id="start" className="section input-section">
          <InputDrop
            onFiles={(files) => void importFiles(files)}
            onError={store.report}
            busy={!store.ready || store.busy}
          />
          {store.error ? (
            <p className="feedback error" role="alert">
              {store.error}
            </p>
          ) : null}
        </section>
        <section id="features" className="section features-section">
          <div className="section-heading">
            <span className="eyebrow">LESS FRICTION. MORE POSSIBILITY.</span>
            <h2>
              One workspace.
              <br />
              As many next steps as you need.
            </h2>
            <p>
              Start with an image. Transform it, try another direction,
              <br className="desktop-break" /> and leave with exactly what you need.
            </p>
          </div>
          <div className="feature-grid">
            <article>
              <div className="feature-icon">
                <LockKeyhole size={22} />
              </div>
              <h3>On your device. By default.</h3>
              <p>
                Crop, resize, and convert locally. Your images never need to leave your browser.
              </p>
            </article>
            <article>
              <div className="feature-icon">
                <GitBranch size={22} />
              </div>
              <h3>Every step is a new possibility.</h3>
              <p>
                Keep your original. Revisit any version. Branch off and try something different.
              </p>
            </article>
            <article>
              <div className="feature-icon">
                <ArrowUpRight size={22} />
              </div>
              <h3>Get in. Get it done.</h3>
              <p>
                No account, no setup. Paste an image, make it yours, and copy or download the
                result.
              </p>
            </article>
          </div>
        </section>
        <section id="how-it-works" className="section how-section">
          <div>
            <span className="eyebrow">A SIMPLE LITTLE LOOP</span>
            <h2>
              Keep going.
              <br />
              Or call it done.
            </h2>
            <p>
              Every output is your next input.
              <br />
              No downloading and uploading again.
            </p>
            <Link className="text-link" to="/workspace">
              Try it for yourself <ArrowRight size={16} />
            </Link>
          </div>
          <div className="chain-demo" role="img" aria-label="Example image transformation chain">
            <div className="chain-file">
              <Image size={20} />
              <span>
                Your image<small>Original, always preserved</small>
              </span>
              <Check size={15} />
            </div>
            <div className="chain-line" />
            <div className="chain-step">
              Crop <ArrowRight size={14} /> Resize <ArrowRight size={14} /> WebP
            </div>
            <div className="chain-line" />
            <div className="chain-file final">
              <Layers3 size={20} />
              <span>
                Just what you needed<small>Download it. Or transform it again.</small>
              </span>
              <Check size={15} />
            </div>
          </div>
        </section>
        <section id="tools" className="section tools-section">
          <div className="section-heading">
            <span className="eyebrow">A WORKSPACE WITH ROOM TO GROW</span>
            <h2>Different inputs. Same possibilities.</h2>
            <p>
              Image Prep and Screenshot Studio annotations are ready. More tools are on the roadmap.
            </p>
          </div>
          <div className="family-grid">
            {families.map((f) => (
              <article key={f.name} className={`family-card ${f.live ? 'live' : ''}`}>
                <div className="family-top">
                  <f.icon size={22} strokeWidth={1.5} />
                  <span className={`family-status ${f.live ? 'available' : ''}`}>
                    {f.live ? ('partial' in f ? 'Partially available' : 'Available') : 'Planned'}
                  </span>
                </div>
                <h3>{f.name}</h3>
                <p>{f.desc}</p>
                {f.live ? (
                  <Link to="/workspace" className="text-link">
                    Open workspace <ArrowUpRight size={15} />
                  </Link>
                ) : null}
              </article>
            ))}
          </div>
        </section>
        <section id="about" className="section about-section">
          <span className="eyebrow">ANYTHING IN. ANYTHING OUT.</span>
          <h2>
            A little less “how do I…?”
            <br />A little more done.
          </h2>
          <p>
            Transform is becoming a universal workspace for digital content.
            <br className="desktop-break" /> Built around what you bring, and what you want it to
            become.
          </p>
          <Link className="button" to="/workspace">
            Start transforming <ArrowUpRight size={16} />
          </Link>
        </section>
      </main>
      <footer className="site-footer">
        <Brand small />
        <span>Made for whatever comes next.</span>
        <a href="/workspace">
          Open workspace <ArrowUpRight size={13} />
        </a>
      </footer>
    </>
  );
}
