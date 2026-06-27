"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Flag, Crown, ChevronRight, Plus, Users, Menu, X, MapPin, Warehouse, User } from "lucide-react";
import type { Tournament, Profile } from "@/types/database";

export default function Sidebar({
  tournaments,
  profile,
  loggedIn,
}: {
  tournaments: Tournament[];
  profile: Profile | null;
  loggedIn: boolean;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const role = profile?.role ?? null;

  const ongoing = tournaments.filter((t) => t.status === "ONGOING");
  const past = tournaments.filter((t) => t.status === "FINISHED");
  const upcoming = tournaments.filter((t) => t.status === "UPCOMING");

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-30 w-10 h-10 flex items-center justify-center bg-asphalt-panel border border-asphalt-border rounded-sm text-ink"
        aria-label="Abrir menu"
      >
        <Menu size={20} />
      </button>

      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/60 z-30"
        />
      )}

      <aside
        className={`w-[280px] shrink-0 bg-asphalt-panel border-r border-asphalt-border flex flex-col fixed lg:sticky top-0 z-40 transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
        style={{ height: "100dvh" }}
      >
        <div className="px-6 py-7 border-b border-asphalt-border flex items-center justify-between shrink-0">
          <Link href="/" onClick={() => setMobileOpen(false)}>
            <div className="font-display text-2xl leading-none tracking-wider text-ink">
              MIDNITE<span className="text-ember">BR</span>
            </div>
            <div className="font-mono text-[10px] tracking-[0.3em] text-ink-faint mt-1">
              SSR — STREET SERIES
            </div>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-ink-faint"
            aria-label="Fechar menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="px-3 py-4 space-y-1 border-b border-asphalt-border shrink-0">
          <SidebarLink
            href="/competicoes"
            icon={Flag}
            label="Competições"
            active={pathname === "/competicoes"}
            onClick={() => setMobileOpen(false)}
          />
          <SidebarLink
            href="/hall-dos-campeoes"
            icon={Crown}
            label="Hall dos Campeões"
            active={pathname === "/hall-dos-campeoes"}
            onClick={() => setMobileOpen(false)}
          />
          <SidebarLink
            href="/garagem"
            icon={Warehouse}
            label="Garagem"
            active={pathname === "/garagem" || pathname.startsWith("/garagem/")}
            onClick={() => setMobileOpen(false)}
          />
          {role === "ADMIN" && (
            <SidebarLink
              href="/admin/pilotos"
              icon={Users}
              label="Pilotos"
              active={pathname === "/admin/pilotos" || pathname === "/admin/pilotos/novo"}
              onClick={() => setMobileOpen(false)}
            />
          )}
          {role === "ADMIN" && (
            <SidebarLink
              href="/admin/pistas"
              icon={MapPin}
              label="Pistas"
              active={pathname === "/admin/pistas"}
              onClick={() => setMobileOpen(false)}
            />
          )}
        </nav>

        <div className="flex-1 overflow-y-auto px-3 py-4 min-h-0">
          {ongoing.length > 0 && (
            <>
              <SidebarGroupLabel label="Em andamento" />
              {ongoing.map((t) => (
                <TournamentLink key={t.id} tournament={t} active={pathname === `/torneios/${t.slug}`} onClick={() => setMobileOpen(false)} />
              ))}
            </>
          )}

          {upcoming.length > 0 && (
            <>
              <SidebarGroupLabel label="Em breve" className="mt-6" />
              {upcoming.map((t) => (
                <TournamentLink key={t.id} tournament={t} active={pathname === `/torneios/${t.slug}`} onClick={() => setMobileOpen(false)} />
              ))}
            </>
          )}

          {past.length > 0 && (
            <>
              <SidebarGroupLabel label="Edições anteriores" className="mt-6" />
              {past.map((t) => (
                <TournamentLink key={t.id} tournament={t} active={pathname === `/torneios/${t.slug}`} onClick={() => setMobileOpen(false)} />
              ))}
            </>
          )}

          {tournaments.length === 0 && (
            <p className="px-3 text-sm text-ink-faint">Nenhuma competição ainda.</p>
          )}

          {role === "ADMIN" && (
            <Link
              href="/admin/torneios/novo"
              onClick={() => setMobileOpen(false)}
              className="w-full mt-4 flex items-center gap-2 px-3 py-2.5 text-sm text-ink-muted border border-dashed border-asphalt-borderLight hover:border-ember hover:text-ember transition-colors rounded-sm"
            >
              <Plus size={14} />
              Nova competição
            </Link>
          )}
        </div>

        <div className="px-4 py-4 border-t border-asphalt-border shrink-0">
          {loggedIn ? (
            <Link
              href="/perfil"
              onClick={() => setMobileOpen(false)}
              className="w-full flex items-center justify-between px-3 py-2.5 bg-asphalt-card border border-asphalt-border rounded-sm hover:border-ember transition-colors group"
            >
              <span className="flex items-center gap-2.5 overflow-hidden">
                <span className="w-7 h-7 rounded-sm bg-asphalt-panel border border-asphalt-border flex items-center justify-center shrink-0 overflow-hidden">
                  {profile?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User size={14} className="text-ink-dim" />
                  )}
                </span>
                <span className="text-xs font-mono text-ink-muted truncate">
                  {profile?.name || "Piloto"}
                </span>
              </span>
              <ChevronRight size={13} className="text-ink-faint shrink-0 group-hover:text-ember transition-colors" />
            </Link>
          ) : (
            <Link
              href="/login"
              className="w-full flex items-center justify-between px-3 py-2.5 bg-asphalt-card border border-asphalt-border rounded-sm hover:border-ember transition-colors"
            >
              <span className="text-xs font-mono text-ink-muted">ENTRAR</span>
              <ChevronRight size={13} className="text-ink-faint" />
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}

function SidebarGroupLabel({ label, className = "" }: { label: string; className?: string }) {
  return (
    <div className={`px-3 mb-2 font-mono text-[10px] tracking-[0.2em] text-ink-dim ${className}`}>
      {label.toUpperCase()}
    </div>
  );
}

function SidebarLink({
  href,
  icon: Icon,
  label,
  active,
  onClick,
}: {
  href: string;
  icon: any;
  label: string;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm transition-colors ${
        active
          ? "bg-asphalt-card text-ink border-l-2 border-ember"
          : "text-ink-muted hover:text-ink hover:bg-asphalt-card/50 border-l-2 border-transparent"
      }`}
    >
      <Icon size={16} strokeWidth={2} />
      {label}
    </Link>
  );
}

function TournamentLink({
  tournament,
  active,
  onClick,
}: {
  tournament: Tournament;
  active: boolean;
  onClick?: () => void;
}) {
  const isLive = tournament.status === "ONGOING";
  return (
    <Link
      href={`/torneios/${tournament.slug}`}
      onClick={onClick}
      className={`block w-full text-left px-3 py-2.5 rounded-sm mb-0.5 transition-colors group ${
        active ? "bg-asphalt-card" : "hover:bg-asphalt-card/50"
      }`}
    >
      <div className="flex items-center justify-between">
        <span
          className={`text-sm leading-tight ${
            active ? "text-ink" : "text-ink-muted group-hover:text-ink"
          }`}
        >
          {tournament.name}
        </span>
        {isLive && <span className="w-1.5 h-1.5 rounded-full bg-checkpoint shrink-0 ml-2" />}
      </div>
      <div className="flex items-center gap-1.5
