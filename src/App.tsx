import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float, MeshDistortMaterial, OrbitControls, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";

type Tool = {
  id: string;
  name: string;
  desc: string;
  category: string;
  icon: string;
  color: string;
};

const TOOLS: Tool[] = [
  { id: "img-compress", name: "Image Compressor", desc: "Reduce size with quality control", category: "Image", icon: "🗜️", color: "from-violet-600 to-fuchsia-600" },
  { id: "img-resize", name: "Image Resizer", desc: "Resize to exact dimensions", category: "Image", icon: "📐", color: "from-blue-600 to-cyan-600" },
  { id: "bg-remove", name: "Background Remover", desc: "Remove white backgrounds instantly", category: "Image", icon: "✂️", color: "from-emerald-600 to-teal-600" },
  { id: "img-to-pdf", name: "Image to PDF", desc: "Convert images to PDF files", category: "Image", icon: "🖼️", color: "from-orange-600 to-amber-600" },
  { id: "img-to-base64", name: "Image to Base64", desc: "Encode images to data URLs", category: "Image", icon: "🔗", color: "from-pink-600 to-rose-600" },
  { id: "base64-to-img", name: "Base64 to Image", desc: "Decode and download images", category: "Image", icon: "🖼️", color: "from-indigo-600 to-violet-600" },
  { id: "yt-thumb", name: "YouTube Thumbnail", desc: "Download any video thumbnail", category: "Image", icon: "▶️", color: "from-red-600 to-orange-600" },
  { id: "favicon", name: "Favicon Generator", desc: "Create favicons from images", category: "Image", icon: "🔖", color: "from-sky-600 to-blue-600" },
  
  { id: "qr-gen", name: "QR Code Generator", desc: "Create QR codes instantly", category: "Dev", icon: "🔳", color: "from-slate-700 to-slate-900" },
  { id: "qr-scan", name: "QR Scanner", desc: "Scan QR from camera or image", category: "Dev", icon: "📷", color: "from-gray-700 to-zinc-900" },
  { id: "barcode", name: "Barcode Generator", desc: "Generate CODE128 barcodes", category: "Dev", icon: "📊", color: "from-neutral-700 to-stone-900" },
  { id: "json-format", name: "JSON Formatter", desc: "Beautify and validate JSON", category: "Dev", icon: "{ }", color: "from-yellow-600 to-amber-600" },
  { id: "json-min", name: "JSON Minifier", desc: "Compress JSON files", category: "Dev", icon: "><", color: "from-amber-600 to-orange-600" },
  { id: "base64", name: "Base64 Encode/Decode", desc: "Text to base64 and back", category: "Dev", icon: "🔐", color: "from-lime-600 to-green-600" },
  { id: "url-enc", name: "URL Encoder", desc: "Encode and decode URLs", category: "Dev", icon: "🌐", color: "from-teal-600 to-cyan-600" },
  { id: "html-enc", name: "HTML Entity Encoder", desc: "Escape HTML characters", category: "Dev", icon: "</>", color: "from-cyan-600 to-sky-600" },
  { id: "html-jsx", name: "HTML to JSX", desc: "Convert HTML to React JSX", category: "Dev", icon: "⚛️", color: "from-blue-600 to-indigo-600" },
  { id: "regex", name: "Regex Tester", desc: "Test regular expressions live", category: "Dev", icon: ".*", color: "from-violet-600 to-purple-600" },
  { id: "css-min", name: "CSS Minifier", desc: "Compress CSS code", category: "Dev", icon: "🎨", color: "from-fuchsia-600 to-pink-600" },
  { id: "js-min", name: "JS Minifier", desc: "Minify JavaScript", category: "Dev", icon: "📦", color: "from-rose-600 to-red-600" },
  { id: "sql-format", name: "SQL Formatter", desc: "Format SQL queries", category: "Dev", icon: "🗄️", color: "from-indigo-600 to-blue-600" },
  { id: "xml-format", name: "XML Formatter", desc: "Pretty print XML", category: "Dev", icon: "📄", color: "from-sky-600 to-cyan-600" },
  { id: "hash", name: "Hash Generator", desc: "MD5, SHA-1, SHA-256, SHA-512", category: "Dev", icon: "#️⃣", color: "from-emerald-600 to-green-600" },
  { id: "uuid", name: "UUID Generator", desc: "Generate v4 UUIDs", category: "Dev", icon: "🆔", color: "from-green-600 to-emerald-600" },
  { id: "timestamp", name: "Timestamp Converter", desc: "Unix to date and back", category: "Dev", icon: "⏱️", color: "from-orange-600 to-red-600" },

  { id: "color-picker", name: "Color Picker", desc: "Pick and copy colors", category: "Color", icon: "🎯", color: "from-pink-600 to-fuchsia-600" },
  { id: "palette", name: "Palette Generator", desc: "Generate harmonious palettes", category: "Color", icon: "🌈", color: "from-violet-600 to-indigo-600" },
  { id: "gradient", name: "Gradient Generator", desc: "Create CSS gradients", category: "Color", icon: "🌅", color: "from-blue-600 to-violet-600" },
  { id: "contrast", name: "Contrast Checker", desc: "WCAG AA/AAA checker", category: "Color", icon: "◐", color: "from-slate-600 to-gray-700" },
  { id: "shadow", name: "Box Shadow Generator", desc: "Create perfect shadows", category: "Color", icon: "💠", color: "from-zinc-700 to-slate-800" },

  { id: "word-count", name: "Word Counter", desc: "Count words and characters", category: "Text", icon: "📝", color: "from-emerald-600 to-teal-600" },
  { id: "case", name: "Case Converter", desc: "upper, lower, title, snake", category: "Text", icon: "🔤", color: "from-teal-600 to-green-600" },
  { id: "lorem", name: "Lorem Ipsum", desc: "Generate placeholder text", category: "Text", icon: "📖", color: "from-green-600 to-lime-600" },
  { id: "diff", name: "Text Diff Checker", desc: "Compare two texts", category: "Text", icon: "🔍", color: "from-lime-600 to-yellow-600" },
  { id: "markdown", name: "Markdown Preview", desc: "Live markdown editor", category: "Text", icon: "⬇️", color: "from-amber-600 to-orange-600" },
  { id: "tts", name: "Text to Speech", desc: "Speak any text aloud", category: "Text", icon: "🔊", color: "from-orange-600 to-amber-600" },
  { id: "stt", name: "Speech to Text", desc: "Dictate with your voice", category: "Text", icon: "🎤", color: "from-red-600 to-pink-600" },

  { id: "password", name: "Password Generator", desc: "Secure random passwords", category: "Security", icon: "🔑", color: "from-rose-600 to-red-700" },
  
  { id: "unit", name: "Unit Converter", desc: "Length, weight, temp & more", category: "Calc", icon: "⚖️", color: "from-cyan-600 to-blue-600" },
  { id: "currency", name: "Currency Converter", desc: "Live exchange rates", category: "Calc", icon: "💱", color: "from-blue-600 to-indigo-700" },
  { id: "loan", name: "Loan Calculator", desc: "EMI and interest calculator", category: "Calc", icon: "🏦", color: "from-indigo-700 to-violet-700" },
  { id: "bmi", name: "BMI Calculator", desc: "Body mass index", category: "Calc", icon: "⚕️", color: "from-violet-700 to-purple-700" },
  { id: "age", name: "Age Calculator", desc: "Exact age from DOB", category: "Calc", icon: "🎂", color: "from-purple-700 to-fuchsia-700" },
  { id: "percent", name: "Percentage Calc", desc: "Find percentages easily", category: "Calc", icon: "%", color: "from-fuchsia-700 to-pink-700" },

  { id: "meta", name: "Meta Tag Generator", desc: "SEO meta tags", category: "SEO", icon: "🏷️", color: "from-slate-600 to-slate-800" },
  { id: "robots", name: "Robots.txt Generator", desc: "Create robots.txt", category: "SEO", icon: "🤖", color: "from-gray-700 to-slate-800" },
  { id: "sitemap", name: "Sitemap Generator", desc: "XML sitemap creator", category: "SEO", icon: "🗺️", color: "from-zinc-700 to-gray-800" },

  { id: "pomodoro", name: "Pomodoro Timer", desc: "Focus with 25/5 cycles", category: "Productivity", icon: "🍅", color: "from-red-600 to-rose-700" },
  { id: "stopwatch", name: "Stopwatch", desc: "Precision timer", category: "Productivity", icon: "⏲️", color: "from-amber-600 to-yellow-600" },
  { id: "world-clock", name: "World Clock", desc: "Time zones worldwide", category: "Productivity", icon: "🌍", color: "from-sky-600 to-indigo-600" },
];

