import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import BitcoinLogo from "../svg/BitcoinLogo";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();

  return (
    <nav className="bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <div className="flex items-center gap-2">
                <BitcoinLogo className="h-8 w-auto text-primary" />
                <span className="text-xl font-bold">BlockBet</span>
              </div>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <NavLink href="/" current={location === "/"}>
                Home
              </NavLink>
              <NavLink href="/place-bets" current={location === "/place-bets"}>
                Place Bets
              </NavLink>
              <NavLink href="/stats" current={location === "/stats"}>
                Stats
              </NavLink>
              <NavLink href="/bitcoin-mining" current={location === "/bitcoin-mining"}>
                Bitcoin Mining
              </NavLink>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <Button variant="default">Connect Wallet</Button>
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <Button
              variant="ghost"
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-muted-foreground hover:text-foreground focus:outline-none"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            <MobileNavLink href="/" current={location === "/"}>
              Home
            </MobileNavLink>
            <MobileNavLink href="/place-bets" current={location === "/place-bets"}>
              Place Bets
            </MobileNavLink>
            <MobileNavLink href="/stats" current={location === "/stats"}>
              Stats
            </MobileNavLink>
            <MobileNavLink href="/bitcoin-mining" current={location === "/bitcoin-mining"}>
              Bitcoin Mining
            </MobileNavLink>
          </div>
          <div className="pt-4 pb-3 border-t border-border">
            <div className="flex items-center px-4">
              <Button className="w-full" onClick={() => setIsOpen(false)}>
                Connect Wallet
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

interface NavLinkProps {
  href: string;
  current: boolean;
  children: React.ReactNode;
}

function NavLink({ href, current, children }: NavLinkProps) {
  return (
    <Link href={href}>
      <a
        className={`${
          current
            ? "border-primary text-foreground"
            : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
        } px-1 pt-1 border-b-2 text-sm font-medium`}
      >
        {children}
      </a>
    </Link>
  );
}

function MobileNavLink({ href, current, children }: NavLinkProps) {
  return (
    <Link href={href}>
      <a
        className={`${
          current
            ? "bg-secondary text-foreground border-l-4 border-primary"
            : "border-transparent text-muted-foreground hover:bg-secondary hover:border-border hover:text-foreground"
        } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
      >
        {children}
      </a>
    </Link>
  );
}
