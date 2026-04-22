"use client";

import React, { useState } from "react";
import {
  LayoutGrid,
  Home,
  Users,
  CalendarClock,
  Calendar,
  CreditCard,
  ArrowLeftRight,
  HelpCircle,
  Settings,
  LogOut,
  ChevronRight,
  FileText,
  ClipboardList,
  Coins,
  BadgeCheck,
} from "lucide-react";
import { Fraunces, Inter } from "next/font/google";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-fraunces",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

/* ---------------------------------------------------------------------------
   TYPES  —  shape of data the page passes in. Keep serializable (no React
   components or functions) so it can cross the server→client boundary.
--------------------------------------------------------------------------- */
export type NavIconKey =
  | "grid"
  | "home"
  | "users"
  | "calendar-clock"
  | "calendar"
  | "card"
  | "coins"
  | "badge"
  | "clipboard"
  | "file";

export type DashboardStat = {
  id: string;
  label: string;
  value: number;
  icon: NavIconKey;
};

export type DashboardNavItem = {
  id: string;
  label: string;
  icon: NavIconKey;
  badge?: number;
};

export type DashboardTodo = {
  id: string;
  label: string;
  icon: NavIconKey;
  actionable: boolean;
};

export type DashboardRent = {
  title: string;
  unit: string;
  ticks: number[];
  bars: { month: string; amount: number; active: boolean }[];
};

export type DashboardPayment = {
  id: number;
  title: string;
  date: string;
  amount: number;
  image: string;
};

export type DashboardData = {
  user: { activeView: string };
  stats: DashboardStat[];
  nav: DashboardNavItem[];
  todos: DashboardTodo[];
  rent: DashboardRent;
  payments: DashboardPayment[];
};

/* ---------------------------------------------------------------------------
   ICON MAP — decouples data-keys from component imports
--------------------------------------------------------------------------- */
const iconMap: Record<NavIconKey, React.ElementType> = {
  grid: LayoutGrid,
  home: Home,
  users: Users,
  "calendar-clock": CalendarClock,
  calendar: Calendar,
  card: CreditCard,
  coins: Coins,
  badge: BadgeCheck,
  clipboard: ClipboardList,
  file: FileText,
};

const Icon = ({
  name,
  ...rest
}: { name: NavIconKey } & React.ComponentProps<typeof Home>) => {
  const C = iconMap[name] || Home;
  return <C {...rest} />;
};

/* ---------------------------------------------------------------------------
   LOGO
--------------------------------------------------------------------------- */
const Logo = ({ expanded }: { expanded: boolean }) => (
  <div className="relative flex items-center h-9">
    <div
      className={`w-10 flex items-center justify-center shrink-0 transition-opacity duration-200 ${expanded ? "opacity-0" : "opacity-100"}`}
    >
      <img src="/logo-small.svg" alt="MatchBook" className="h-8 w-auto" />
    </div>
    <img
      src="/new-green-logo.png"
      alt="MatchBook"
      className={`absolute left-1 top-1/2 -translate-y-1/2 h-8 w-auto transition-opacity duration-200 ${expanded ? "opacity-100" : "opacity-0"}`}
    />
  </div>
);

/* ---------------------------------------------------------------------------
   SIDEBAR
--------------------------------------------------------------------------- */
interface NavItemProps {
  item: DashboardNavItem;
  active: boolean;
  expanded: boolean;
  onClick?: () => void;
}

const NavItem = ({ item, active, expanded, onClick }: NavItemProps) => (
  <button
    onClick={onClick}
    className={`group flex items-center w-full py-2 pr-3 rounded-lg transition-colors
      ${active ? "text-[#1F5F5B]" : "text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50"}`}
  >
    <span className="w-10 flex items-center justify-center shrink-0">
      <Icon name={item.icon} size={18} strokeWidth={1.75} />
    </span>
    <span
      className={`flex-1 flex items-center justify-between ml-2 whitespace-nowrap transition-opacity duration-200 ${expanded ? "opacity-100" : "opacity-0"}`}
    >
      <span className="text-[14.5px]" style={{ fontWeight: active ? 600 : 500 }}>
        {item.label}
      </span>
      {item.badge ? (
        <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#E8EEEC] text-neutral-700 font-medium">
          {item.badge}
        </span>
      ) : null}
    </span>
  </button>
);