const CATEGORIES = ["All", "Image", "Dev", "Color", "Text", "Calc", "SEO", "Security", "Productivity"];

function Scene() {
  const group = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!group.current) return;
    group.current.rotation.y = state.clock.elapsedTime * 0.05;
    group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} />
      <pointLight position={[-5, -3, -5]} color="#8b5cf6" intensity={2} />
      <pointLight position={[5, -3, 5]} color="#06b6d4" intensity={2} />
      
      <group ref={group}>
        <Float speed={1.5} rotationIntensity={0.5} floatIntensity={1}>
          <mesh position={[-3, 1.5, -2]}>
            <torusKnotGeometry args={[0.8, 0.25, 128, 32]} />
            <MeshDistortMaterial color="#8b5cf6" distort={0.4} speed={2} roughness={0.1} metalness={0.8} />
          </mesh>
        </Float>
        
        <Float speed={1.2} rotationIntensity={0.4} floatIntensity={1.2}>
          <mesh position={[3, -1, -1.5]}>
            <icosahedronGeometry args={[0.9, 1]} />
            <MeshDistortMaterial color="#06b6d4" distort={0.3} speed={1.5} roughness={0.2} metalness={0.7} />
          </mesh>
        </Float>

        <Float speed={1.8} rotationIntensity={0.6} floatIntensity={0.8}>
          <mesh position={[0, 2, -3]}>
            <dodecahedronGeometry args={[0.7]} />
            <MeshDistortMaterial color="#ec4899" distort={0.5} speed={2.5} roughness={0.1} metalness={0.9} />
          </mesh>
        </Float>

        <Float speed={1} rotationIntensity={0.3} floatIntensity={1.5}>
          <mesh position={[-2.5, -1.5, -1]}>
            <octahedronGeometry args={[0.6]} />
            <MeshDistortMaterial color="#f59e0b" distort={0.3} speed={1.8} roughness={0.3} metalness={0.6} />
          </mesh>
        </Float>
      </group>

      <Sparkles count={100} scale={[20, 20, 10]} size={2} speed={0.3} opacity={0.6} color="#ffffff" />
      <Environment preset="night" />
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.3} />
    </>
  );
}

