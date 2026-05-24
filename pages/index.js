import { useState, useRef, useCallback } from "react";

const ENHANCEMENTS = [
  { id: "auto",       icon: "✨", label: "Авто жақсарту",    desc: "AI барлығын өзі шешеді" },
  { id: "upscale",    icon: "🔍", label: "HD / Upscale",     desc: "Кішкентай суретті үлкейтеді" },
  { id: "denoise",    icon: "🌟", label: "Blur жою",         desc: "Бұлыңғырды анық қылады" },
  { id: "light",      icon: "☀️", label: "Жарық түзету",     desc: "Қараңғы суретті жарықтандырады" },
  { id: "background", icon: "🎨", label: "Фон ауыстыру",     desc: "Кәсіби фон қосады" },
  { id: "portrait",   icon: "👤", label: "Portrait retouch", desc: "Бет-жүзді жақсартады" },
];

const BG_STYLES = [
  { id: "studio",  label: "Студия",     color: "#f0f0f0" },
  { id: "sunset",  label: "Күн батысы", color: "#ff9a56" },
  { id: "nature",  label: "Табиғат",    color: "#56ab2f" },
  { id: "luxury",  label: "Люкс",       color: "#1a1a2e" },
  { id: "ocean",   label: "Мұхит",      color: "#0072ff" },
  { id: "pastel",  label: "Пастель",    color: "#ffb3c6" },
];