interface FooterNavEntry {
  id: string;
  label: string;
  iconComponent: React.ElementType;
  emphasis?: boolean;
}

interface SidebarProps {
  nav: DashboardNavItem[];
  active: string;
  footerNav: FooterNavEntry[];
}

const COMPACT_W = 72;
const EXPANDED_W = 240;

const Sidebar = ({ nav, active, footerNav }: SidebarProps) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="shrink-0 relative z-40" style={{ width: COMPACT_W }}>
      <aside
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        className={`absolute inset-y-0 left-0 border-r border-neutral-200/70 bg-white flex flex-col justify-between overflow-hidden transition-[width,box-shadow] duration-300 ease-out ${
          expanded ? "shadow-xl" : ""
        }`}
        style={{ width: expanded ? EXPANDED_W : COMPACT_W }}
      >
        <div>
          <div className="px-3 pt-5 pb-6">
            <Logo expanded={expanded} />
          </div>
          <nav className="px-3 flex flex-col gap-0.5">
            {nav.map((item) => (
              <NavItem
                key={item.id}
                item={item}
                active={item.label === active}
                expanded={expanded}
              />
            ))}
          </nav>
        </div>
        <div className="px-3 pb-5 flex flex-col gap-0.5">
          {footerNav.map((item) => (
            <FooterNavItem key={item.id} item={item} expanded={expanded} />
          ))}
        </div>
      </aside>
    </div>
  );
};

interface FooterNavItemProps {
  item: FooterNavEntry;
  expanded: boolean;
}

const FooterNavItem = ({ item, expanded }: FooterNavItemProps) => {
  const I = item.iconComponent;
  const emphasis = item.emphasis;
  return (
    <button
      className={`group flex items-center w-full py-2 pr-3 rounded-lg transition-colors ${
        emphasis ? "text-neutral-700" : "text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50"
      }`}
    >
      <span
        className={`w-10 h-10 flex items-center justify-center shrink-0 rounded-lg transition-colors ${
          emphasis ? "bg-[#5C7080] text-white" : ""
        }`}
      >
        <I size={18} strokeWidth={1.75} />
      </span>
      <span
        className={`ml-2 whitespace-nowrap text-[14.5px] transition-opacity duration-200 ${
          expanded ? "opacity-100" : "opacity-0"
        }`}
        style={{ fontWeight: 500 }}
      >
        {item.label}
      </span>
    </button>
  );
};

/* ---------------------------------------------------------------------------
   STAT CARDS
--------------------------------------------------------------------------- */
const statIconBg: Record<string, string> = {
  listings: "bg-[#E8EEEC] text-[#1F5F5B]",
  pending: "bg-[#F1E9DA] text-[#9B7A3E]",
  bookings: "bg-[#EEE8DE] text-[#8A6B3E]",
};

const StatCard = ({ stat }: { stat: DashboardStat }) => (
  <button
    className="group text-left w-full rounded-2xl px-6 py-5 transition-all bg-transparent hover:bg-neutral-50"
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span
          className={`w-10 h-10 rounded-full flex items-center justify-center ${statIconBg[stat.id] ?? "bg-neutral-100 text-neutral-700"}`}
        >
          <Icon name={stat.icon} size={18} strokeWidth={1.75} />
        </span>
        <span className="text-[17px] text-neutral-800" style={{ fontWeight: 500 }}>
          {stat.label}
        </span>
      </div>
      <ChevronRight size={20} className="text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
    </div>
    <div
      className={`mt-3 text-[44px] leading-none text-neutral-900 ${fraunces.variable}`}
      style={{ fontFamily: "var(--font-fraunces), 'Fraunces', serif", fontWeight: 400 }}
    >
      {stat.value}
    </div>
  </button>
);