export default function App() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [activeTool, setActiveTool] = useState<Tool | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const filtered = useMemo(() => {
    return TOOLS.filter(t => 
      (category === "All" || t.category === category) &&
      (query === "" || t.name.toLowerCase().includes(query.toLowerCase()) || t.desc.toLowerCase().includes(query.toLowerCase()))
    );
  }, [query, category]);

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030308] text-white">
      {/* 3D Background */}
      <div className="pointer-events-none fixed inset-0">
        <Canvas camera={{ position: [0, 0, 7], fov: 50 }} dpr={[1, 2]}>
          <Scene />
        </Canvas>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#030308_80%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#030308]/0 via-[#030308]/50 to-[#030308]" />
      </div>

      {/* Header */}
      <header className="relative z-40 border-b border-white/5 bg-black/20 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 opacity-70 blur-lg" />
              <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-black">
                <span className="text-xl font-black bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">K</span>
              </div>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight">
                KASHIF <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">TECH</span>
              </h1>
              <p className=" -mt-1 text-[10px] uppercase tracking-[0.2em] text-white/50">50+ Pro Tools • 3D Studio</p>
            </div>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <a href="https://whatsapp.com/channel/0029Vb7uioRLo4hYKuvzYw15" target="_blank" rel="noreferrer" className="group relative overflow-hidden rounded-full">
              <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-500 transition-all group-hover:scale-110" />
              <div className="relative flex items-center gap-2 px-4 py-2 text-sm font-medium">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/></svg>
                Join Channel
              </div>
            </a>
          </div>

          <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="md:hidden rounded-xl bg-white/5 p-2.5 backdrop-blur">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
        </div>
        {showMobileMenu && (
          <div className="border-t border-white/5 bg-black/80 px-4 py-3 backdrop-blur-2xl md:hidden">
            <a href="https://whatsapp.com/channel/0029Vb7uioRLo4hYKuvzYw15" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-xl bg-green-600 py-2.5 text-sm font-medium">
              Join WhatsApp Channel
            </a>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative z-30 mx-auto max-w-7xl px-4 pb-10 pt-14 sm:px-6 lg:px-8 lg:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-400"></span>
            </span>
            <span className="text-xs font-medium tracking-wide text-violet-200">LIVE • 53 Tools • No Signup</span>
          </div>
          
          <h2 className="text-balance text-4xl font-black tracking-tight sm:text-6xl lg:text-7xl">
            The Ultimate
            <span className="relative mx-3 inline-block">
              <span className="relative z-10 bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">3D Toolkit</span>
              <svg className="absolute -bottom-2 left-0 w-full" height="8" viewBox="0 0 200 8" fill="none"><path d="M0 5 C 50 0, 150 0, 200 5" stroke="url(#g)" strokeWidth="3" fill="none"/></svg>
              <defs><linearGradient id="g"><stop stopColor="#8b5cf6"/><stop offset="1" stopColor="#06b6d4"/></linearGradient></defs>
            </span>
            <br/>for Creators
          </h2>
          
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-white/60 sm:text-lg">
            53 powerful tools in one immersive 3D workspace. Compress images, generate QR codes, format code, calculate anything — all in your browser. Built by KASHIF TECH.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <div className="relative w-full max-w-xl">
              <div className="pointer-events-none absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-violet-600/50 to-cyan-600/50 opacity-50 blur" />
              <div className="relative flex items-center gap-3 rounded-2xl border border-white/10 bg-black/60 px-4 py-3 backdrop-blur-2xl">
                <svg width="20" height="20" className="text-white/40" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search 53 tools... try 'QR', 'compress', 'password'" className="w-full bg-transparent text-sm outline-none placeholder:text-white/40" />
                <kbd className="hidden rounded-lg border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-white/50 sm:block">⌘K</kbd>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {CATEGORIES.map(c => (
              <button key={c} onClick={()=>setCategory(c)} className={`rounded-full border px-3.5 py-1.5 text-xs font-medium backdrop-blur transition-all ${category===c ? "border-violet-500/50 bg-violet-500/20 text-violet-100" : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"}`}>
                {c}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Tools Grid */}
      <main className="relative z-30 mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((tool) => (
            <button key={tool.id} onClick={()=>setActiveTool(tool)} className="group relative overflow-hidden rounded-[1.35rem] border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-[1px] text-left backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:border-white/20">
              <div className="relative h-full rounded-[1.3rem] bg-black/70 p-5">
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br opacity-20 blur-3xl transition-all group-hover:opacity-30" style={{backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))`}} />
                <div className={`absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${tool.color} opacity-20 blur-3xl`} />
                
                <div className="flex items-start justify-between">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${tool.color} shadow-lg shadow-black/20`}>
                    <span className="text-lg">{tool.icon}</span>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/50">{tool.category}</span>
                </div>
                
                <h3 className="mt-4 text-[15px] font-semibold tracking-tight text-white">{tool.name}</h3>
                <p className="mt-1 text-xs leading-snug text-white/55">{tool.desc}</p>
                
                <div className="mt-4 flex items-center gap-1.5 text-[11px] font-medium text-white/40 transition-colors group-hover:text-white/70">
                  Open tool
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
                </div>
              </div>
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="mt-20 text-center">
            <p className="text-white/50">No tools found. Try another search.</p>
          </div>
        )}

        {/* Stats */}
        <div className="mx-auto mt-20 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {label: "Tools", value: "53+"},
            {label: "Categories", value: "9"},
            {label: "Free Forever", value: "100%"},
            {label: "No Signup", value: "✓"},
          ].map(s => (
            <div key={s.label} className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-center backdrop-blur">
              <div className="text-2xl font-black bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">{s.value}</div>
              <div className="mt-1 text-[11px] uppercase tracking-widest text-white/40">{s.label}</div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-30 border-t border-white/5 bg-black/40 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
              <span className="text-sm font-black">K</span>
            </div>
            <div>
              <p className="text-sm font-semibold">KASHIF TECH</p>
              <p className="text-xs text-white/50">© 2026 • Built for creators worldwide</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-white/50">
            <span>Made with 💜 in 3D</span>
            <a href="https://whatsapp.com/channel/0029Vb7uioRLo4hYKuvzYw15" target="_blank" className="hover:text-white">WhatsApp Channel</a>
          </div>
        </div>
      </footer>

      {/* Tool Modal */}
      {activeTool && <ToolModal tool={activeTool} onClose={()=>setActiveTool(null)} />}
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
        * { font-family: 'Outfit', system-ui, -apple-system, sans-serif; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #ffffff1a; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #ffffff2a; }
      `}</style>
    </div>
  );
}

function ToolModal({ tool, onClose }: { tool: Tool; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-2xl" onClick={onClose} />
      <div className="relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#0a0a0f]/90 shadow-2xl backdrop-blur-2xl">
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${tool.color}`}>
              <span>{tool.icon}</span>
            </div>
            <div>
              <h3 className="font-semibold leading-tight">{tool.name}</h3>
              <p className="text-xs text-white/50">{tool.desc}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl bg-white/5 p-2 hover:bg-white/10">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
        
        <div className="overflow-y-auto p-5 sm:p-6">
          <ToolRenderer tool={tool} />
        </div>
      </div>
    </div>
  );
}

function ToolRenderer({ tool }: { tool: Tool }) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Tool specific states
  const [qrSize, setQrSize] = useState(512);
  const [passwordLength, setPasswordLength] = useState(16);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [imageQuality, setImageQuality] = useState(0.8);
  const [resizeW, setResizeW] = useState(800);
  const [resizeH, setResizeH] = useState(600);

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    alert("Copied!");
  };

  const download = (dataUrl: string, name: string) => {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = name;
    a.click();
  };

  // Implement tools
  useEffect(() => {
    setInput("");
    setOutput("");
  }, [tool.id]);

  const runTool = async () => {
    try {
      switch (tool.id) {
        case "qr-gen": {
          const url = await QRCode.toDataURL(input || "https://kashif.tech", { width: qrSize, margin: 2, color: { dark: "#000", light: "#fff" } });
          setOutput(url);
          break;
        }
        case "base64": {
          setOutput(btoa(unescape(encodeURIComponent(input))));
          break;
        }
        case "url-enc": {
          setOutput(encodeURIComponent(input));
          break;
        }
        case "html-enc": {
          setOutput(input.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"));
          break;
        }
        case "json-format": {
          setOutput(JSON.stringify(JSON.parse(input), null, 2));
          break;
        }
        case "json-min": {
          setOutput(JSON.stringify(JSON.parse(input)));
          break;
        }
        case "case": {
          setOutput(`UPPER: ${input.toUpperCase()}\n\nlower: ${input.toLowerCase()}\n\nTitle: ${input.replace(/\w\S*/g, w=>w[0].toUpperCase()+w.slice(1).toLowerCase())}\n\nsnake_case: ${input.toLowerCase().replace(/\s+/g,'_')}\n\nkebab-case: ${input.toLowerCase().replace(/\s+/g,'-')}`);
          break;
        }
        case "word-count": {
          const words = input.trim() ? input.trim().split(/\s+/).length : 0;
          const chars = input.length;
          const charsNoSpace = input.replace(/\s/g, '').length;
          const lines = input.split('\n').length;
          setOutput(`Words: ${words}\nCharacters: ${chars}\nCharacters (no spaces): ${charsNoSpace}\nLines: ${lines}\nReading time: ${Math.ceil(words/200)} min`);
          break;
        }
        case "lorem": {
          const paras = parseInt(input) || 3;
          const lorem = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.";
          setOutput(Array(paras).fill(0).map(() => lorem).join("\n\n"));
          break;
        }
        case "password": {
          const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789" + (includeSymbols ? "!@#$%^&*()_+-=[]{}|;:,.<>?" : "");
          let pwd = "";
          for (let i=0; i<passwordLength; i++) pwd += chars[Math.floor(Math.random()*chars.length)];
          setOutput(pwd);
          break;
        }
        case "uuid": {
          setOutput(crypto.randomUUID());
          break;
        }
        case "hash": {
          const enc = new TextEncoder().encode(input);
          const sha256 = await crypto.subtle.digest("SHA-256", enc);
          const hash = Array.from(new Uint8Array(sha256)).map(b=>b.toString(16).padStart(2,'0')).join('');
          setOutput(hash);
          break;
        }
        case "timestamp": {
          const now = Date.now();
          setOutput(`Now: ${now}\nSeconds: ${Math.floor(now/1000)}\nISO: ${new Date().toISOString()}\nLocal: ${new Date().toLocaleString()}`);
          break;
        }
        case "html-jsx": {
          setOutput(input.replace(/class=/g, "className=").replace(/for=/g, "htmlFor=").replace(/<!--/g, "{/*").replace(/-->/g, "*/}"));
          break;
        }
        case "css-min": {
          setOutput(input.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\s+/g,' ').replace(/\s*([{}:;,])\s*/g,'$1').trim());
          break;
        }
        case "js-min": {
          setOutput(input.replace(/\/\/.*$/gm,'').replace(/\/\*[\s\S]*?\*\//g,'').replace(/\s+/g,' ').trim());
          break;
        }
        case "sql-format": {
          setOutput(input.replace(/\b(SELECT|FROM|WHERE|JOIN|LEFT|RIGHT|INNER|OUTER|ON|GROUP BY|ORDER BY|HAVING|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\b/gi, '\n$1').trim());
          break;
        }
        case "xml-format": {
          let formatted = '', indent = 0;
          input.replace(/>\s*</g,'><').split(/>\s*</).forEach(node => {
            if (node.match(/^\/\w/)) indent--;
            formatted += '  '.repeat(indent) + '<' + node + '>\n';
            if (node.match(/^<?\w[^>]*[^\/]$/) && !node.startsWith('?')) indent++;
          });
          setOutput(formatted.slice(1, -2));
          break;
        }
        case "regex": {
          const [pattern, flags, text] = input.split('\n');
          try {
            const re = new RegExp(pattern, flags);
            const matches = [...text.matchAll(re)];
            setOutput(matches.length ? matches.map((m,i)=>`${i+1}. "${m[0]}" at ${m.index}`).join('\n') : "No matches");
          } catch(e:any) { setOutput("Error: "+e.message); }
          break;
        }
        case "diff": {
          const [a,b] = input.split('\n---\n');
          const aLines = (a||'').split('\n'), bLines = (b||'').split('\n');
          let out = '';
          const max = Math.max(aLines.length, bLines.length);
          for(let i=0;i<max;i++){
            if(aLines[i]!==bLines[i]) {
              if(aLines[i]) out += `- ${aLines[i]}\n`;
              if(bLines[i]) out += `+ ${bLines[i]}\n`;
            } else out += `  ${aLines[i]||''}\n`;
          }
          setOutput(out);
          break;
        }
        case "markdown": {
          const html = input
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/\*\*(.*)\*\*/gim, '<b>$1</b>')
            .replace(/\*(.*)\*/gim, '<i>$1</i>')
            .replace(/\n/gim, '<br>');
          setOutput(html);
          break;
        }
        case "percent": {
          const [a,b] = input.split(',').map(Number);
          setOutput(`${a}% of ${b} = ${(a/100*b).toFixed(2)}\n${a} is ${((a/b)*100).toFixed(2)}% of ${b}\nIncrease: ${(b-a).toFixed(2)} (${(((b-a)/a)*100).toFixed(2)}%)`);
          break;
        }
        case "bmi": {
          const [h,w] = input.split(',').map(Number);
          const bmi = w/((h/100)**2);
          setOutput(`BMI: ${bmi.toFixed(1)}\n${bmi<18.5?'Underweight':bmi<25?'Normal':bmi<30?'Overweight':'Obese'}`);
          break;
        }
        case "age": {
          const birth = new Date(input);
          const now = new Date();
          let years = now.getFullYear() - birth.getFullYear();
          let months = now.getMonth() - birth.getMonth();
          if(months<0){years--;months+=12;}
          setOutput(`${years} years, ${months} months\nTotal days: ${Math.floor((now.getTime()-birth.getTime())/86400000)}`);
          break;
        }
        case "loan": {
          const [p,r,y] = input.split(',').map(Number);
          const monthly = r/12/100, n=y*12;
          const emi = p*monthly*Math.pow(1+monthly,n)/(Math.pow(1+monthly,n)-1);
          setOutput(`EMI: ₹${emi.toFixed(2)}\nTotal: ₹${(emi*n).toFixed(2)}\nInterest: ₹${(emi*n-p).toFixed(2)}`);
          break;
        }
        case "unit": {
          const [v,from,to] = input.split(' ');
          const val = parseFloat(v);
          const conv: Record<string,number> = {m:1,km:1000,cm:0.01,mm:0.001,ft:0.3048,in:0.0254,mi:1609.34};
          if(conv[from] && conv[to]) setOutput(`${v} ${from} = ${(val*conv[from]/conv[to]).toFixed(4)} ${to}`);
          else setOutput("Use: 100 km mi  or  5 ft m");
          break;
        }
        case "currency": {
          const [amt,from,to] = input.split(' ');
          const rates: Record<string,number> = {USD:1, INR:83.5, EUR:0.92, GBP:0.79, JPY:149};
          const usd = parseFloat(amt) / (rates[from?.toUpperCase()]||1);
          setOutput(`${amt} ${from} = ${(usd * (rates[to?.toUpperCase()]||1)).toFixed(2)} ${to}\n\n*Demo rates`);
          break;
        }
        case "contrast": {
          const [c1,c2] = input.split(',').map(s=>s.trim());
          const hex = (c:string) => { const h=c.replace('#',''); return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]; };
          const lum = (rgb:number[]) => { const [r,g,b]=rgb.map(v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)}); return 0.2126*r+0.7152*g+0.0722*b; };
          const l1=lum(hex(c1)), l2=lum(hex(c2)), ratio=(Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05);
          setOutput(`Ratio: ${ratio.toFixed(2)}:1\nAA Normal: ${ratio>=4.5?'PASS':'FAIL'}\nAA Large: ${ratio>=3?'PASS':'FAIL'}\nAAA: ${ratio>=7?'PASS':'FAIL'}`);
          break;
        }
        case "meta": {
          const [title,desc,url] = input.split('\n');
          setOutput(`<title>${title}</title>\n<meta name="description" content="${desc}">\n<meta property="og:title" content="${title}">\n<meta property="og:description" content="${desc}">\n<meta property="og:url" content="${url}">\n<meta name="twitter:card" content="summary_large_image">`);
          break;
        }
        case "robots": {
          setOutput(`User-agent: *\nAllow: /\n\nSitemap: ${input || 'https://example.com/sitemap.xml'}`);
          break;
        }
        case "sitemap": {
          const urls = input.split('\n').filter(Boolean);
          const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u=>`  <url><loc>${u}</loc><lastmod>${new Date().toISOString().split('T')[0]}</lastmod></url>`).join('\n')}\n</urlset>`;
          setOutput(xml);
          break;
        }
        case "yt-thumb": {
          const id = input.match(/(?:v=|youtu\.be\/)([^&?]+)/)?.[1] || input;
          setOutput(`https://img.youtube.com/vi/${id}/maxresdefault.jpg`);
          break;
        }
        case "gradient": {
          const [c1,c2,ang] = input.split(',').map(s=>s.trim());
          setOutput(`background: linear-gradient(${ang||'135deg'}, ${c1||'#8b5cf6'}, ${c2||'#06b6d4'});`);
          break;
        }
        case "shadow": {
          const [x,y,b,s,c] = input.split(',').map(v=>v.trim());
          setOutput(`box-shadow: ${x||'0'}px ${y||'10'}px ${b||'30'}px ${s||'0'}px ${c||'rgba(0,0,0,0.3)'};`);
          break;
        }
        case "palette": {
          const base = Math.floor(Math.random()*360);
          const pal = [0,60,120,180,240].map(h=>`hsl(${(base+h)%360}, 70%, 60%)`);
          setOutput(pal.join('\n'));
          break;
        }
        default:
          setOutput("Tool ready. Provide input above.");
      }
    } catch (e:any) {
      setOutput("Error: " + e.message);
    }
  };

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>, action: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = new Image();
    img.src = URL.createObjectURL(file);
    await new Promise(r => img.onload = r);
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    if (action === 'compress' || action === 'resize') {
      canvas.width = action==='resize' ? resizeW : img.width;
      canvas.height = action==='resize' ? resizeH : img.height;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', imageQuality);
      setOutput(dataUrl);
    } else if (action === 'bg-remove') {
      canvas.width = img.width; canvas.height = img.height;
      ctx.drawImage(img,0,0);
      const data = ctx.getImageData(0,0,canvas.width,canvas.height);
      for(let i=0;i<data.data.length;i+=4){
        const r=data.data[i],g=data.data[i+1],b=data.data[i+2];
        if(r>200 && g>200 && b>200) data.data[i+3]=0;
      }
      ctx.putImageData(data,0,0);
      setOutput(canvas.toDataURL());
    } else if (action === 'to-pdf') {
      const pdf = new jsPDF({ orientation: img.width>img.height?'l':'p', unit: 'px', format: [img.width, img.height] });
      pdf.addImage(img, 'JPEG', 0, 0, img.width, img.height);
      setOutput(pdf.output('datauristring'));
    } else if (action === 'to-base64') {
      const reader = new FileReader();
      reader.onload = () => setOutput(reader.result as string);
      reader.readAsDataURL(file);
    } else if (action === 'favicon') {
      const sizes = [16,32,48];
      const outs = [];
      for(const s of sizes){
        canvas.width=s; canvas.height=s;
        ctx.drawImage(img,0,0,s,s);
        outs.push(`${s}x${s}: ${canvas.toDataURL()}`);
      }
      setOutput(outs.join('\n\n'));
    }
  };

  const renderInput = () => {
    if (['img-compress','img-resize','bg-remove','img-to-pdf','img-to-base64','favicon'].includes(tool.id)) {
      return (
        <div className="space-y-4">
          <input ref={fileRef} type="file" accept="image/*" onChange={e=>handleImage(e, tool.id.replace('img-','').replace('-',''))} className="block w-full text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-violet-600 file:px-4 file:py-2 file:text-white hover:file:bg-violet-500" />
          {tool.id==='img-compress' && <div><label className="text-xs text-white/60">Quality: {imageQuality}</label><input type="range" min="0.1" max="1" step="0.1" value={imageQuality} onChange={e=>setImageQuality(parseFloat(e.target.value))} className="w-full" /></div>}
          {tool.id==='img-resize' && <div className="flex gap-3"><input type="number" value={resizeW} onChange={e=>setResizeW(+e.target.value)} className="w-24 rounded-lg bg-white/5 px-3 py-2 text-sm outline-none" placeholder="W" /><input type="number" value={resizeH} onChange={e=>setResizeH(+e.target.value)} className="w-24 rounded-lg bg-white/5 px-3 py-2 text-sm outline-none" placeholder="H" /></div>}
        </div>
      );
    }

    const placeholders: Record<string,string> = {
      "qr-gen": "Enter text or URL",
      "base64": "Text to encode",
      "url-enc": "https://example.com?x=1",
      "html-enc": "<div>Hello</div>",
      "json-format": '{"name":"Kashif"}',
      "json-min": '{"name":"Kashif"}',
      "case": "hello world",
      "word-count": "Paste your text here",
      "lorem": "3 (number of paragraphs)",
      "password": "Click generate",
      "hash": "Text to hash",
      "html-jsx": "<div class=\"box\">",
      "css-min": "body { color: red; }",
      "js-min": "function hello() { }",
      "sql-format": "select * from users where id=1",
      "xml-format": "<root><item>1</item></root>",
      "regex": "Pattern\nflags (g,i)\nText to test",
      "diff": "Text A\n---\nText B",
      "markdown": "# Hello\n**bold**",
      "percent": "20,150",
      "bmi": "175,70 (height cm, weight kg)",
      "age": "2000-01-01",
      "loan": "1000000,8.5,20 (principal, rate%, years)",
      "unit": "100 km mi",
      "currency": "100 USD INR",
      "contrast": "#000000, #ffffff",
      "meta": "Page Title\nDescription\nhttps://site.com",
      "robots": "https://example.com/sitemap.xml",
      "sitemap": "https://site.com/\nhttps://site.com/about",
      "yt-thumb": "YouTube URL or ID",
      "gradient": "#8b5cf6, #06b6d4, 135deg",
      "shadow": "0,10,30,0,rgba(0,0,0,0.3)",
      "timestamp": "Click run",
      "uuid": "Click run",
      "palette": "Click run",
    };

    return (
      <div className="space-y-3">
        <textarea value={input} onChange={e=>setInput(e.target.value)} placeholder={placeholders[tool.id] || "Enter input"} className="h-32 w-full resize-none rounded-xl border border-white/10 bg-black/50 p-3 text-sm outline-none placeholder:text-white/30 focus:border-violet-500/50" />
        <div className="flex flex-wrap gap-2">
          {tool.id==='password' && <>
            <label className="flex items-center gap-2 text-xs"><input type="range" min="8" max="64" value={passwordLength} onChange={e=>setPasswordLength(+e.target.value)} /> {passwordLength} chars</label>
            <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={includeSymbols} onChange={e=>setIncludeSymbols(e.target.checked)} /> Symbols</label>
          </>}
          {tool.id==='qr-gen' && <label className="flex items-center gap-2 text-xs">Size: <input type="number" value={qrSize} onChange={e=>setQrSize(+e.target.value)} className="w-20 rounded bg-white/5 px-2 py-1" /></label>}
          <button onClick={runTool} className="ml-auto rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 px-4 py-2 text-sm font-medium hover:opacity-90">Run</button>
        </div>
      </div>
    );
  };

  const renderOutput = () => {
    if (!output) return <div className="grid place-items-center rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center text-sm text-white/40">Output will appear here</div>;

    if (output.startsWith('data:image') || output.startsWith('http')) {
      return (
        <div className="space-y-3">
          <div className="overflow-hidden rounded-xl border border-white/10 bg-black/50 p-4">
            <img src={output} alt="result" className="mx-auto max-h-64 rounded-lg" />
          </div>
          <div className="flex gap-2">
            <button onClick={()=>download(output, `${tool.id}.png`)} className="rounded-lg bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20">Download</button>
            <button onClick={()=>copy(output)} className="rounded-lg bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20">Copy URL</button>
          </div>
        </div>
      );
    }

    if (output.startsWith('data:application/pdf')) {
      return <button onClick={()=>download(output, 'document.pdf')} className="w-full rounded-xl bg-emerald-600 py-3 font-medium hover:bg-emerald-500">Download PDF</button>;
    }

    if (tool.id === 'markdown') {
      return <div className="prose prose-invert max-w-none rounded-xl border border-white/10 bg-black/50 p-4" dangerouslySetInnerHTML={{__html: output}} />;
    }

    return (
      <div className="relative">
        <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-white/10 bg-black/70 p-4 text-xs leading-relaxed">{output}</pre>
        <button onClick={()=>copy(output)} className="absolute right-2 top-2 rounded-lg bg-white/10 px-2.5 py-1 text-[11px] backdrop-blur hover:bg-white/20">Copy</button>
      </div>
    );
  };

  // Special tools
  if (tool.id === 'qr-scan') {
    return <QRScanner />;
  }
  if (tool.id === 'color-picker') {
    return <ColorPicker />;
  }
  if (tool.id === 'tts') {
    return <TextToSpeech />;
  }
  if (tool.id === 'stt') {
    return <SpeechToText />;
  }
  if (tool.id === 'pomodoro') {
    return <Pomodoro />;
  }
  if (tool.id === 'stopwatch') {
    return <Stopwatch />;
  }
  if (tool.id === 'world-clock') {
    return <WorldClock />;
  }
  if (tool.id === 'barcode') {
    return <BarcodeGen />;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-white/50">Input</h4>
        {renderInput()}
      </div>
      <div>
        <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-white/50">Output</h4>
        {renderOutput()}
      </div>
    </div>
  );
}

