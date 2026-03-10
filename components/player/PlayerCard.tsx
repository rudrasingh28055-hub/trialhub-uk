import Link from "next/link";

export type PlayerCardProps = {
  profile_id: string;
  full_name: string | null;
  city: string | null;
  bio: string | null;
  age: number | null;
  primary_position: string | null;
  secondary_position: string | null;
  dominant_foot: string | null;
  height_cm: number | null;
  previous_club: string | null;
  video_url: string | null;
  instagram_url: string | null;
};

export default function PlayerCard(props: PlayerCardProps) {
  const {
    profile_id,
    full_name,
    city,
    bio,
    age,
    primary_position,
    secondary_position,
    dominant_foot,
    height_cm,
    previous_club,
    video_url,
    instagram_url,
  } = props;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl transition hover:-translate-y-1 hover:bg-white/[0.08]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white">
            {full_name || "Unnamed athlete"}
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            {city || "Unknown city"}
          </p>
        </div>

        <span className="rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">
          {primary_position || "Position TBC"}
        </span>
      </div>

      {bio && (
        <p className="mt-4 line-clamp-3 text-sm leading-7 text-slate-300">
          {bio}
        </p>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <div className="text-xs uppercase tracking-wide text-slate-500">
            Age
          </div>
          <div className="mt-1 text-sm font-medium text-white">
            {age ?? "Not set"}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <div className="text-xs uppercase tracking-wide text-slate-500">
            Height
          </div>
          <div className="mt-1 text-sm font-medium text-white">
            {height_cm ? `${height_cm} cm` : "Not set"}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <div className="text-xs uppercase tracking-wide text-slate-500">
            Secondary position
          </div>
          <div className="mt-1 text-sm font-medium text-white">
            {secondary_position || "Not set"}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <div className="text-xs uppercase tracking-wide text-slate-500">
            Dominant foot
          </div>
          <div className="mt-1 text-sm font-medium text-white">
            {dominant_foot || "Not set"}
          </div>
        </div>
      </div>

      <div className="mt-4 text-sm text-slate-400">
        Previous club: {previous_club || "Not set"}
      </div>

      <div className="mt-5 flex items-center justify-between">
        <div className="flex gap-2">
          {video_url && (
            <a
              href={video_url}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-300"
            >
              Highlights
            </a>
          )}

          {instagram_url && (
            <a
              href={instagram_url}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-300"
            >
              Instagram
            </a>
          )}
        </div>

        <Link
          href={`/players/${profile_id}`}
          className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-slate-200"
        >
          View player
        </Link>
      </div>
    </div>
  );
}

