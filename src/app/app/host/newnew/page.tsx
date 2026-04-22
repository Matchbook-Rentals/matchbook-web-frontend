"use client";

import React from "react";
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
  Code2,
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
   DATA  —  swap this object for props / API response. Every component below
   is driven by this single source of truth, so integration is one-to-one.
--------------------------------------------------------------------------- */
const dashboardData = {
  user: { activeView: "Dashboard" },
  stats: [
    { id: "listings", label: "Listings", value: 20, icon: "home", highlight: true },
    { id: "pending", label: "Pending Applications", value: 5, icon: "users", highlight: false },
    { id: "bookings", label: "Active Bookings", value: 20, icon: "calendar", highlight: false },
  ],
  nav: [
    { id: "dashboard", label: "Dashboard", icon: "grid" },
    { id: "listings", label: "Listings", icon: "home" },
    { id: "applications", label: "Applications", icon: "users", badge: 1 },
    { id: "bookings", label: "Bookings", icon: "calendar-clock", badge: 1 },
    { id: "calendar", label: "Calendar", icon: "calendar" },
    { id: "payments", label: "Payments", icon: "card" },
  ],
  todos: [
    { id: "stripe", label: "Set Up Stripe Account", icon: "coins", actionable: false },
    { id: "identity", label: "Complete Identity Verification", icon: "badge", actionable: false },
    { id: "host", label: "Review Host Agreement", icon: "clipboard", actionable: false },
    { id: "movein", label: "Add Move-In Instructions : Ogden Mountain Home", icon: "file", actionable: true },
  ],
  rent: {
    title: "Rent Collected",
    unit: "$",
    ticks: [0, 2000, 3000, 4000],
    bars: [
      { month: "Jan", amount: 2700, active: false },
      { month: "Feb", amount: 3200, active: false },
      { month: "Mar", amount: 3100, active: false },
      { month: "Apr", amount: 4000, active: true },
    ],
  },
  payments: [
    {
      id: 1,
      title: "123 Maple Avenue Springfield",
      date: "12 Sep 2024, 9:29",
      amount: 2400,
      image:
        "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=200&h=200&fit=crop",
    },
    {
      id: 2,
      title: "Ogden Mountain Home",
      date: "10 Sep 2024, 9:29",
      amount: 1200,
      image:
        "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=200&h=200&fit=crop",
    },
    {
      id: 3,
      title: "Booking 987 Villa Street",
      date: "10 Sep 2024, 9:29",
      amount: 1200,
      image:
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=200&h=200&fit=crop",
    },
  ],
};

