'use client';

import { useState, useEffect } from 'react';
import { Shield, Menu, X, LogOut } from 'lucide-react';
import { useAuth0 } from '@auth0/auth0-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function Navbar() {
  const { isAuthenticated, logout } = useAuth0();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-background/95 backdrop-blur-sm shadow-lg border-b border-border'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-primary" />
            <span className="font-[family-name:var(--font-cinzel)] text-xl font-bold text-foreground">
              DnDnB
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/characters"
              className="text-muted-foreground hover:text-foreground transition-colors font-[family-name:var(--font-cinzel)]"
            >
              Characters
            </Link>
            <Link
              href="/campaigns"
              className="text-muted-foreground hover:text-foreground transition-colors font-[family-name:var(--font-cinzel)]"
            >
              Campaigns
            </Link>
            <Button asChild className="font-[family-name:var(--font-cinzel)]">
              <Link href="/characters/new">Create Character</Link>
            </Button>
            {isAuthenticated && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Log out"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-md hover:bg-accent"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-card border-t border-border">
          <div className="px-4 py-4 space-y-3">
            <Link
              href="/characters"
              className="block text-muted-foreground hover:text-foreground transition-colors font-[family-name:var(--font-cinzel)] py-2"
              onClick={() => setIsOpen(false)}
            >
              Characters
            </Link>
            <Link
              href="/campaigns"
              className="block text-muted-foreground hover:text-foreground transition-colors font-[family-name:var(--font-cinzel)] py-2"
              onClick={() => setIsOpen(false)}
            >
              Campaigns
            </Link>
            <Button
              asChild
              className="w-full font-[family-name:var(--font-cinzel)]"
              onClick={() => setIsOpen(false)}
            >
              <Link href="/characters/new">Create Character</Link>
            </Button>
            {isAuthenticated && (
              <Button
                variant="ghost"
                className="w-full font-[family-name:var(--font-cinzel)] text-muted-foreground"
                onClick={() => {
                  setIsOpen(false);
                  logout({ logoutParams: { returnTo: window.location.origin } });
                }}
              >
                Log out
              </Button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
