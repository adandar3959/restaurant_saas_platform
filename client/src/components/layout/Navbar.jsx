import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { UtensilsCrossed, Menu, X, ChevronRight, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const navLinks = [
  { label: 'Features', href: '/#features' },
  { label: 'Pricing',  href: '/pricing' },
  { label: 'How It Works', href: '/#how-it-works' },
];

export default function Navbar() {
  const [scrolled,  setScrolled]  = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);
  const { user, logout, getDashboardRoute } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close menu on resize
  useEffect(() => {
    const onResize = () => { if (window.innerWidth > 768) setMenuOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleDashboard = () => {
    navigate(getDashboardRoute(user.role, user.restaurantId));
  };

  return (
    <>
      <header className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="container">
          <nav className="nav-inner">
            {/* Logo */}
            <Link to="/" className="nav-logo">
              <div className="nav-logo-icon">
                <UtensilsCrossed size={20} />
              </div>
              <span>DineFlow</span>
            </Link>

            {/* Desktop links */}
            <ul className="nav-links hide-mobile">
              {navLinks.map(l => (
                <li key={l.label}>
                  <a href={l.href} className="nav-link">{l.label}</a>
                </li>
              ))}
            </ul>

            {/* Right actions */}
            <div className="nav-actions">
              {user ? (
                <>
                  <button className="btn btn-outline btn-sm hide-mobile" onClick={handleDashboard}>
                    Dashboard
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={logout}>
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn btn-ghost btn-sm hide-mobile">
                    <LogIn size={16} />
                    Sign In
                  </Link>
                  <Link to="/onboarding" className="btn btn-primary btn-sm">
                    Start Free
                    <ChevronRight size={16} />
                  </Link>
                </>
              )}

              {/* Mobile hamburger */}
              <button
                className="nav-hamburger"
                onClick={() => setMenuOpen(v => !v)}
                aria-label="Toggle menu"
              >
                {menuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Mobile drawer */}
      <div className={`mobile-drawer ${menuOpen ? 'open' : ''}`}>
        <ul className="mobile-nav-links">
          {navLinks.map(l => (
            <li key={l.label}>
              <a href={l.href} className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="mobile-nav-actions">
          {user ? (
            <>
              <button className="btn btn-outline w-full" onClick={() => { handleDashboard(); setMenuOpen(false); }}>
                Dashboard
              </button>
              <button className="btn btn-ghost w-full" onClick={() => { logout(); setMenuOpen(false); }}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline w-full" onClick={() => setMenuOpen(false)}>
                Sign In
              </Link>
              <Link to="/onboarding" className="btn btn-primary w-full" onClick={() => setMenuOpen(false)}>
                Start Free Trial
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Overlay */}
      {menuOpen && <div className="drawer-overlay" onClick={() => setMenuOpen(false)} />}
    </>
  );
}