/* ---------------------------------------------------------------------------
   ICON MAP — decouples data-keys from component imports
--------------------------------------------------------------------------- */
const iconMap = {
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

const Icon = ({ name, ...rest }: { name: keyof typeof iconMap } & React.SVGProps<SVGSVGElement>) => {
  const C = iconMap[name] || Home;
  return <C {...rest} />;
};

/* ---------------------------------------------------------------------------
   LOGO
--------------------------------------------------------------------------- */
const Logo = () => (
  <div className="flex items-center gap-2">
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <path
        d="M16 4L4 13v2h2v13h8v-8h4v8h8V15h2v-2L16 4z"
        stroke="#1F5F5B"
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="16" cy="17" r="2.2" fill="#1F5F5B" />
      <path d="M14 17l2 2 2-2" stroke="#F5F1EA" strokeWidth="1" strokeLinecap="round" />
    </svg>
    <span
      className={`text-[22px] tracking-tight ${fraunces.variable}`}
      style={{ fontFamily: "var(--font-fraunces), 'Fraunces', serif", color: "#1F5F5B", fontWeight: 500 }}
    >
      Match<span style={{ fontWeight: 700 }}>Book</span>
    </span>
    <span className="ml-1 px-1.5 py-0.5 rounded-md border border-neutral-200 bg-white">
      <Code2 size={12} strokeWidth={2.25} className="text-neutral-700" />
    </span>
  </div>
);

/* ---------------------------------------------------------------------------
   SIDEBAR
--------------------------------------------------------------------------- */
interface NavItemProps {
  item: { id: string; label: string; icon: keyof typeof iconMap; badge?: number };
  active: boolean;
  onClick?: () => void;
}

const NavItem = ({ item, active, onClick }: NavItemProps) => (
  <button
    onClick={onClick}
    className={`group flex items-center justify-between w-full px-3 py-2 rounded-lg transition-colors
      ${active ? "text-[#1F5F5B]" : "text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50"}`}
  >
    <span className="flex items-center gap-3">
      <Icon name={item.icon} size={18} strokeWidth={1.75} />
      <span className="text-[14.5px]" style={{ fontWeight: active ? 600 : 500 }}>
        {item.label}
      </span>
    </span>
    {item.badge ? (
      <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#E8EEEC] text-neutral-700 font-medium">
        {item.badge}
      </span>
    ) : null}
  </button>
);

interface SidebarProps {
  nav: { id: string; label: string; icon: keyof typeof iconMap; badge?: number }[];
  active: string;
  footerNav: { id: string; label: string; iconComponent: React.ElementType }[];
}

const Sidebar = ({ nav, active, footerNav }: SidebarProps) => (
  <aside className="w-[240px] shrink-0 border-r border-neutral-200/70 bg-white flex flex-col justify-between">
    <div>
      <div className="px-5 pt-5 pb-6">
        <Logo />
      </div>
      <nav className="px-3 flex flex-col gap-0.5">
        {nav.map((item) => (
          <NavItem key={item.id} item={item} active={item.label === active} />
        ))}
      </nav>
    </div>
    <div className="px-3 pb-5 flex flex-col gap-0.5">
      {footerNav.map((item) => (
        <FooterNavItem key={item.id} item={item} />
      ))}
    </div>
  </aside>
);

interface FooterNavItemProps {
  item: { id: string; label: string; iconComponent: React.ElementType };
}

const FooterNavItem = ({ item }: FooterNavItemProps) => {
  const I = item.iconComponent;
  return (
    <button className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50 transition-colors">
      <I size={18} strokeWidth={1.75} />
      <span className="text-[14.5px]" style={{ fontWeight: 500 }}>
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

interface StatCardProps {
  stat: { id: string; label: string; value: number; icon: string; highlight: boolean };
}

const StatCard = ({ stat }: StatCardProps) => {
  const iconKey =
    stat.id === "listings" ? "home" : stat.id === "pending" ? "users" : "calendar";
  return (
    <button
      className={`group text-left w-full rounded-2xl px-6 py-5 transition-all
        ${stat.highlight ? "bg-[#F5F1EA]" : "bg-transparent hover:bg-neutral-50"}
      `}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className={`w-10 h-10 rounded-full flex items-center justify-center ${statIconBg[stat.id]}`}
          >
            <Icon name={iconKey as keyof typeof iconMap} size={18} strokeWidth={1.75} />
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
};

interface StatsRowProps {
  stats: { id: string; label: string; value: number; icon: string; highlight: boolean }[];
}

const StatsRow = ({ stats }: StatsRowProps) => (
  <div className="grid grid-cols-3 gap-4">
    {stats.map((s) => (
      <StatCard key={s.id} stat={s} />
    ))}
  </div>
);

/* ---------------------------------------------------------------------------
   TO DO
--------------------------------------------------------------------------- */
interface ToDoItemProps {
  item: { id: string; label: string; icon: keyof typeof iconMap; actionable: boolean };
}

const ToDoItem = ({ item }: ToDoItemProps) => (
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

interface ToDoListProps {
  todos: { id: string; label: string; icon: keyof typeof iconMap; actionable: boolean }[];
}

const ToDoList = ({ todos }: ToDoListProps) => (
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
interface RentChartProps {
  data: {
    title: string;
    unit: string;
    ticks: number[];
    bars: { month: string; amount: number; active: boolean }[];
  };
}

const RentChart = ({ data }: RentChartProps) => {
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
interface Payment {
  id: number;
  title: string;
  date: string;
  amount: number;
  image: string;
}

interface PaymentRowProps {
  payment: Payment;
  divider: boolean;
}

const PaymentRow = ({ payment, divider }: PaymentRowProps) => (
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

interface PaymentsListProps {
  payments: Payment[];
}

const PaymentsList = ({ payments }: PaymentsListProps) => (
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
   PAGE
--------------------------------------------------------------------------- */
export default function HostDashboard() {
  const footerNav = [
    { id: "switch", label: "Switch to Renter", iconComponent: ArrowLeftRight },
    { id: "support", label: "Support", iconComponent: HelpCircle },
    { id: "settings", label: "Settings", iconComponent: Settings },
    { id: "signout", label: "Sign Out", iconComponent: LogOut },
  ];

  return (
    <div
      className={`min-h-screen w-full bg-white ${inter.variable}`}
      style={{ fontFamily: "var(--font-inter), 'Inter', system-ui, sans-serif", color: "#1F2937" }}
    >
      <div className="flex min-h-screen">
        <Sidebar
          nav={dashboardData.nav}
          active={dashboardData.user.activeView}
          footerNav={footerNav}
        />

        <main className="flex-1 px-10 pt-5 pb-10">
          <h1
            className={`text-[26px] text-neutral-900 mb-6 ${fraunces.variable}`}
            style={{ fontFamily: "var(--font-fraunces), 'Fraunces', serif", fontWeight: 600 }}
          >
            Dashboard
          </h1>

          <StatsRow stats={dashboardData.stats} />

          <div className="grid grid-cols-2 gap-14 mt-8">
            <ToDoList todos={dashboardData.todos} />
            <RentChart data={dashboardData.rent} />
          </div>

          <div className="mt-10">
            <PaymentsList payments={dashboardData.payments} />
          </div>
        </main>
      </div>
    </div>
  );
}
