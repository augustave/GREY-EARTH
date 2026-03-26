"use client";

const INTEL_FEEDS = [
  {
    id: "sigint-01",
    type: "SIGINT",
    status: "LIVE",
    age: "2m",
    label: "RF INTERCEPT - 2.4GHz CLUSTER",
  },
  {
    id: "imint-01",
    type: "IMINT",
    status: "RECENT",
    age: "18m",
    label: "SAT PASS - SECTOR 4N",
  },
  {
    id: "masint-01",
    type: "MASINT",
    status: "AGING",
    age: "3h",
    label: "SEISMIC ARRAY - HARBOR APPROACH",
  },
  {
    id: "osint-01",
    type: "OSINT",
    status: "CURRENT",
    age: "5m",
    label: "MARITIME AIS - AMBROSE CH",
  },
];

export default function IntelFeedPanel() {
  return (
    <div className="panel-hardened hillshade-grain">
      <div className="panel-header-tactical">Live Intel Stream</div>
      <div className="max-h-64 overflow-y-auto">
        {INTEL_FEEDS.map((feed) => (
          <div
            key={feed.id}
            className="p-3 border-b border-divider hover:bg-white/[0.02] cursor-pointer group transition-colors"
          >
            <div className="flex justify-between items-center mb-1">
              <span
                className={`text-[8px] px-2 py-0.5 border uppercase tracking-widest ${
                  feed.status === "LIVE"
                    ? "border-sigint-green/30 text-sigint-green bg-sigint-green/5"
                    : "border-sigint-amber/30 text-sigint-amber bg-sigint-amber/5"
                }`}
              >
                {feed.status}
              </span>
              <span className="text-[8px] text-white/30 font-bold tracking-tighter">
                {`${feed.type} | ${feed.age}`}
              </span>
            </div>
            <div className="text-[10px] text-white/70 font-bold group-hover:text-sigint-green transition-colors leading-tight">
              {feed.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