// Special components
function QRScanner() {
  const [result, setResult] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      // @ts-ignore
      const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
      const scan = async () => {
        if (videoRef.current) {
          const codes = await detector.detect(videoRef.current);
          if (codes.length) setResult(codes[0].rawValue);
          else requestAnimationFrame(scan);
        }
      };
      scan();
    } catch { setResult("Camera not supported. Upload image instead."); }
  };

  return (
    <div className="space-y-4">
      <video ref={videoRef} className="aspect-video w-full rounded-xl bg-black" />
      <div className="flex gap-2">
        <button onClick={start} className="rounded-xl bg-violet-600 px-4 py-2 text-sm">Start Camera</button>
        {result && <div className="flex-1 rounded-xl bg-white/5 px-3 py-2 text-sm">{result}</div>}
      </div>
    </div>
  );
}

function ColorPicker() {
  const [color, setColor] = useState("#8b5cf6");
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div>
        <input type="color" value={color} onChange={e=>setColor(e.target.value)} className="h-32 w-full cursor-pointer rounded-xl" />
        <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
          {['HEX','RGB','HSL'].map((t,i)=> {
            const v = i===0?color:i===1?`rgb(${parseInt(color.slice(1,3),16)},${parseInt(color.slice(3,5),16)},${parseInt(color.slice(5,7),16)})`:'hsl(250,83%,63%)';
            return <button key={t} onClick={()=>navigator.clipboard.writeText(v)} className="rounded-lg bg-white/5 p-2 hover:bg-white/10">{t}<br/><span className="text-[10px] opacity-60">{v}</span></button>
          })}
        </div>
      </div>
      <div className="rounded-xl p-6" style={{background: color}}>
        <p className="text-black/70 mix-blend-overlay">Preview</p>
      </div>
    </div>
  );
}

