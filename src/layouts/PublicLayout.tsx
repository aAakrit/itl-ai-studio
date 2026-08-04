/* eslint-disable prettier/prettier */
import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Menu, ArrowRight, Github, Linkedin, Twitter, Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import { Logo } from "@/components/common/Logo";
import { Button } from "@/components/ui/button";
import { publicNav, footerNav } from "@/config/nav";
import { siteConfig } from "@/config/site";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useThemeStore } from "@/store/themeStore";
import { cn } from "@/lib/utils";
import {
  useCurrentUser,
  useIsAuthenticated,
} from "@/hooks/useAuth";
import { UserMenu } from "@/components/common/UserMenu";


function ThemeToggle() {
  const mode = useThemeStore((s) => s.theme.mode);
  const setMode = useThemeStore((s) => s.setMode);
  const isDark = mode === "dark";
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setMode(isDark ? "light" : "dark")}
      aria-label="Toggle theme"
      className="h-9 w-9"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

function TopNav() {
  const [scrolled, setScrolled] = useState(false);
  const { location } = useRouterState();
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const user = useCurrentUser();
  const isAuthenticated = useIsAuthenticated();

  return (
    <header className="sticky top-0 z-40 w-full px-3 pt-3 sm:px-4">
      <motion.div
        initial={{ y: -8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35 }}
        className={cn(
          "mx-auto flex max-w-7xl items-center justify-between rounded-2xl px-4 py-2.5 transition-all sm:px-5"
        )}
      >
        <Link to="/" className="flex items-center">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-0.5 md:flex">
          {publicNav.map((item, i) => {
            const isHashLink = item.to.includes("#");
            if (isHashLink) {
              return (
                <a
                  key={`${item.to}-${i}`}
                  href={item.to}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  {item.label}
                </a>
              );
            }
            const active = location.pathname === item.to;
            return (
              <Link
                key={`${item.to}-${i}`}
                to={item.to}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors hover:bg-secondary hover:text-foreground",
                  active ? "bg-secondary text-foreground" : "text-muted-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-1.5">
          <ThemeToggle />

          {isAuthenticated ? (
            <>
              <Button
                asChild
                size="sm"
                className="gap-1 gradient-primary text-primary-foreground shadow-soft"
              >
                <Link to="/workspace">
                  Open Workspace
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>

              <UserMenu />
            </>
          ) : (
            <>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="hidden sm:inline-flex"
              >
                <Link to="/login">Sign In</Link>
              </Button>

              <Button
                asChild
                size="sm"
                className="hidden sm:inline-flex gap-1 gradient-primary text-primary-foreground shadow-soft"
              >
                <Link to="/register">
                  Register
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>

            <SheetContent side="right" className="w-72">
              <div className="mt-8 flex flex-col gap-1">
                {publicNav.map((item, i) =>
                  item.to.includes("#") ? (
                    <a
                      key={`${item.to}-${i}`}
                      href={item.to}
                      className="rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary"
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Link
                      key={`${item.to}-${i}`}
                      to={item.to}
                      className="rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary"
                    >
                      {item.label}
                    </Link>
                  )
                )}

                {isAuthenticated ? (
                  <>
                    <Link
                      to="/workspace"
                      className="mt-4 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary"
                    >
                      Open Workspace
                    </Link>

                    <Link
                      to="/profile"
                      className="rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary"
                    >
                      Profile
                    </Link>

                    {user?.is_admin && (
                      <Link
                        to="/admin"
                        className="rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary"
                      >
                        Admin Dashboard
                      </Link>
                    )}

                    <button
                      type="button"
                      className="rounded-lg px-3 py-2 text-left text-sm font-medium text-foreground hover:bg-secondary"
                      onClick={() => {
                        // logout
                      }}
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="mt-4 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary"
                    >
                      Sign In
                    </Link>

                    <Link
                      to="/register"
                      className="rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary"
                    >
                      Register
                    </Link>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </motion.div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-24 border-t border-border/60 bg-surface-2/40">
      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div>
            <Logo />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {siteConfig.description}
            </p>
          </div>
          {Object.entries(footerNav).map(([section, items]) => (
            <div key={section}>
              <h4 className="mb-4 text-sm font-semibold text-foreground">{section}</h4>
              <ul className="space-y-2.5">
                {items.map((item, i) =>
                  item.to.includes("#") ? (
                    <li key={`${item.to}-${i}`}>
                      <a href={item.to} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                        {item.label}
                      </a>
                    </li>
                  ) : (
                    <li key={`${item.to}-${i}`}>
                      <Link to={item.to} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                        {item.label}
                      </Link>
                    </li>
                  ),
                )}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-3 px-6 py-6 text-xs text-muted-foreground md:flex-row md:items-center">
          <p>© {new Date().getFullYear()} ITL AI Technologies Pvt. Ltd. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-dot" />
              All systems operational
            </span>
            <span className="font-mono">v2026.7.1</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <motion.main
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        {children}
      </motion.main>
      <Footer />
    </div>
  );
}
