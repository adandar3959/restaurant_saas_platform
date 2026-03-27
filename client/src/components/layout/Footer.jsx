import { Link } from 'react-router-dom';
import { UtensilsCrossed, MessageSquare, Code2, Briefcase, Mail } from 'lucide-react';
import './Footer.css';

const footerLinks = {
  Product: [
    { label: 'Features',    href: '/#features' },
    { label: 'Pricing',     href: '/pricing' },
    { label: 'How It Works',href: '/#how-it-works' },
    { label: 'Changelog',   href: '#' },
  ],
  Company: [
    { label: 'About Us',    href: '#' },
    { label: 'Blog',        href: '#' },
    { label: 'Careers',     href: '#' },
    { label: 'Contact',     href: '#' },
  ],
  Support: [
    { label: 'Documentation', href: '#' },
    { label: 'API Reference',  href: '#' },
    { label: 'Status',         href: '#' },
    { label: 'Help Center',    href: '#' },
  ],
  Legal: [
    { label: 'Privacy Policy',  href: '#' },
    { label: 'Terms of Service',href: '#' },
    { label: 'Cookie Policy',   href: '#' },
    { label: 'GDPR',            href: '#' },
  ],
};

const socials = [
  { icon: <MessageSquare size={18} />, href: '#', label: 'Twitter / X' },
  { icon: <Code2 size={18} />,        href: '#', label: 'GitHub' },
  { icon: <Briefcase size={18} />,    href: '#', label: 'LinkedIn' },
  { icon: <Mail size={18} />,         href: '#', label: 'Email' },
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        {/* Top row */}
        <div className="footer-top">
          {/* Brand */}
          <div className="footer-brand">
            <Link to="/" className="nav-logo footer-logo">
              <div className="nav-logo-icon">
                <UtensilsCrossed size={18} />
              </div>
              <span>DineFlow</span>
            </Link>
            <p className="footer-tagline">
              The all-in-one restaurant management platform. From orders to kitchen to delivery — all in one place.
            </p>
            <div className="footer-socials">
              {socials.map(s => (
                <a key={s.label} href={s.href} className="social-link" aria-label={s.label}>
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Links grid */}
          <div className="footer-links-grid">
            {Object.entries(footerLinks).map(([group, links]) => (
              <div key={group} className="footer-col">
                <h4 className="footer-col-title">{group}</h4>
                <ul>
                  {links.map(l => (
                    <li key={l.label}>
                      <a href={l.href} className="footer-link">{l.label}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom row */}
        <div className="footer-bottom">
          <p className="text-subtle text-sm">
            © {new Date().getFullYear()} DineFlow. All rights reserved.
          </p>
          <p className="text-subtle text-sm">
            Built with ♥ for restaurants worldwide
          </p>
        </div>
      </div>
    </footer>
  );
}
