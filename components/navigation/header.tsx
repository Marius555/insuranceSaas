"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { HugeiconsIcon } from "@hugeicons/react";
import { Menu01Icon, MultiplicationSignIcon, Shield01Icon, Sun03Icon, Moon02Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { GoogleSignInModal } from "@/components/auth/google-signin-modal";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import type { UserDocument } from "@/lib/types/appwrite";

interface HeaderProps {
  session?: { name: string; email: string } | null;
  userDoc?: UserDocument | null;
}

export function Header({ session, userDoc }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setMobileMenuOpen(false);
    }
  };

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
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Products</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="w-[200px] p-2">
                  {/* Menu items to be added later */}
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Solutions</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="w-[200px] p-2">
                  {/* Menu items to be added later */}
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

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
              className="text-sm font-medium text-muted-foreground text-left py-2"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection("how-it-works")}
              className="text-sm font-medium text-muted-foreground text-left py-2"
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
      )}

      {/* Google Sign-In Modal */}
      <GoogleSignInModal
        isOpen={showSignInModal}
        onClose={() => setShowSignInModal(false)}
      />
    </header>
  );
}