const StatsRow = ({ stats }: { stats: DashboardStat[] }) => (
  <div className="grid grid-cols-3 gap-4">
    {stats.map((s) => (
      <StatCard key={s.id} stat={s} />
    ))}
  </div>
);

/* ---------------------------------------------------------------------------
   TO DO
--------------------------------------------------------------------------- */
const ToDoItem = ({ item }: { item: DashboardTodo }) => (
  <button
    className={`flex items-center justify-between w-full px-4 py-3 rounded-xl transition-colors text-left
      ${item.actionable ? "bg-neutral-100" : "hover:bg-neutral-50"}
    `}
  >
    <span className="flex items-center gap-3">
      <span className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-700 shrink-0">
        <Icon name={item.icon} size={16} strokeWidth={1.75} />
      </span>
      <span className="text-[15px] text-neutral-800" style={{ fontWeight: 500 }}>
        {item.label}
      </span>
    </span>
    {item.actionable && <ChevronRight size={18} className="text-neutral-500 shrink-0" />}
  </button>
);

const ToDoList = ({ todos }: { todos: DashboardTodo[] }) => (
  <section>
    <h2
      className={`text-[22px] text-neutral-900 mb-4 ${fraunces.variable}`}
      style={{ fontFamily: "var(--font-fraunces), 'Fraunces', serif", fontWeight: 500 }}
    >
      To Do
    </h2>
    <div className="flex flex-col gap-1">
      {todos.map((t, i) => {
        const next = todos[i + 1];
        const showDivider = next && !t.actionable && !next.actionable;
        return (
          <React.Fragment key={t.id}>
            <ToDoItem item={t} />
            {showDivider && <div className="h-px bg-neutral-100 mx-4" />}
          </React.Fragment>
        );
      })}
    </div>
  </section>
);

/* ---------------------------------------------------------------------------
   RENT CHART  (pure SVG for pixel control + diagonal stripes)
--------------------------------------------------------------------------- */
const RentChart = ({ data }: { data: DashboardRent }) => {
  const { title, unit, ticks, bars } = data;

  const W = 520;
  const H = 240;
  const PAD_L = 56;
  const PAD_R = 16;
  const PAD_T = 16;
  const PAD_B = 36;

  const maxTick = Math.max(...ticks);
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;
  const bandW = chartW / bars.length;
  const barW = 46;

  const y = (v: number) => PAD_T + chartH - (v / maxTick) * chartH;

  return (
    <section>
      <h2
        className={`text-[22px] text-neutral-900 mb-4 ${fraunces.variable}`}
        style={{ fontFamily: "var(--font-fraunces), 'Fraunces', serif", fontWeight: 500 }}
      >
        {title}
      </h2>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        <defs>
          <pattern
            id="stripes"
            patternUnits="userSpaceOnUse"
            width="8"
            height="8"
            patternTransform="rotate(45)"
          >
            <rect width="8" height="8" fill="#2E7D77" />
            <line x1="0" y1="0" x2="0" y2="8" stroke="#4E968F" strokeWidth="3" />
          </pattern>
        </defs>

        {/* gridlines + y labels */}
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={PAD_L}
              x2={W - PAD_R}
              y1={y(t)}
              y2={y(t)}
              stroke="#D8D8D3"
              strokeDasharray="3 4"
              strokeWidth="1"
            />
            <text
              x={PAD_L - 10}
              y={y(t) + 4}
              textAnchor="end"
              fontSize="12"
              fill="#6B7280"
              style={{ fontFamily: "var(--font-inter), 'Inter', sans-serif" }}
            >
              {unit}
              {t}
            </text>
          </g>
        ))}

        {/* bars */}
        {bars.map((b, i) => {
          const cx = PAD_L + bandW * i + bandW / 2;
          const bx = cx - barW / 2;
          const by = y(b.amount);
          const bh = PAD_T + chartH - by;
          return (
            <g key={b.month}>
              <rect
                x={bx}
                y={by}
                width={barW}
                height={bh}
                rx="4"
                fill={b.active ? "url(#stripes)" : "#DDEAE3"}
              />
              <text
                x={cx}
                y={H - 10}
                textAnchor="middle"
                fontSize="13"
                fill="#374151"
                style={{ fontFamily: "var(--font-inter), 'Inter', sans-serif", fontWeight: 500 }}
              >
                {b.month}
              </text>
            </g>
          );
        })}
      </svg>
    </section>
  );
};

