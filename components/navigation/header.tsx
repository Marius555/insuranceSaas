"use client";

import { useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Menu01Icon, MultiplicationSignIcon, Shield01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { GoogleSignInModal } from "@/components/auth/google-signin-modal";
import { cn } from "@/lib/utils";
import type { UserDocument } from "@/lib/types/appwrite";

interface HeaderProps {
  session?: { name: string; email: string } | null;
  userDoc?: UserDocument | null;
}

export function Header({ session, userDoc }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setMobileMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 md:h-20 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <HugeiconsIcon icon={Shield01Icon} className="size-8 text-primary" strokeWidth={2} />
          <span className="text-lg font-bold">VehicleClaim AI</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <button
            onClick={() => scrollToSection("features")}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Features
          </button>
          <button
            onClick={() => scrollToSection("how-it-works")}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            How It Works
          </button>
        </nav>

        {/* Desktop Auth CTAs */}
        <div className="hidden md:flex items-center gap-3">
          {session && userDoc ? (
            <>
              {userDoc.role === 'insurance_adjuster' ? (
                <Link href="/insurance/claims">
                  <Button variant="ghost">Review Claims</Button>
                </Link>
              ) : (
                <>
                  <Link href="/dashboard">
                    <Button variant="ghost">My Claims</Button>
                  </Link>
                  <Link href="/claim-analysis">
                    <Button variant="ghost">New Claim</Button>
                  </Link>
                </>
              )}
              <form action="/api/logout" method="POST">
                <Button variant="outline" type="submit">
                  Logout
                </Button>
              </form>
            </>
          ) : session ? (
            <>
              <Link href="/claim-analysis">
                <Button variant="ghost">Claim Analysis</Button>
              </Link>
              <form action="/api/logout" method="POST">
                <Button variant="outline" type="submit">
                  Logout
                </Button>
              </form>
            </>
          ) : (
            <Button onClick={() => setShowSignInModal(true)}>
              Sign In
            </Button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 -mr-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <HugeiconsIcon icon={MultiplicationSignIcon} className="size-6" strokeWidth={2} />
          ) : (
            <HugeiconsIcon icon={Menu01Icon} className="size-6" strokeWidth={2} />
          )}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-4">
            <button
              onClick={() => scrollToSection("features")}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors text-left py-2"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection("how-it-works")}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors text-left py-2"
            >
              How It Works
            </button>
            <div className="border-t border-border pt-4 flex flex-col gap-2">
              {session && userDoc ? (
                <>
                  {userDoc.role === 'insurance_adjuster' ? (
                    <Link href="/insurance/claims">
                      <Button variant="ghost" className="w-full">
                        Review Claims
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <Link href="/dashboard">
                        <Button variant="ghost" className="w-full">
                          My Claims
                        </Button>
                      </Link>
                      <Link href="/claim-analysis">
                        <Button variant="ghost" className="w-full">
                          New Claim
                        </Button>
                      </Link>
                    </>
                  )}
                  <form action="/api/logout" method="POST">
                    <Button variant="outline" type="submit" className="w-full">
                      Logout
                    </Button>
                  </form>
                </>
              ) : session ? (
                <>
                  <Link href="/claim-analysis">
                    <Button variant="ghost" className="w-full">
                      Claim Analysis
                    </Button>
                  </Link>
                  <form action="/api/logout" method="POST">
                    <Button variant="outline" type="submit" className="w-full">
                      Logout
                    </Button>
                  </form>
                </>
              ) : (
                <Button
                  onClick={() => {
                    setShowSignInModal(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full"
                >
                  Sign In
                </Button>
              )}
            </div>
          </nav>
        </div>
      )}

      {/* Google Sign-In Modal */}
      <GoogleSignInModal
        isOpen={showSignInModal}
        onClose={() => setShowSignInModal(false)}
      />
    </header>
  );
}