export default function App() {
  const [image, setImage]             = useState(null);
  const [mode, setMode]               = useState("auto");
  const [bgStyle, setBgStyle]         = useState("studio");
  const [loading, setLoading]         = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [result, setResult]           = useState(null);
  const [error, setError]             = useState(null);
  const [dragging, setDragging]       = useState(false);
  const fileRef = useRef();

  const handleFile = (file) => {
    if (!file?.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => { setImage(e.target.result); setResult(null); setError(null); };
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }, []);

  const enhance = async () => {
    if (!image) return;
    setLoading(true); setError(null); setResult(null);
    try {
      setLoadingText("🔍 Сурет талданып жатыр...");
      await sleep(800);
      setLoadingText("🤖 AI жақсартып жатыр...");
      const res = await fetch("/api/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: image, mode, bgStyle }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setLoadingText("✨ Дайындалуда...");
      await sleep(500);
      setResult(data.imageUrl);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false); setLoadingText("");
    }
  };

  const download = () => {
    const a = document.createElement("a");
    a.href = result; a.download = `photofix-${Date.now()}.png`; a.click();
  };

  return (
    <div style={{ minHeight:"100vh", background:"#0c0c0e", color:"#fff", fontFamily:"'DM Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        .upload-area{border:1.5px dashed rgba(255,255,255,0.12);border-radius:24px;cursor:pointer;transition:all 0.3s;background:rgba(255,255,255,0.02)}
        .upload-area:hover,.upload-area.drag{border-color:rgba(99,102,241,0.6);background:rgba(99,102,241,0.05)}
        .mode-card{border:1.5px solid rgba(255,255,255,0.07);border-radius:16px;padding:14px;cursor:pointer;transition:all 0.2s;background:rgba(255,255,255,0.02);text-align:center}
        .mode-card:hover{border-color:rgba(99,102,241,0.4);background:rgba(99,102,241,0.06)}
        .mode-card.active{border-color:#6366f1;background:rgba(99,102,241,0.12)}
        .bg-dot{width:44px;height:44px;border-radius:50%;cursor:pointer;transition:all 0.2s;border:2.5px solid transparent}
        .bg-dot:hover{transform:scale(1.1)}
        .bg-dot.active{border-color:#fff;box-shadow:0 0 0 2px #6366f1}
        .main-btn{width:100%;padding:16px;border-radius:16px;border:none;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;font-family:'DM Sans',sans-serif;font-weight:600;font-size:16px;cursor:pointer;transition:all 0.3s;letter-spacing:-0.2px}
        .main-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 12px 40px rgba(99,102,241,0.4)}
        .main-btn:disabled{opacity:0.5;cursor:not-allowed}
        .secondary-btn{padding:12px 20px;border-radius:12px;border:1.5px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.7);font-family:'DM Sans',sans-serif;font-weight:500;font-size:14px;cursor:pointer;transition:all 0.2s}
        .secondary-btn:hover{border-color:rgba(255,255,255,0.2);background:rgba(255,255,255,0.07)}
        .tag{display:inline-block;padding:3px 10px;border-radius:100px;font-size:11px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .fade-up{animation:fadeUp 0.4s ease forwards}
      `}</style>

      {/* Header */}
      <div style={{padding:"24px 28px",borderBottom:"1px solid rgba(255,255,255,0.05)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>✦</div>
          <div>
            <div style={{fontWeight:700,fontSize:17,letterSpacing:"-0.4px"}}>PhotoFix AI</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.35)",fontWeight:400}}>Кәсіби сурет жақсарту</div>
          </div>
        </div>
        <div className="tag" style={{background:"rgba(99,102,241,0.15)",color:"#818cf8",border:"1px solid rgba(99,102,241,0.2)"}}>Beta</div>
      </div>

      <div style={{maxWidth:480,margin:"0 auto",padding:"28px 20px"}}>

        {/* Upload */}
        {!image ? (
          <div className={`upload-area fade-up ${dragging?"drag":""}`}
            style={{padding:"56px 24px",textAlign:"center"}}
            onClick={()=>fileRef.current.click()}
            onDragOver={(e)=>{e.preventDefault();setDragging(true)}}
            onDragLeave={()=>setDragging(false)}
            onDrop={handleDrop}
          >
            <div style={{fontSize:52,marginBottom:16}}>📷</div>
            <div style={{fontWeight:600,fontSize:17,marginBottom:8,letterSpacing:"-0.3px"}}>Суретті жүктеңіз</div>
            <div style={{color:"rgba(255,255,255,0.35)",fontSize:13,lineHeight:1.6}}>
              Кез келген нашар сурет — AI жақсартады<br/>
              <span style={{fontSize:11,opacity:0.6}}>JPG · PNG · WEBP · 10MB дейін</span>
            </div>
          </div>
        ) : (
          <div className="fade-up" style={{position:"relative",borderRadius:20,overflow:"hidden",background:"#1a1a1e"}}>
            <img src={image} alt="uploaded" style={{width:"100%",maxHeight:320,objectFit:"contain",display:"block"}}/>
            <div style={{position:"absolute",top:12,right:12}}>
              <button onClick={()=>{setImage(null);setResult(null);}} className="secondary-btn" style={{padding:"6px 14px",fontSize:12}}>✕ Өзгерту</button>
            </div>
            <div style={{position:"absolute",bottom:12,left:12}}>
              <div className="tag" style={{background:"rgba(0,0,0,0.6)",color:"rgba(255,255,255,0.7)",backdropFilter:"blur(8px)"}}>Түпнұсқа</div>
            </div>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={(e)=>handleFile(e.target.files[0])}/>

        {/* Mode Selection */}
        {image && !loading && !result && (
          <div className="fade-up" style={{marginTop:20}}>
            <div style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.35)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:12}}>Жақсарту түрі</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {ENHANCEMENTS.map((e)=>(
                <div key={e.id} className={`mode-card ${mode===e.id?"active":""}`} onClick={()=>setMode(e.id)}>
                  <div style={{fontSize:22,marginBottom:6}}>{e.icon}</div>
                  <div style={{fontWeight:600,fontSize:13,marginBottom:3,letterSpacing:"-0.2px"}}>{e.label}</div>
                  <div style={{fontSize:11,color:"rgba(255,255,255,0.35)",lineHeight:1.4}}>{e.desc}</div>
                </div>
              ))}
            </div>

            {mode==="background" && (
              <div style={{marginTop:16,background:"rgba(255,255,255,0.02)",borderRadius:16,padding:16,border:"1px solid rgba(255,255,255,0.06)"}}>
                <div style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.35)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:12}}>Фон түсі</div>
                <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                  {BG_STYLES.map((b)=>(
                    <div key={b.id} title={b.label} className={`bg-dot ${bgStyle===b.id?"active":""}`} style={{background:b.color}} onClick={()=>setBgStyle(b.id)}/>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="fade-up" style={{marginTop:20,background:"rgba(99,102,241,0.06)",borderRadius:20,padding:32,textAlign:"center",border:"1px solid rgba(99,102,241,0.15)"}}>
            <div style={{width:52,height:52,borderRadius:"50%",border:"2.5px solid rgba(99,102,241,0.2)",borderTopColor:"#6366f1",margin:"0 auto 20px",animation:"spin 0.9s linear infinite"}}/>
            <div style={{fontWeight:600,fontSize:16,marginBottom:8,letterSpacing:"-0.3px"}}>{loadingText}</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.3)"}}>Бір сәт күтіңіз...</div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="fade-up" style={{marginTop:16,background:"rgba(239,68,68,0.06)",borderRadius:16,padding:16,border:"1px solid rgba(239,68,68,0.15)"}}>
            <div style={{fontWeight:600,color:"#f87171",fontSize:14,marginBottom:4}}>⚠️ Қате орын алды</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.4)",fontFamily:"'DM Mono',monospace"}}>{error}</div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="fade-up" style={{marginTop:20}}>
            <div style={{borderRadius:20,overflow:"hidden",background:"#1a1a1e",position:"relative"}}>
              <img src={result} alt="result" style={{width:"100%",maxHeight:380,objectFit:"contain",display:"block"}}/>
              <div style={{position:"absolute",bottom:12,left:12}}>
                <div className="tag" style={{background:"rgba(16,185,129,0.8)",color:"#fff",backdropFilter:"blur(8px)"}}>✓ Жақсартылды</div>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:12}}>
              <button className="main-btn" onClick={download} style={{fontSize:14}}>⬇ Жүктеп алу</button>
              <button className="secondary-btn" onClick={()=>setResult(null)} style={{textAlign:"center"}}>🔄 Қайтадан</button>
            </div>
          </div>
        )}

        {/* Main Button */}
        {image && !loading && !result && (
          <button className="main-btn fade-up" onClick={enhance} style={{marginTop:16}}>✦ Жақсарту</button>
        )}

        {/* Features */}
        {!image && (
          <div className="fade-up" style={{marginTop:40}}>
            <div style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.2)",textTransform:"uppercase",letterSpacing:"0.1em",textAlign:"center",marginBottom:20}}>Не жасай алады?</div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {[
                ["🔍","HD Upscale","Кішкентай суретті 4x үлкейтеді"],
                ["🌟","Blur жою","Бұлыңғыр суретті кристалдай анық қылады"],
                ["☀️","Жарық түзету","Түнгі суретті күндізгідей жарықтандырады"],
                ["🎨","Фон ауыстыру","Нашар фонды кәсіби фонға ауыстырады"],
                ["👤","Portrait","Адам бетін табиғи түрде жақсартады"],
                ["✨","Авто AI","Бәрін автоматты анықтап жақсартады"],
              ].map(([icon,title,desc])=>(
                <div key={title} style={{display:"flex",alignItems:"center",gap:14,padding:"12px 16px",background:"rgba(255,255,255,0.02)",borderRadius:14,border:"1px solid rgba(255,255,255,0.04)"}}>
                  <div style={{fontSize:22,width:36,textAlign:"center"}}>{icon}</div>
                  <div>
                    <div style={{fontWeight:600,fontSize:14,letterSpacing:"-0.2px"}}>{title}</div>
                    <div style={{fontSize:12,color:"rgba(255,255,255,0.35)",marginTop:2}}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function sleep(ms){return new Promise(r=>setTimeout(r,ms));}
