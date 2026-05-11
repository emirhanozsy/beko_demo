"use client";

import { useState, useEffect } from "react";

// Inline Icons (Lucide replacement)
const CameraIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>;
const ActivityIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>;
const ImageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>;
const ZapIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>;
const ShieldCheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>;
const RefreshIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>;

export default function Dashboard() {
  const [focus, setFocus] = useState(120);
  const [iso, setIso] = useState(500);
  const [exposure, setExposure] = useState(20000);
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [sharpness, setSharpness] = useState(1);
  const [fps, setFps] = useState(0);
  const [status, setStatus] = useState("Bağlı");
  const [logs, setLogs] = useState<{ time: string; msg: string; type: string }[]>([]);
  const [apiHost, setApiHost] = useState("");
  const [theme, setTheme] = useState<"black" | "light">("black");

  useEffect(() => {
    // Get host from current URL (e.g. 192.168.0.13)
    const host = window.location.hostname;
    setApiHost(`http://${host}:8000`);
  }, []);

  const addLog = (msg: string, type: string = "info") => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [{ time, msg, type }, ...prev].slice(0, 50));
  };

  useEffect(() => {
    if (!apiHost) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${apiHost}/status`);
        if (res.ok) {
            const data = await res.json();
            setFps(data.fps);
            setStatus("Aktif");
            // Sync current values if needed (optional)
        } else {
            setStatus("Bağlantı Hatası");
        }
      } catch (e) {
        setStatus("Bağlantı Kesildi");
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [apiHost]);

  const updateControl = async (key: string, value: number) => {
    if (!apiHost) return;
    try {
      await fetch(`${apiHost}/control`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
      // addLog(`${key.toUpperCase()} güncellendi: ${value}`, "success");
    } catch (e) {
      // addLog("Kontrol güncelleme hatası", "warn");
    }
  };

  const captureFrame = async () => {
    if (!apiHost) return;
    try {
      const res = await fetch(`${apiHost}/capture`, { method: "POST" });
      const data = await res.json();
      addLog(`Fotoğraf kaydedildi: ${data.filename}`, "success");
    } catch (e) {
      addLog("Fotoğraf kaydetme hatası", "warn");
    }
  };

  return (
    <div className={`min-h-screen p-6 font-sans transition-colors duration-300 ${
      theme === "black" ? "bg-black text-white" : "bg-slate-50 text-slate-900"
    }`}>
      {/* Header */}
      <header className={`flex justify-between items-center mb-8 p-4 rounded-2xl border backdrop-blur-md ${
        theme === "black" ? "bg-zinc-900/40 border-zinc-800" : "bg-white/80 border-slate-200 shadow-sm"
      }`}>
        <div className="flex items-center gap-6">
          <img src="/beko.png" alt="Beko Logo" className={`h-8 w-auto object-contain ${theme === "black" ? "brightness-0 invert opacity-90" : ""}`} />
          <div className="h-6 w-px bg-zinc-800/50"></div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Vision <span className={theme === "black" ? "text-blue-500" : "text-blue-600"}>AI</span></h1>
            <p className={`${theme === "black" ? "text-zinc-500" : "text-slate-500"} text-[10px] uppercase tracking-widest font-bold`}>Industrial Monitoring</p>
          </div>
        </div>
        <div className="flex items-center gap-8">
          <div className="flex flex-col items-end">
            <span className={`text-[10px] uppercase font-bold tracking-widest mb-1 ${theme === "black" ? "text-zinc-500" : "text-slate-400"}`}>Powered By</span>
            <img src="/dataguess.png" alt="Dataguess Logo" className={`h-6 w-auto object-contain ${theme === "black" ? "brightness-0 invert opacity-90" : ""}`} />
          </div>
          <div className="h-8 w-px bg-zinc-800/50"></div>
          <div className="flex flex-col items-end">
            <span className={`text-[10px] uppercase font-bold tracking-widest ${theme === "black" ? "text-zinc-500" : "text-slate-500"}`}>Sistem Durumu</span>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full animate-pulse ${status === "Aktif" ? "bg-emerald-500" : "bg-rose-500"}`}></span>
              <span className="font-medium text-sm">{status}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setTheme(theme === "black" ? "light" : "black")}
              className={`p-2 rounded-full border transition-colors ${
                theme === "black" ? "bg-zinc-900/50 border-zinc-700 hover:bg-zinc-800" : "bg-white border-slate-200 hover:bg-slate-100"
              }`}
              title="Tema Değiştir"
            >
              {theme === "black" ? "☀️" : "🌙"}
            </button>
            <button className={`p-2 rounded-full border transition-colors ${
              theme === "black" ? "bg-zinc-900/50 border-zinc-700 hover:bg-zinc-800" : "bg-white border-slate-200 hover:bg-slate-100"
            }`}>
              <RefreshIcon />
            </button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-8 items-stretch">
        {/* Left Column - Live Stream */}
        <div className="col-span-12 xl:col-span-8">
          <div className={`h-full border rounded-xl overflow-hidden shadow-2xl ${
            theme === "black" ? "bg-zinc-950 border-zinc-800" : "bg-white border-slate-200"
          }`}>
            <div className={`flex items-center justify-between border-b px-6 py-3 ${
              theme === "black" ? "border-zinc-800/50 bg-zinc-900/30" : "border-slate-100 bg-slate-50/50"
            }`}>
              <div className="flex items-center gap-2 text-sm font-medium">
                <ActivityIcon />
                <span>Canlı Yayın: OAK-D Camera A</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  theme === "black" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-blue-50/50 text-blue-600 border-blue-200"
                }`}>
                  {fps} FPS
                </span>
              </div>
            </div>
            <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
              {apiHost ? (
                <img 
                  src={`${apiHost}/video_feed`} 
                  alt="Stream" 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1200";
                  }}
                />
              ) : (
                <div className="text-zinc-800 animate-pulse text-xs uppercase tracking-widest font-bold">Initializing Stream...</div>
              )}
              <div className="absolute top-4 left-4">
                <span className="bg-black/60 backdrop-blur-md border border-zinc-700 text-emerald-400 px-3 py-1 rounded text-[10px] font-bold tracking-widest uppercase">
                  AI DETECTION ACTIVE
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Controls & Logs */}
        <div className="col-span-12 xl:col-span-4 flex flex-col gap-6">
          {/* Action Card */}
          <div className={`border rounded-xl shadow-xl p-6 ${
            theme === "black" ? "bg-zinc-950 border-zinc-800" : "bg-white border-slate-200 shadow-sm"
          }`}>
            <button 
              onClick={captureFrame}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-12 rounded-lg transition-all shadow-lg shadow-emerald-600/20 active:scale-[0.98] flex items-center justify-center gap-3 text-xs tracking-widest"
            >
              <ImageIcon />
              KAREYİ KAYDET (CAPTURE)
            </button>
          </div>

          <div className={`flex-1 border rounded-xl shadow-xl overflow-hidden flex flex-col ${
            theme === "black" ? "bg-zinc-950 border-zinc-800" : "bg-white border-slate-200 shadow-sm"
          }`}>
            <div className={`p-6 border-b flex justify-between items-center ${theme === "black" ? "border-zinc-800/50 bg-zinc-900/30" : "border-slate-100 bg-slate-50/50"}`}>
              <div>
                <div className="flex items-center gap-2 text-sm font-medium uppercase tracking-wider mb-1">
                  <SettingsIcon />
                  <span>Manuel Kontroller</span>
                </div>
                <p className={`text-[11px] ${theme === "black" ? "text-zinc-500" : "text-slate-500"}`}>OAK-D donanım parametreleri</p>
              </div>
            </div>
            <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
              <div className="grid grid-cols-1 gap-4 overflow-y-auto pr-2 max-h-[400px]">
              {[
                { label: "Focus (Odak)", key: "focus", val: focus, set: setFocus, min: 0, max: 255, step: 5 },
                { label: "Pozlama (Exp)", key: "exp_time", val: exposure, set: setExposure, min: 1, max: 33000, step: 500, unit: " µs" },
                { label: "ISO", key: "iso", val: iso, set: setIso, min: 100, max: 1600, step: 50 },
                { label: "Parlaklık", key: "brightness", val: brightness, set: setBrightness, min: -10, max: 10, step: 1 },
                { label: "Kontrast", key: "contrast", val: contrast, set: setContrast, min: -10, max: 10, step: 1 },
                { label: "Doygunluk", key: "saturation", val: saturation, set: setSaturation, min: -10, max: 10, step: 1 },
                { label: "Keskinlik", key: "sharpness", val: sharpness, set: setSharpness, min: 0, max: 4, step: 1 }
              ].map((ctrl) => (
                <div key={ctrl.key} className="space-y-2">
                  <div className="flex justify-between text-[10px] font-medium">
                    <span className={`${theme === "black" ? "text-zinc-400" : "text-slate-600"} uppercase tracking-tighter`}>{ctrl.label}</span>
                    <span className={`${theme === "black" ? "text-blue-400" : "text-blue-600"} font-mono`}>{ctrl.val}{ctrl.unit}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => { const v = Math.max(ctrl.min, ctrl.val - ctrl.step); ctrl.set(v); updateControl(ctrl.key, v); }} 
                      className={`w-6 h-6 flex items-center justify-center rounded border transition-colors text-xs ${
                        theme === "black" ? "bg-zinc-900 border-zinc-700 hover:bg-zinc-800 text-zinc-300" : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-600"
                      }`}
                    >-</button>
                    <input 
                      type="range"
                      min={ctrl.min}
                      max={ctrl.max}
                      step={ctrl.step}
                      value={ctrl.val}
                      onChange={(e) => {
                        const v = parseInt(e.target.value);
                        ctrl.set(v);
                        updateControl(ctrl.key, v);
                      }}
                      className={`flex-1 h-1 rounded-lg appearance-none cursor-pointer accent-blue-500 ${
                        theme === "black" ? "bg-zinc-800" : "bg-slate-200"
                      }`}
                    />
                    <button 
                      onClick={() => { const v = Math.min(ctrl.max, ctrl.val + ctrl.step); ctrl.set(v); updateControl(ctrl.key, v); }} 
                      className={`w-6 h-6 flex items-center justify-center rounded border transition-colors text-xs ${
                        theme === "black" ? "bg-zinc-900 border-zinc-700 hover:bg-zinc-800 text-zinc-300" : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-600"
                      }`}
                    >+</button>
                  </div>
                </div>
              ))}
              </div>

              {/* Reset Button */}
              <button 
                onClick={async () => {
                  const defaults = { focus: 120, exp_time: 20000, iso: 500, brightness: 0, contrast: 0, saturation: 0, sharpness: 1 };
                  setFocus(defaults.focus); setExposure(defaults.exp_time); setIso(defaults.iso);
                  setBrightness(defaults.brightness); setContrast(defaults.contrast); setSaturation(defaults.saturation); setSharpness(defaults.sharpness);
                  if (apiHost) {
                    await fetch(`${apiHost}/control`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(defaults),
                    });
                  }
                  addLog("Ayarlar varsayılana döndürüldü", "info");
                }}
                className={`w-full py-2.5 rounded-lg border font-bold text-[10px] uppercase tracking-widest transition-all ${
                  (focus !== 120 || exposure !== 20000 || iso !== 500 || brightness !== 0 || contrast !== 0 || saturation !== 0 || sharpness !== 1)
                    ? "bg-amber-600 border-amber-500 text-white shadow-lg shadow-amber-900/20"
                    : (theme === "black" ? "bg-zinc-900 border-zinc-800 text-zinc-500 opacity-50" : "bg-slate-50 border-slate-200 text-slate-400 opacity-50")
                }`}
              >
                Ayarları Sıfırla
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