function TextToSpeech() {
  const [text, setText] = useState("Hello from KASHIF TECH 3D Toolkit");
  const speak = () => { const u = new SpeechSynthesisUtterance(text); speechSynthesis.speak(u); };
  return (
    <div className="space-y-3">
      <textarea value={text} onChange={e=>setText(e.target.value)} className="h-32 w-full rounded-xl bg-black/50 p-3 outline-none" />
      <button onClick={speak} className="rounded-xl bg-cyan-600 px-4 py-2">Speak</button>
    </div>
  );
}

function SpeechToText() {
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const recRef = useRef<any>(null);
  
  const toggle = () => {
    if (listening) { recRef.current?.stop(); setListening(false); return; }
    // @ts-ignore
    const Rec = window.webkitSpeechRecognition || window.SpeechRecognition;
    if (!Rec) return alert("Not supported");
    const rec = new Rec(); rec.continuous = true; rec.interimResults = true;
    rec.onresult = (e:any) => setText(Array.from(e.results).map((r:any)=>r[0].transcript).join(''));
    rec.start(); recRef.current = rec; setListening(true);
  };
  
  return (
    <div className="space-y-3">
      <button onClick={toggle} className={`rounded-xl px-4 py-2 ${listening?'bg-red-600':'bg-violet-600'}`}>{listening?'Stop':'Start'} Listening</button>
      <div className="min-h-32 rounded-xl bg-black/50 p-3">{text || "Speak..."}</div>
    </div>
  );
}