/* ---------------------------------------------------------------------------
   UPCOMING PAYMENTS
--------------------------------------------------------------------------- */
const PaymentRow = ({
  payment,
  divider,
}: {
  payment: DashboardPayment;
  divider: boolean;
}) => (
  <div>
    <div className="flex items-center justify-between py-4">
      <div className="flex items-center gap-4">
        <img
          src={payment.image}
          alt=""
          className="w-12 h-12 rounded-full object-cover ring-1 ring-neutral-200"
        />
        <div>
          <div className="text-[16px] text-neutral-900" style={{ fontWeight: 600 }}>
            {payment.title}
          </div>
          <div className="text-[12.5px] text-neutral-500 mt-0.5">{payment.date}</div>
        </div>
      </div>
      <div
        className="text-[17px]"
        style={{ color: "#1F5F5B", fontWeight: 600, fontFamily: "var(--font-inter), 'Inter', sans-serif" }}
      >
        ${payment.amount.toLocaleString()}
      </div>
    </div>
    {divider && <div className="h-px bg-neutral-200/80" />}
  </div>
);

const PaymentsList = ({ payments }: { payments: DashboardPayment[] }) => (
  <section>
    <div className="flex items-center justify-between mb-2">
      <h2
        className={`text-[22px] text-neutral-900 ${fraunces.variable}`}
        style={{ fontFamily: "var(--font-fraunces), 'Fraunces', serif", fontWeight: 500 }}
      >
        Upcoming Payments
      </h2>
      <button className="text-[13.5px] text-neutral-500 hover:text-[#1F5F5B] transition-colors">
        See All
      </button>
    </div>
    <div>
      {payments.map((p, i) => (
        <PaymentRow key={p.id} payment={p} divider={i < payments.length - 1} />
      ))}
    </div>
  </section>
);

/* ---------------------------------------------------------------------------
   CLIENT ENTRYPOINT
--------------------------------------------------------------------------- */
export default function DashboardClient({ data }: { data: DashboardData }) {
  const footerNav: FooterNavEntry[] = [
    { id: "switch", label: "Switch to Renter", iconComponent: ArrowLeftRight },
    { id: "support", label: "Support", iconComponent: HelpCircle },
    { id: "settings", label: "Settings", iconComponent: Settings },
    { id: "signout", label: "Sign Out", iconComponent: LogOut, emphasis: true },
  ];

  return (
    <div
      className={`min-h-screen w-full bg-white ${inter.variable}`}
      style={{ fontFamily: "var(--font-inter), 'Inter', system-ui, sans-serif", color: "#1F2937" }}
    >
      <div className="flex min-h-screen">
        <Sidebar nav={data.nav} active={data.user.activeView} footerNav={footerNav} />

        <main className="flex-1 px-10 pt-5 pb-10">
          <h1
            className={`text-[26px] text-neutral-900 mb-6 ${fraunces.variable}`}
            style={{ fontFamily: "var(--font-fraunces), 'Fraunces', serif", fontWeight: 600 }}
          >
            Dashboard
          </h1>

          <StatsRow stats={data.stats} />

          <div className="grid grid-cols-2 gap-14 mt-8">
            <ToDoList todos={data.todos} />
            <RentChart data={data.rent} />
          </div>

          <div className="mt-10">
            <PaymentsList payments={data.payments} />
          </div>
        </main>
      </div>
    </div>
  );
}
