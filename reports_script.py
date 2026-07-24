import os

content = """
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/Toast";
import { 
  Trophy, Users, Activity, Settings, X, Search, ArrowRight,
  FileText, LayoutDashboard, Calendar, Target, Award,
  Menu, Download, BarChart3, Filter, ChevronDown, 
  Map, FileOutput, Loader2, ArrowUp, ArrowDown, Trash2, CheckCircle2
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend, ComposedChart
} from "recharts";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

interface ReportsClientProps {
  profile: any;
  userRole: string;
  initialChallenges: any[];
}

const COLORS = ["#84cc16", "#3b82f6", "#a855f7", "#ec4899", "#f59e0b"];

export default function ReportsClient({
  profile,
  userRole,
  initialChallenges
}: ReportsClientProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const supabase = createClient();

  // Filters State
  const [dateRange, setDateRange] = useState("Last 30 Days");
  const [sportType, setSportType] = useState("All");
  const [challengeId, setChallengeId] = useState<string | null>(null);
  
  // Custom Date Range State
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Data State
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [data, setData] = useState<any>(null);
  const [reportsHistory, setReportsHistory] = useState<any[]>([]);

  // Leaderboard Toggle
  const [leaderboardMetric, setLeaderboardMetric] = useState("byDistance"); // byDistance, byActivities, byElevation

  // Dropdown States
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const [challengeDropdownOpen, setChallengeDropdownOpen] = useState(false);
  const [sportDropdownOpen, setSportDropdownOpen] = useState(false);

  const navigationGroups = [
    {
      label: "WORKSPACE",
      links: [
        { title: "Dashboard", icon: LayoutDashboard, active: false, route: "/arena-admin" },
        { title: "Challenges", icon: Trophy, active: false, route: "/arena-admin/challenges" },
        { title: "Athletes", icon: Users, active: false, route: "/arena-admin/athletes" },
        { title: "Activities", icon: Activity, active: false, route: "/arena-admin/activities" },
        { title: "Reports", icon: FileText, active: true, route: "/arena-admin/reports" },
      ]
    }
  ];

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.rpc("get_analytics_report_data", {
        p_date_range: dateRange,
        p_start_date: startDate || null,
        p_end_date: endDate || null,
        p_challenge_id: challengeId,
        p_sport_type: sportType
      });

      if (error) throw error;
      
      // Also fetch generated reports history
      const { data: history } = await supabase.from("generated_reports").select("*").order("generated_date", { ascending: false });
      
      setData(result);
      if (history) setReportsHistory(history);
    } catch (e: any) {
      console.error(e);
      addToast("Failed to fetch analytics", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dateRange === "Custom Range" && (!startDate || !endDate)) return;
    fetchAnalytics();
  }, [dateRange, startDate, endDate, challengeId, sportType]);

  const handleExport = async (format: "PDF" | "Excel" | "CSV") => {
    if (!data) return;
    setIsExporting(true);
    addToast(`${format} Generation Started`, "success", `Compiling analytics data...`);
    
    try {
      if (format === "PDF") generatePDF();
      else if (format === "Excel") generateExcel();
      else if (format === "CSV") generateCSV();

      // Mock saving to DB
      await supabase.from("generated_reports").insert({
        report_name: `${dateRange} Analytics Report`,
        format: format,
        generated_by: profile.id,
        file_url: null
      });
      fetchAnalytics(); // refresh history
    } catch (e) {
      addToast("Export failed", "error");
    } finally {
      setIsExporting(false);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("KYL Arena - Analytics Report", 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
    doc.text(`Filters: ${dateRange} | Sport: ${sportType}`, 14, 35);
    
    autoTable(doc, {
      startY: 45,
      head: [['Metric', 'Value', 'Previous Period']],
      body: [
        ['Total Distance (km)', data.overview.totalDistance, data.overview.totalDistancePrev],
        ['Total Activities', data.overview.totalActivities, data.overview.totalActivitiesPrev],
        ['Active Members', data.overview.activeMembers, data.overview.activeMembersPrev],
        ['New Members', data.overview.newMembers, data.overview.newMembersPrev],
      ],
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 15,
      head: [['Challenge', 'Participants', 'Completed (%)']],
      body: data.challengeCompletion.map((c: any) => [c.name, c.participants, `${c.completion_percent}%`]),
    });
    
    doc.save(`KYL_Arena_Report_${Date.now()}.pdf`);
  };

  const generateExcel = () => {
    const wb = XLSX.utils.book_new();
    
    // Overview Sheet
    const overviewData = [
      { Metric: "Total Distance (km)", Value: data.overview.totalDistance },
      { Metric: "Total Activities", Value: data.overview.totalActivities },
      { Metric: "Active Members", Value: data.overview.activeMembers },
      { Metric: "New Members", Value: data.overview.newMembers },
      { Metric: "Avg Distance (km)", Value: data.overview.avgDistance },
      { Metric: "Avg Activities", Value: data.overview.avgActivities },
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(overviewData), "Overview");

    // Leaderboard Sheet
    const lbSheet = XLSX.utils.json_to_sheet(data.topAthletes.byDistance);
    XLSX.utils.book_append_sheet(wb, lbSheet, "Leaderboard (Distance)");

    // Challenges Sheet
    const chalSheet = XLSX.utils.json_to_sheet(data.challengeCompletion);
    XLSX.utils.book_append_sheet(wb, chalSheet, "Challenges");

    XLSX.writeFile(wb, `KYL_Arena_Report_${Date.now()}.xlsx`);
  };

  const generateCSV = () => {
    // Generate simple CSV from Daily Volume
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,Activities,Distance(km)\\n";
    data.dailyVolume.forEach((r: any) => {
      csvContent += `${r.date},${r.activities},${r.distance}\\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `KYL_Activity_Log_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const deleteReport = async (id: string) => {
    await supabase.from("generated_reports").delete().eq("id", id);
    fetchAnalytics();
    addToast("Report deleted", "success");
  };

  const renderTrend = (current: number, prev: number) => {
    if (prev === 0) return null;
    const diff = current - prev;
    const percent = ((diff / prev) * 100).toFixed(1);
    const isPositive = diff >= 0;
    
    return (
      <div className={`flex items-center gap-1 text-xs font-bold ${isPositive ? 'text-lime-400' : 'text-red-400'}`}>
        {isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
        {Math.abs(Number(percent))}%
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-[#09090b] text-zinc-300 font-sans overflow-hidden">
      {/* SIDEBAR (Desktop) */}
      <aside className="hidden lg:flex w-[240px] flex-col border-r border-[#ffffff0f] bg-[#0C0C0E] shrink-0 h-full">
        <div className="h-16 flex items-center px-6 border-b border-[#ffffff0f] shrink-0 gap-3">
          <div className="relative shrink-0 flex items-center justify-center h-9 w-9">
            <svg className="h-8 w-8 relative z-10" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g fill="#22c55e"><circle cx="48" cy="20" r="7" /><path d="M 28 69 C 14 78, 12 79, 10 80 C 15 78, 25 65, 32 50 C 37 40, 48 30, 60 22 Z" /></g>
              <g fill="#ef4444"><circle cx="78" cy="32" r="7" /><path d="M 46 48 C 58 40, 68 35, 75 42 Z" /></g>
              <g fill="#3b82f6"><circle cx="53" cy="68" r="7" /><path d="M 6 81 C 12 83, 25 75, 35 68 Z" /></g>
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black text-white tracking-wider leading-none">
              KYL <span className="text-lime-400">ARENA</span>
            </span>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">Admin Console</span>
          </div>
        </div>

        <nav className="flex-1 flex flex-col px-4 py-6 space-y-6 overflow-y-auto scrollbar-none">
          {navigationGroups.map((group) => (
            <div key={group.label} className="space-y-3">
              <h3 className="text-[10px] font-bold text-zinc-500/80 uppercase tracking-wider px-3">{group.label}</h3>
              <div className="space-y-1">
                {group.links.map((link) => (
                  <button
                    key={link.title}
                    onClick={() => router.push(link.route)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group border-l-2 ${
                      link.active 
                        ? "bg-lime-500/10 text-white font-medium border-lime-500" 
                        : "text-zinc-400 hover:text-white hover:bg-white/5 border-transparent font-normal hover:translate-x-1 hover:brightness-110"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <link.icon className={`h-4 w-4 ${link.active ? "text-lime-400" : "text-zinc-500 group-hover:text-zinc-300"}`} />
                      <span>{link.title}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* MOBILE SIDEBAR */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-[240px] z-50 bg-[#0C0C0E] border-r border-[#ffffff0f] flex flex-col lg:hidden"
            >
              <div className="h-16 flex items-center px-6 border-b border-[#ffffff0f] gap-3 shrink-0">
                <div className="flex flex-col">
                  <span className="text-sm font-black text-white tracking-wider leading-none">
                    KYL <span className="text-lime-400">ARENA</span>
                  </span>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="ml-auto text-zinc-500 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex-1 flex flex-col px-4 py-6 space-y-6 overflow-y-auto scrollbar-none">
                {navigationGroups.map((group) => (
                  <div key={group.label} className="space-y-3">
                    <h3 className="text-[10px] font-bold text-zinc-500/80 uppercase tracking-wider px-3">{group.label}</h3>
                    <div className="space-y-1">
                      {group.links.map((link) => (
                        <button
                          key={link.title}
                          onClick={() => { setIsSidebarOpen(false); router.push(link.route); }}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group border-l-2 ${
                            link.active ? "bg-lime-500/10 text-white font-medium border-lime-500" : "text-zinc-400 hover:text-white hover:bg-white/5 border-transparent font-normal hover:translate-x-1"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <link.icon className={`h-4 w-4 ${link.active ? "text-lime-400" : "text-zinc-500"}`} />
                            <span>{link.title}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="h-16 flex items-center px-6 border-b border-white/5 bg-[#09090b] shrink-0 gap-6 z-30 justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-zinc-400 hover:text-white">
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-bold text-white tracking-tight hidden sm:block">Reports & Analytics</h1>
          </div>
          
          <div className="flex items-center gap-2 lg:gap-4 overflow-x-auto scrollbar-none pr-2">
            
            {/* SPORT FILTER */}
            <div className="relative">
              <button 
                onClick={() => setSportDropdownOpen(!sportDropdownOpen)}
                className="whitespace-nowrap h-9 px-3 bg-zinc-900 border border-white/10 hover:border-white/20 rounded-lg text-xs font-medium text-white transition-colors flex items-center gap-2"
              >
                <Activity className="h-3.5 w-3.5 text-zinc-400" />
                {sportType}
                <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />
              </button>
              {sportDropdownOpen && (
                <div className="absolute top-10 right-0 w-32 bg-[#0C0C0E] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50">
                  {["All", "Ride", "Run", "Walk"].map(s => (
                    <button key={s} onClick={() => { setSportType(s); setSportDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-xs hover:bg-white/5 text-white">
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* DATE FILTER */}
            <div className="relative">
              <button 
                onClick={() => setDateDropdownOpen(!dateDropdownOpen)}
                className="whitespace-nowrap h-9 px-3 bg-zinc-900 border border-white/10 hover:border-white/20 rounded-lg text-xs font-medium text-white transition-colors flex items-center gap-2"
              >
                <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                {dateRange}
                <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />
              </button>
              {dateDropdownOpen && (
                <div className="absolute top-10 right-0 w-40 bg-[#0C0C0E] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50">
                  {["Today", "Last 7 Days", "Last 30 Days", "This Month", "Last Month", "Custom Range"].map(d => (
                    <button key={d} onClick={() => { setDateRange(d); setShowCustomDate(d === "Custom Range"); setDateDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-xs hover:bg-white/5 text-white">
                      {d}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* CHALLENGE FILTER */}
            <div className="relative hidden lg:block">
              <button 
                onClick={() => setChallengeDropdownOpen(!challengeDropdownOpen)}
                className="whitespace-nowrap h-9 px-3 bg-zinc-900 border border-white/10 hover:border-white/20 rounded-lg text-xs font-medium text-white transition-colors flex items-center gap-2 max-w-[200px]"
              >
                <Filter className="h-3.5 w-3.5 text-zinc-400" />
                <span className="truncate">{challengeId ? initialChallenges.find(c => c.id === challengeId)?.title : "All Challenges"}</span>
                <ChevronDown className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
              </button>
              {challengeDropdownOpen && (
                <div className="absolute top-10 right-0 w-56 bg-[#0C0C0E] border border-white/10 rounded-xl shadow-xl overflow-y-auto max-h-[300px] z-50">
                  <button onClick={() => { setChallengeId(null); setChallengeDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-xs hover:bg-white/5 text-white border-b border-white/5 font-bold">
                    All Challenges
                  </button>
                  {initialChallenges.map(c => (
                    <button key={c.id} onClick={() => { setChallengeId(c.id); setChallengeDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-xs hover:bg-white/5 text-zinc-400 hover:text-white truncate">
                      {c.title}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button onClick={() => handleExport("PDF")} disabled={loading || isExporting} className="whitespace-nowrap h-9 px-4 bg-lime-500 hover:bg-lime-400 disabled:opacity-50 text-black rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2">
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileOutput className="h-4 w-4" />}
              Generate
            </button>
          </div>
        </header>

        {showCustomDate && (
          <div className="bg-[#0C0C0E] border-b border-white/5 p-4 flex items-center gap-4 shrink-0">
            <span className="text-xs font-bold text-zinc-500 uppercase">Custom Range:</span>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-zinc-900 border border-white/10 rounded-md px-3 py-1.5 text-sm text-white" />
            <span className="text-zinc-500">to</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-zinc-900 border border-white/10 rounded-md px-3 py-1.5 text-sm text-white" />
          </div>
        )}

        <main className="flex-1 overflow-y-auto scrollbar-none p-6 lg:p-10 space-y-8 max-w-7xl mx-auto w-full">
          
          {loading || !data ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <Loader2 className="h-8 w-8 text-lime-500 animate-spin" />
              <p className="text-sm font-medium text-zinc-500">Aggregating real-time data...</p>
            </div>
          ) : (
            <>
              {/* SUMMARY CARDS */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-zinc-900 border border-white/5 rounded-xl p-5 relative overflow-hidden group">
                  <div className="absolute right-0 top-0 w-24 h-24 bg-lime-500/5 rounded-bl-full transition-transform group-hover:scale-110" />
                  <div className="flex justify-between items-start mb-3">
                    <Map className="h-5 w-5 text-lime-400" />
                    {renderTrend(data.overview.totalDistance, data.overview.totalDistancePrev)}
                  </div>
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Total Community Distance</span>
                  <span className="text-3xl font-black text-white">{data.overview.totalDistance} <span className="text-sm font-normal text-zinc-500">km</span></span>
                </div>
                
                <div className="bg-zinc-900 border border-white/5 rounded-xl p-5 relative overflow-hidden group">
                  <div className="absolute right-0 top-0 w-24 h-24 bg-blue-500/5 rounded-bl-full transition-transform group-hover:scale-110" />
                  <div className="flex justify-between items-start mb-3">
                    <Activity className="h-5 w-5 text-blue-400" />
                    {renderTrend(data.overview.totalActivities, data.overview.totalActivitiesPrev)}
                  </div>
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Total Activities</span>
                  <span className="text-3xl font-black text-white">{data.overview.totalActivities}</span>
                </div>

                <div className="bg-zinc-900 border border-white/5 rounded-xl p-5 relative overflow-hidden group">
                  <div className="absolute right-0 top-0 w-24 h-24 bg-purple-500/5 rounded-bl-full transition-transform group-hover:scale-110" />
                  <div className="flex justify-between items-start mb-3">
                    <Target className="h-5 w-5 text-purple-400" />
                  </div>
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Completion Rate</span>
                  <span className="text-3xl font-black text-white">{data.overview.completionRate}%</span>
                </div>

                <div className="bg-zinc-900 border border-white/5 rounded-xl p-5 relative overflow-hidden group">
                  <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full transition-transform group-hover:scale-110" />
                  <div className="flex justify-between items-start mb-3">
                    <Users className="h-5 w-5 text-emerald-400" />
                    {renderTrend(data.overview.activeMembers, data.overview.activeMembersPrev)}
                  </div>
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Active / New Members</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-white">{data.overview.activeMembers}</span>
                    <span className="text-sm font-bold text-emerald-400">+{data.overview.newMembers}</span>
                  </div>
                </div>

                <div className="bg-zinc-900 border border-white/5 rounded-xl p-4 flex flex-col justify-center">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Challenges Completed</span>
                  <span className="text-xl font-black text-white">{data.overview.challengesCompleted}</span>
                </div>
                
                <div className="bg-zinc-900 border border-white/5 rounded-xl p-4 flex flex-col justify-center">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Avg Distance/Activity</span>
                  <span className="text-xl font-black text-white">{data.overview.avgDistance} <span className="text-xs font-normal text-zinc-500">km</span></span>
                </div>
                
                <div className="bg-zinc-900 border border-white/5 rounded-xl p-4 flex flex-col justify-center col-span-2 lg:col-span-1">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Avg Activities/Athlete</span>
                  <span className="text-xl font-black text-white">{data.overview.avgActivities}</span>
                </div>
              </div>

              {/* CHARTS SECTION 1 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-zinc-900 border border-white/5 rounded-xl p-6 min-h-[350px] flex flex-col relative overflow-hidden">
                  <h3 className="text-sm font-bold text-white mb-6">Community Growth (Athletes)</h3>
                  <div className="flex-1 w-full h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.communityGrowth}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                        <XAxis dataKey="date" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }} />
                        <Line type="monotone" dataKey="count" stroke="#84cc16" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: "#84cc16" }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-zinc-900 border border-white/5 rounded-xl p-6 min-h-[350px] flex flex-col relative overflow-hidden">
                  <h3 className="text-sm font-bold text-white mb-6">Sport Distribution</h3>
                  <div className="flex-1 w-full h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Cycling', value: data.sportDistribution.cycling },
                            { name: 'Running', value: data.sportDistribution.running },
                            { name: 'Walking', value: data.sportDistribution.walking }
                          ]}
                          cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                          paddingAngle={5} dataKey="value" stroke="none"
                        >
                          {COLORS.map((color, index) => <Cell key={`cell-${index}`} fill={color} />)}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }} formatter={(val: number) => `${val}%`} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#a1a1aa' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-zinc-900 border border-white/5 rounded-xl p-6 min-h-[350px] flex flex-col relative overflow-hidden lg:col-span-2">
                  <h3 className="text-sm font-bold text-white mb-6">Daily Activity Volume & Distance</h3>
                  <div className="flex-1 w-full h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={data.dailyVolume}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                        <XAxis dataKey="date" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis yAxisId="left" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis yAxisId="right" orientation="right" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }} />
                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                        <Bar yAxisId="left" dataKey="activities" name="Activities" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        <Line yAxisId="right" type="monotone" dataKey="distance" name="Distance (km)" stroke="#84cc16" strokeWidth={3} dot={false} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* CHALLENGE COMPLETION & LEADERBOARD */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-zinc-900 border border-white/5 rounded-xl p-6 relative overflow-hidden flex flex-col min-h-[350px]">
                  <h3 className="text-sm font-bold text-white mb-6">Challenge Completion</h3>
                  <div className="flex-1 w-full h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart layout="vertical" data={data.challengeCompletion} margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={true} vertical={false} />
                        <XAxis type="number" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis dataKey="name" type="category" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} width={120} />
                        <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }} />
                        <Legend />
                        <Bar dataKey="completed" name="Completed" stackId="a" fill="#84cc16" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="remaining" name="Remaining" stackId="a" fill="#3f3f46" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-zinc-900 border border-white/5 rounded-xl p-6 relative overflow-hidden flex flex-col min-h-[350px]">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-bold text-white">Top 10 Athletes</h3>
                    <div className="flex bg-black/40 rounded-lg p-1">
                      {[
                        { id: 'byDistance', label: 'Distance' },
                        { id: 'byActivities', label: 'Activities' },
                        { id: 'byElevation', label: 'Elevation' }
                      ].map(metric => (
                        <button
                          key={metric.id}
                          onClick={() => setLeaderboardMetric(metric.id)}
                          className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-md transition-colors ${
                            leaderboardMetric === metric.id ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          {metric.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto pr-2 space-y-3 scrollbar-none">
                    {data.topAthletes[leaderboardMetric]?.map((athlete: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="w-6 text-center text-xs font-bold text-zinc-500">#{idx + 1}</div>
                          <img src={athlete.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(athlete.name)}&background=27272a&color=fff`} className="w-8 h-8 rounded-full" alt={athlete.name} />
                          <span className="text-sm font-medium text-white">{athlete.name}</span>
                        </div>
                        <div className="text-sm font-black text-lime-400">
                          {athlete.value} <span className="text-[10px] text-zinc-500">{athlete.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* COMMUNITY INSIGHTS */}
              <div>
                <h3 className="text-lg font-black text-white mb-4">Community Insights</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: "Most Active", name: data.communityInsights.mostActiveAthlete, val: `${data.communityInsights.mostActiveAthleteValue} acts`, icon: Activity, color: "text-blue-400" },
                    { label: "Longest Ride", name: data.communityInsights.longestRide, val: `${data.communityInsights.longestRideValue} km`, icon: Map, color: "text-lime-400" },
                    { label: "Longest Run", name: data.communityInsights.longestRun, val: `${data.communityInsights.longestRunValue} km`, icon: Map, color: "text-emerald-400" },
                    { label: "Highest Elevation", name: data.communityInsights.highestElevation, val: `${data.communityInsights.highestElevationValue} m`, icon: Target, color: "text-purple-400" },
                  ].map((insight, idx) => (
                    <div key={idx} className="bg-zinc-900 border border-white/5 rounded-xl p-4 flex flex-col gap-2 relative overflow-hidden group">
                      <div className="flex items-center gap-2">
                        <insight.icon className={`h-4 w-4 ${insight.color}`} />
                        <span className="text-[10px] font-bold text-zinc-500 uppercase">{insight.label}</span>
                      </div>
                      <span className="text-sm font-bold text-white truncate">{insight.name}</span>
                      <span className="text-xs text-zinc-400">{insight.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* EXPORTS GRID */}
              <div>
                <h2 className="text-lg font-black text-white mb-4">Export Tools</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button onClick={() => handleExport("PDF")} disabled={isExporting} className="bg-zinc-900 hover:bg-zinc-800 border border-white/5 hover:border-white/10 rounded-xl p-4 text-left transition-all group flex flex-col justify-between min-h-[120px]">
                    <div className="h-8 w-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Download className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Full Report PDF</h4>
                      <p className="text-[10px] text-zinc-500 mt-1">Professional layout with charts & insights.</p>
                    </div>
                  </button>
                  
                  <button onClick={() => handleExport("Excel")} disabled={isExporting} className="bg-zinc-900 hover:bg-zinc-800 border border-white/5 hover:border-white/10 rounded-xl p-4 text-left transition-all group flex flex-col justify-between min-h-[120px]">
                    <div className="h-8 w-8 rounded-lg bg-lime-500/10 text-lime-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Download className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Multi-Sheet Excel</h4>
                      <p className="text-[10px] text-zinc-500 mt-1">Overview, Athletes, and Challenge sheets.</p>
                    </div>
                  </button>

                  <button onClick={() => handleExport("CSV")} disabled={isExporting} className="bg-zinc-900 hover:bg-zinc-800 border border-white/5 hover:border-white/10 rounded-xl p-4 text-left transition-all group flex flex-col justify-between min-h-[120px]">
                    <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Download className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Raw Daily CSV</h4>
                      <p className="text-[10px] text-zinc-500 mt-1">Export filtered daily aggregate volumes.</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* REPORT HISTORY */}
              <div>
                <h2 className="text-lg font-black text-white mb-4">Report History</h2>
                <div className="bg-zinc-900 border border-white/5 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-sm text-zinc-400">
                    <thead className="bg-black/20 text-xs uppercase font-bold text-zinc-500">
                      <tr>
                        <th className="px-6 py-4">Report Name</th>
                        <th className="px-6 py-4">Format</th>
                        <th className="px-6 py-4">Generated Date</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {reportsHistory.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">No reports generated yet.</td>
                        </tr>
                      ) : (
                        reportsHistory.map(report => (
                          <tr key={report.id} className="hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4 font-medium text-white flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-lime-500" />
                              {report.report_name}
                            </td>
                            <td className="px-6 py-4">
                              <span className="bg-white/10 px-2 py-1 rounded text-xs font-bold">{report.format}</span>
                            </td>
                            <td className="px-6 py-4">{new Date(report.generated_date).toLocaleString()}</td>
                            <td className="px-6 py-4 text-right">
                              <button onClick={() => deleteReport(report.id)} className="p-2 text-zinc-500 hover:text-red-400 transition-colors">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

        </main>
      </div>
    </div>
  );
}
"""

with open("app/arena-admin/reports/ReportsClient.tsx", "w") as f:
    f.write(content)