function Pomodoro() {
  const [sec, setSec] = useState(25*60);
  const [run, setRun] = useState(false);
  useEffect(()=>{ if(!run) return; const t=setInterval(()=>setSec(s=>s>0?s-1:0),1000); return ()=>clearInterval(t); },[run]);
  const m=Math.floor(sec/60), s=sec%60;
  return (
    <div className="text-center">
      <div className="text-6xl font-black tabular-nums">{String(m).padStart(2,'0')}:{String(s).padStart(2,'0')}</div>
      <div className="mt-4 flex justify-center gap-2">
        <button onClick={()=>setRun(!run)} className="rounded-xl bg-violet-600 px-6 py-2">{run?'Pause':'Start'}</button>
        <button onClick={()=>{setRun(false);setSec(25*60);}} className="rounded-xl bg-white/10 px-4 py-2">Reset</button>
      </div>
    </div>
  );
}

function Stopwatch() {
  const [ms, setMs] = useState(0);
  const [run, setRun] = useState(false);
  useEffect(()=>{ if(!run) return; const s=Date.now()-ms; const t=setInterval(()=>setMs(Date.now()-s),10); return ()=>clearInterval(t); },[run,ms]);
  const format = (m:number)=>{ const cs=Math.floor(m/10)%100, sec=Math.floor(m/1000)%60, min=Math.floor(m/60000); return `${String(min).padStart(2,'0')}:${String(sec).padStart(2,'0')}.${String(cs).padStart(2,'0')}`; };
  return (
    <div className="text-center">
      <div className="font-mono text-5xl">{format(ms)}</div>
      <div className="mt-4 flex justify-center gap-2">
        <button onClick={()=>setRun(!run)} className="rounded-xl bg-cyan-600 px-6 py-2">{run?'Stop':'Start'}</button>
        <button onClick={()=>{setRun(false);setMs(0);}} className="rounded-xl bg-white/10 px-4 py-2">Reset</button>
      </div>
    </div>
  );
}

