"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Flag, Crown, ChevronRight, Lock, Settings, Plus, LogOut, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Tournament, Role } from "@/types/database";

export default function Sidebar({
  tournaments,
  role,
  loggedIn,
}: {
  tournaments: Tournament[];
  role: Role | null;
  loggedIn: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const ongoing = tournaments.filter((t) => t.status === "ONGOING");
  const past = tournaments.filter((t) => t.status === "FINISHED");
  const upcoming = tournaments.filter((t) => t.status === "UPCOMING");

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="w-[280px] shrink-0 bg-asphalt-panel border-r border-asphalt-border flex flex-col relative z-10 h-screen sticky top-0">
      <div className="px-6 py-7 border-b border-asphalt-border">
        <Link href="/">
          <div className="font-display text-2xl leading-none tracking-wider text-ink">
            MIDNITE<span className="text-ember">BR</span>
          </div>
        </Link>
        <div className="font-mono text-[10px] tracking-[0.3em] text-ink-faint mt-1">
          SSR — STREET SERIES
        </div>
      </div>

      <nav className="px-3 py-4 space-y-1 border-b border-asphalt-border">
        <SidebarLink href="/" icon={Flag} label="Competições" active={pathname === "/"} />
        <SidebarLink
          href="/hall-dos-campeoes"
          icon={Crown}
          label="Hall dos Campeões"
          active={pathname === "/hall-dos-campeoes"}
        />
        {role === "ADMIN" && (
          <SidebarLink
            href="/admin/pilotos"
            icon={Users}
            label="Pilotos"
            active={pathname === "/admin/pilotos" || pathname === "/admin/pilotos/novo"}
          />
        )}
      </nav>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        {ongoing.length > 0 && (
          <>
            <SidebarGroupLabel label="Em andamento" />
            {ongoing.map((t) => (
              <TournamentLink key={t.id} tournament={t} active={pathname === `/torneios/${t.slug}`} />
            ))}
          </>
        )}

        {upcoming.length > 0 && (
          <>
            <SidebarGroupLabel label="Em breve" className="mt-6" />
            {upcoming.map((t) => (
              <TournamentLink key={t.id} tournament={t} active={pathname === `/torneios/${t.slug}`} />
            ))}
          </>
        )}

        {past.length > 0 && (
          <>
            <SidebarGroupLabel label="Edições anteriores" className="mt-6" />
            {past.map((t) => (
              <TournamentLink key={t.id} tournament={t} active={pathname === `/torneios/${t.slug}`} />
            ))}
          </>
        )}

        {tournaments.length === 0 && (
          <p className="px-3 text-sm text-ink-faint">Nenhuma competição ainda.</p>
        )}

        {role === "ADMIN" && (
          <Link
            href="/admin/torneios/novo"
            className="w-full mt-4 flex items-center gap-2 px-3 py-2.5 text-sm text-ink-muted border border-dashed border-asphalt-borderLight hover:border-ember hover:text-ember transition-colors rounded-sm"
          >
            <Plus size={14} />
            Nova competição
          </Link>
        )}
      </div>

      <div className="px-4 py-4 border-t border-asphalt-border">
        {loggedIn ? (
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between px-3 py-2.5 bg-asphalt-card border border-asphalt-border rounded-sm hover:border-asphalt-borderLight transition-colors group"
          >
            <span className="flex items-center gap-2 text-xs font-mono text-ink-muted">
              {role === "ADMIN" ? (
                <Settings size={13} className="text-ember" />
              ) : (
                <Lock size={13} />
              )}
              {role === "ADMIN" ? "MODO ADMIN" : "VISUALIZADOR"}
            </span>
            <LogOut size={13} className="text-ink-faint group-hover:text-ember transition-colors" />
          </button>
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
}: {
  href: string;
  icon: any;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
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

function TournamentLink({ tournament, active }: { tournament: Tournament; active: boolean }) {
  const isLive = tournament.status === "ONGOING";
  return (
    <Link
      href={`/torneios/${tournament.slug}`}
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
      <div className="flex items-center gap-1.5 mt-0.5 font-mono text-[10px] text-ink-dim">
        <span>{tournament.format === "KNOCKOUT" ? "MATA-MATA" : "LIGA"}</span>
        {tournament.season && (
          <>
            <span>·</span>
            <span>{tournament.season}</span>
          </>
        )}
      </div>
    </Link>
  );
        }
