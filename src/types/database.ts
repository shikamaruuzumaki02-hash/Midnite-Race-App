export type Role = "VIEWER" | "ADMIN";
export type TournamentFormat = "KNOCKOUT" | "LEAGUE";
export type TournamentStatus = "UPCOMING" | "ONGOING" | "FINISHED";
export type MatchStatus = "SCHEDULED" | "COMPLETED" | "WALKOVER" | "CANCELLED";

export interface Profile {
  id: string;
  name: string | null;
  role: Role;
  created_at: string;
}

export interface Driver {
  id: string;
  gamertag: string;
  real_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Tournament {
  id: string;
  name: string;
  slug: string;
  format: TournamentFormat;
  status: TournamentStatus;
  season: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  bracket_generated: boolean;
}

export interface Track {
  id: string;
  name: string;
  type: string | null;
  description: string | null;
}

export interface TournamentEntry {
  id: string;
  tournament_id: string;
  driver_id: string;
  points: number;
  wins: number;
  losses: number;
  draws: number;
  disqualified: boolean;
  seed: number | null;
  driver?: Driver;
}

export interface Match {
  id: string;
  tournament_id: string;
  round: string | null;
  driver_a_id: string;
  driver_b_id: string;
  winner_id: string | null;
  score_a: number | null;
  score_b: number | null;
  track_id: string | null;
  scheduled_at: string | null;
  status: MatchStatus;
  manual_override: boolean;
  created_at: string;
  driver_a?: Driver;
  driver_b?: Driver;
  track?: Track;
}

export interface Champion {
  id: string;
  tournament_id: string;
  driver_id: string;
  crowned_at: string;
  driver?: Driver;
  tournament?: Tournament;
}
