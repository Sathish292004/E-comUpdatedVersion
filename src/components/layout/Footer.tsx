import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-24 border-t bg-gradient-to-b from-background to-secondary/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary text-white font-black shadow-soft">S</div>
            <span className="text-lg font-black tracking-tight">SK<span className="text-orange">.</span></span>
          </div>
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">A modern premium marketplace for the things you actually want. Curated, considered, delivered fast.</p>
          <div className="mt-5 flex gap-2">
            {[Instagram, Twitter, Facebook, Youtube].map((Icon, i) => (
              <a key={i} href="#" className="grid h-9 w-9 place-items-center rounded-full border bg-background hover:bg-secondary"><Icon className="h-4 w-4" /></a>
            ))}
          </div>
        </div>
        <Col title="Shop" links={[["All products","/shop"],["New arrivals","/shop"],["Sale","/shop"],["Best sellers","/shop"]]} />
        <Col title="Help" links={[["Shipping","/"],["Returns","/"],["Contact","/"],["FAQ","/"]]} />
        <Col title="Account" links={[["Sign in","/auth/login"],["Register","/auth/register"],["My orders","/account/orders"],["Wishlist","/wishlist"]]} />
      </div>
      <div className="border-t">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} SK Commerce. All rights reserved.</p>
          <p>Crafted with care · Built for showcase</p>
        </div>
      </div>
    </footer>
  );
}
function Col({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h4 className="text-sm font-semibold">{title}</h4>
      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
        {links.map(([label, to]) => <li key={label}><Link to={to as any} className="hover:text-foreground">{label}</Link></li>)}
      </ul>
    </div>
  );
}