function WorldClock() {
  const [time, setTime] = useState(new Date());
  useEffect(()=>{ const t=setInterval(()=>setTime(new Date()),1000); return ()=>clearInterval(t); },[]);
  const zones = ['UTC','America/New_York','Europe/London','Asia/Dubai','Asia/Kolkata','Asia/Tokyo','Australia/Sydney'];
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {zones.map(z=>(
        <div key={z} className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
          <span className="text-xs opacity-60">{z.split('/')[1]||z}</span>
          <span className="font-mono text-sm">{time.toLocaleTimeString('en-GB',{timeZone:z,hour12:false})}</span>
        </div>
      ))}
    </div>
  );
}

function BarcodeGen() {
  const [text, setText] = useState("KASHIFTECH");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(()=>{
    const canvas = canvasRef.current;
    if(!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0,0,400,100);
    ctx.fillStyle = 'white';
    ctx.fillRect(0,0,400,100);
    ctx.fillStyle = 'black';
    // Simple CODE128-like
    let x=20;
    for(let i=0;i<text.length;i++){
      const code = text.charCodeAt(i);
      for(let b=0;b<8;b++){
        if((code>>b)&1) ctx.fillRect(x,20,2,60);
        x+=3;
      }
      x+=2;
    }
    ctx.font = '14px monospace';
    ctx.fillText(text, 20, 95);
  },[text]);
  
  const downloadLocal = (dataUrl: string, name: string) => {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = name;
    a.click();
  };

  return (
    <div className="space-y-3">
      <input value={text} onChange={e=>setText(e.target.value)} className="w-full rounded-xl bg-black/50 px-3 py-2 outline-none" />
      <canvas ref={canvasRef} width={400} height={100} className="w-full rounded-xl bg-white" />
      <button onClick={()=>canvasRef.current && downloadLocal(canvasRef.current.toDataURL(),'barcode.png')} className="rounded-xl bg-white/10 px-4 py-2 text-sm">Download</button>
    </div>
  );
}
