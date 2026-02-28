"use client";

import { useState } from "react";
import Link from "next/link";
import { useMounted } from "@/hooks/use-mounted";
import { useTheme } from "next-themes";
import { HugeiconsIcon } from "@hugeicons/react";
import { Menu01Icon, MultiplicationSignIcon, Shield01Icon, Sun03Icon, Moon02Icon, ArrowRight03Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { GoogleSignInModal } from "@/components/auth/google-signin-modal";
import { cn } from "@/lib/utils";
import type { UserDocument } from "@/lib/types/appwrite";

interface HeaderProps {
  session?: { name: string; email: string } | null;
  userDoc?: UserDocument | null;
  insuranceEnabled?: boolean;
}

export function Header({ session, userDoc, insuranceEnabled }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const mounted = useMounted();
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-background">
      <div className="container mx-auto flex h-16 md:h-20 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <HugeiconsIcon icon={Shield01Icon} className="size-8 text-primary" strokeWidth={2} />
          <span className="text-lg font-bold">VehicleClaim AI</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/#features"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Features
          </Link>
          <Link
            href="/#how-it-works"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            How It Works
          </Link>
          <Link
            href="/pricing"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Pricing
          </Link>
          <Link
            href="/news"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            News
          </Link>
        </nav>

        {/* Desktop Auth CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {mounted ? (
              <HugeiconsIcon
                icon={theme === "dark" ? Sun03Icon : Moon02Icon}
                className="size-5"
                strokeWidth={2}
              />
            ) : (
              <div className="size-5" />
            )}
          </Button>
          {session && userDoc ? (
            <>
              {userDoc.role === 'insurance_adjuster' ? (
                <Link href="/insurance/claims">
                  <Button variant="ghost">Review Claims</Button>
                </Link>
              ) : (
                <Link href={`/auth/dashboard/${userDoc.$id}`}>
                  <Button variant="ghost">Dashboard</Button>
                </Link>
              )}
              <form action="/api/logout" method="POST">
                <Button variant="outline" type="submit">
                  Logout
                </Button>
              </form>
            </>
          ) : session ? (
            <form action="/api/logout" method="POST">
              <Button variant="outline" type="submit">
                Logout
              </Button>
            </form>
          ) : (
            <Button onClick={() => setShowSignInModal(true)}>
              SIGN UP
              <HugeiconsIcon icon={ArrowRight03Icon} strokeWidth={2.2} />
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

      {/* Mobile Menu Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/20 md:hidden transition-opacity duration-200",
          mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Mobile Menu Panel */}
      <div
        className={cn(
          "fixed inset-x-0 top-16 z-40 md:hidden bg-background border-b border-border shadow-lg transition-all duration-200",
          mobileMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
        )}
      >
        <nav className="container mx-auto px-4 py-4 flex flex-col gap-4">
          <Link
            href="/#features"
            className="text-sm font-medium text-muted-foreground text-left py-2"
            onClick={() => setMobileMenuOpen(false)}
          >
            Features
          </Link>
          <Link
            href="/#how-it-works"
            className="text-sm font-medium text-muted-foreground text-left py-2"
            onClick={() => setMobileMenuOpen(false)}
          >
            How It Works
          </Link>
          <Link
            href="/pricing"
            className="text-sm font-medium text-muted-foreground text-left py-2"
            onClick={() => setMobileMenuOpen(false)}
          >
            Pricing
          </Link>
          <Link
            href="/news"
            className="text-sm font-medium text-muted-foreground text-left py-2"
            onClick={() => setMobileMenuOpen(false)}
          >
            News
          </Link>
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
                  <Link href={`/auth/dashboard/${userDoc.$id}`}>
                    <Button variant="ghost" className="w-full">
                      Dashboard
                    </Button>
                  </Link>
                )}
                <form action="/api/logout" method="POST">
                  <Button variant="outline" type="submit" className="w-full">
                    Logout
                  </Button>
                </form>
              </>
            ) : session ? (
              <form action="/api/logout" method="POST">
                <Button variant="outline" type="submit" className="w-full">
                  Logout
                </Button>
              </form>
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

      {/* Google Sign-In Modal */}
      <GoogleSignInModal
        isOpen={showSignInModal}
        onClose={() => setShowSignInModal(false)}
        insuranceEnabled={insuranceEnabled}
      />
    </header>
  );
}
