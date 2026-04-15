import { useState, useEffect } from "react";
import Nav from "./Nav";
import { supabase } from "./supabase";

const COUNTRIES = [
  { code: "all", label: "Alle lande" },
  { code: "dk", label: "🇩🇰 Danmark" },
  { code: "se", label: "🇸🇪 Sverige" },
  { code: "no", label: "🇳🇴 Norge" },
  { code: "fr", label: "🇫🇷 Frankrig" },
  { code: "eu", label: "🌍 Europa/int." },
];
const FLAG = { dk: "🇩🇰", se: "🇸🇪", no: "🇳🇴", fr: "🇫🇷", eu: "🌍" };

function Chip({ active, onClick, children }) {
  return <button onClick={onClick} style={{ padding: "4px 11px", borderRadius: 16, border: `1px solid ${active ? "#0f172a" : "#e2e8f0"}`, background: active ? "#0f172a" : "transparent", color: active ? "#fff" : "#64748b", fontSize: 12, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>{children}</button>;
}
function Badge({ color = "gray", children }) {
  const t = { gray: ["#f1f5f9","#475569","#e2e8f0"], blue: ["#eff6ff","#1d4ed8","#bfdbfe"] }[color] || ["#f1f5f9","#475569","#e2e8f0"];
  return <span style={{ fontSize: 11, background: t[0], color: t[1], border: `1px solid ${t[2]}`, padding: "2px 8px", borderRadius: 10, fontWeight: 500, whiteSpace: "nowrap" }}>{children}</span>;
}
function Modal({ title, onClose, children }) {
  return <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }} onClick={onClose}><div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14, padding: 24, width: 520, maxHeight: "85vh", overflowY: "auto" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}><span style={{ fontWeight: 600, fontSize: 16, color: "#0f172a" }}>{title}</span><button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>×</button></div>{children}</div></div>;
}
function Field({ label, value, onChange, options }) {
  return <div style={{ marginBottom: 14 }}><label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#64748b", marginBottom: 4 }}>{label}</label>{options ? <select value={value||""} onChange={e=>onChange(e.target.value)} style={{ width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:13,fontFamily:"inherit",background:"#fff" }}>{options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select> : <input value={value||""} onChange={e=>onChange(e.target.value)} style={{ width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:13,fontFamily:"inherit",boxSizing:"border-box" }} />}</div>;
}

export default function App() {
  const [tab, setTab] = useState("medier");
  const [media, setMedia] = useState([]);
  const [journalists, setJournalists] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [filterCountry, setFilterCountry] = useState("all");
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [editMedia, setEditMedia] = useState(null);
  const [editJournalist, setEditJournalist] = useState(null);
  const [addMedia, setAddMedia] = useState(false);
  const [addJournalist, setAddJournalist] = useState(false);
  const [newMedia, setNewMedia] = useState({ name:"",url:"",country:"dk",type:"" });
  const [newJournalist, setNewJournalist] = useState({ name:"",email:"",sources:"" });
  const [saving, setSaving] = useState(false);
  const [checkedIds, setCheckedIds] = useState(new Set());

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    const [{ data: m },{ data: j }] = await Promise.all([
      supabase.from("sources").select("*").order("name"),
      supabase.from("journalists").select("*").order("name"),
    ]);
    setMedia(m||[]); setJournalists(j||[]);
    setCategories([...new Set((m||[]).map(x=>x.type).filter(Boolean))].sort());
    setLoading(false);
  }

  function getJ(m) { return journalists.filter(j=>(j.sources||[]).includes(m.name)); }

  const filteredMedia = media.filter(m => {
    const q = search.toLowerCase();
    return (!q||m.name.toLowerCase().includes(q)||(m.url||"").toLowerCase().includes(q))
      && (filterCat==="all"||m.type===filterCat)
      && (filterCountry==="all"||m.country===filterCountry);
  });
  const filteredJournalists = journalists.filter(j => {
    const q = search.toLowerCase();
    return !q||j.name.toLowerCase().includes(q)||(j.email||"").toLowerCase().includes(q)||(j.sources||[]).some(s=>s.toLowerCase().includes(q));
  });

  function toggleCheck(id) {
    setCheckedIds(prev => { const n=new Set(prev); n.has(id)?n.delete(id):n.add(id); return n; });
  }
  function toggleAllVisible() {
    const ids = filteredMedia.map(m=>m.id);
    const allOn = ids.every(id=>checkedIds.has(id));
    setCheckedIds(prev => { const n=new Set(prev); allOn?ids.forEach(id=>n.delete(id)):ids.forEach(id=>n.add(id)); return n; });
  }

  async function saveMedia() {
    setSaving(true);
    if (editMedia) await supabase.from("sources").update({ name:editMedia.name,url:editMedia.url,country:editMedia.country,type:editMedia.type }).eq("id",editMedia.id);
    else { await supabase.from("sources").insert(newMedia); setNewMedia({name:"",url:"",country:"dk",type:""}); }
    setEditMedia(null); setAddMedia(false); setSaving(false); loadAll();
  }
  async function deleteMedia(m) {
    if (!confirm(`Slet "${m.name}"?`)) return;
    await supabase.from("sources").delete().eq("id",m.id); loadAll();
  }
  async function saveJournalist() {
    setSaving(true);
    const src = j => typeof j.sources==="string" ? j.sources.split(",").map(s=>s.trim()).filter(Boolean) : j.sources;
    if (editJournalist) await supabase.from("journalists").update({ name:editJournalist.name,email:editJournalist.email,sources:src(editJournalist) }).eq("id",editJournalist.id);
    else { await supabase.from("journalists").insert({ name:newJournalist.name,email:newJournalist.email,sources:newJournalist.sources.split(",").map(s=>s.trim()).filter(Boolean),clients:[],article_count:0,tracked:false }); setNewJournalist({name:"",email:"",sources:""}); }
    setEditJournalist(null); setAddJournalist(false); setSaving(false); loadAll();
  }
  async function deleteJournalist(j) {
    if (!confirm(`Slet "${j.name}"?`)) return;
    await supabase.from("journalists").delete().eq("id",j.id); loadAll();
  }

  function exportCSV() {
    const toExport = checkedIds.size>0 ? media.filter(m=>checkedIds.has(m.id)) : filteredMedia;
    const rows = [["Medie","URL","Land","Kategori","Journalist","Email"]];
    toExport.forEach(m => {
      const js = getJ(m);
      if (!js.length) rows.push([m.name,m.url||"",(m.country||"").toUpperCase(),m.type||"","",""]);
      else js.forEach(j=>rows.push([m.name,m.url||"",(m.country||"").toUpperCase(),m.type||"",j.name,j.email||""]));
    });
    const csv = rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"}));
    a.download = `Kudos_Mediebase_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  }

  const catOpts = [{value:"",label:"Vælg kategori…"},...categories.map(c=>({value:c,label:c}))];
  const cntOpts = [{value:"dk",label:"🇩🇰 Danmark"},{value:"se",label:"🇸🇪 Sverige"},{value:"no",label:"🇳🇴 Norge"},{value:"fr",label:"🇫🇷 Frankrig"},{value:"eu",label:"🌍 Europa/int."}];
  const allVisChecked = filteredMedia.length>0 && filteredMedia.every(m=>checkedIds.has(m.id));

  return (
    <>
      <Nav active="mediebase" />
      <div style={{ fontFamily:"'DM Sans','Segoe UI',system-ui,sans-serif",background:"#f6f8fb",minHeight:"100vh",paddingBottom:60 }}>
      <div style={{ background:"#fff",borderBottom:"1px solid #e8edf3",padding:"13px 24px",display:"flex",alignItems:"center",gap:16 }}>
        <div style={{ fontWeight:700,fontSize:15,color:"#0f172a" }}>kudos <span style={{ color:"#94a3b8",fontWeight:400 }}>/ mediebase</span></div>
        <input placeholder="Søg medier, journalister, emails…" value={search} onChange={e=>setSearch(e.target.value)} style={{ flex:1,maxWidth:400,padding:"7px 14px",borderRadius:20,border:"1px solid #e2e8f0",fontSize:13,fontFamily:"inherit",outline:"none" }} />
        <div style={{ marginLeft:"auto",display:"flex",gap:8,alignItems:"center" }}>
          {tab==="medier" && checkedIds.size>0 && <>
            <span style={{ fontSize:12,color:"#64748b" }}>{checkedIds.size} valgt</span>
            <button onClick={()=>setCheckedIds(new Set())} style={{ padding:"5px 10px",borderRadius:16,border:"1px solid #e2e8f0",background:"transparent",color:"#94a3b8",fontSize:12,cursor:"pointer",fontFamily:"inherit" }}>Ryd</button>
          </>}
          {tab==="medier" && <button onClick={exportCSV} style={{ padding:"6px 14px",borderRadius:16,border:checkedIds.size>0?"none":"1px solid #e2e8f0",background:checkedIds.size>0?"#0f172a":"transparent",color:checkedIds.size>0?"#fff":"#64748b",fontSize:12,cursor:"pointer",fontFamily:"inherit" }}>↓ {checkedIds.size>0?`Eksporter valgte (${checkedIds.size})`:"Eksporter alle"}</button>}
          {[{id:"medier",label:`Medier (${media.length})`},{id:"journalister",label:`Journalister (${journalists.length})`}].map(t=>(
            <Chip key={t.id} active={tab===t.id} onClick={()=>setTab(t.id)}>{t.label}</Chip>
          ))}
        </div>
      </div>

      <div style={{ background:"#fff",borderBottom:"1px solid #e8edf3",padding:"10px 24px",display:"flex",gap:8,flexWrap:"wrap",alignItems:"center" }}>
        {tab==="medier" && <>
          <span style={{ fontSize:10,color:"#94a3b8",fontWeight:600,letterSpacing:"0.06em" }}>KATEGORI</span>
          <Chip active={filterCat==="all"} onClick={()=>setFilterCat("all")}>Alle</Chip>
          {categories.map(c=><Chip key={c} active={filterCat===c} onClick={()=>setFilterCat(c)}>{c}</Chip>)}
          <div style={{ width:1,height:18,background:"#e8edf3" }} />
          <span style={{ fontSize:10,color:"#94a3b8",fontWeight:600,letterSpacing:"0.06em" }}>LAND</span>
          {COUNTRIES.map(c=><Chip key={c.code} active={filterCountry===c.code} onClick={()=>setFilterCountry(c.code)}>{c.label}</Chip>)}
          <div style={{ marginLeft:"auto",display:"flex",gap:8 }}>
            <button onClick={toggleAllVisible} style={{ padding:"5px 12px",borderRadius:16,border:"1px solid #e2e8f0",background:allVisChecked?"#f1f5f9":"transparent",color:"#64748b",fontSize:12,cursor:"pointer",fontFamily:"inherit" }}>{allVisChecked?"Fravælg alle":"Vælg alle synlige"}</button>
            <button onClick={()=>setAddMedia(true)} style={{ padding:"5px 14px",borderRadius:16,border:"none",background:"#0f172a",color:"#fff",fontSize:12,cursor:"pointer",fontFamily:"inherit" }}>+ Tilføj medie</button>
          </div>
        </>}
        {tab==="journalister" && <button onClick={()=>setAddJournalist(true)} style={{ marginLeft:"auto",padding:"5px 14px",borderRadius:16,border:"none",background:"#0f172a",color:"#fff",fontSize:12,cursor:"pointer",fontFamily:"inherit" }}>+ Tilføj journalist</button>}
      </div>

      <div style={{ maxWidth:900,margin:"20px auto",padding:"0 20px" }}>
        {loading && <div style={{ textAlign:"center",padding:40,color:"#94a3b8" }}>Indlæser…</div>}
        {!loading && tab==="medier" && <>
          {filteredMedia.length===0 && <div style={{ textAlign:"center",padding:40,color:"#94a3b8" }}>Ingen medier matcher søgningen</div>}
          {(filterCat==="all"?categories:[filterCat]).map(cat => {
            const items = filteredMedia.filter(m=>m.type===cat);
            if (!items.length) return null;
            const catAllOn = items.every(m=>checkedIds.has(m.id));
            return <div key={cat} style={{ marginBottom:24 }}>
              <div style={{ fontSize:11,fontWeight:600,color:"#64748b",letterSpacing:"0.06em",marginBottom:8,display:"flex",alignItems:"center",gap:10 }}>
                <input type="checkbox" checked={catAllOn} onChange={()=>{ setCheckedIds(prev=>{ const n=new Set(prev); catAllOn?items.forEach(m=>n.delete(m.id)):items.forEach(m=>n.add(m.id)); return n; }); }} style={{ cursor:"pointer" }} />
                {cat.toUpperCase()} ({items.length})
              </div>
              <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
                {items.map(m => {
                  const js=getJ(m); const on=checkedIds.has(m.id);
                  return <div key={m.id} style={{ background:on?"#f8faff":"#fff",border:`1px solid ${on?"#bfdbfe":"#e8edf3"}`,borderRadius:10,padding:"12px 16px",cursor:"pointer" }}
                    onMouseEnter={e=>{ if(!on) e.currentTarget.style.boxShadow="0 2px 10px rgba(0,0,0,0.06)"; }}
                    onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
                    <div style={{ display:"flex",gap:10,alignItems:"flex-start" }}>
                      <input type="checkbox" checked={on} onChange={()=>toggleCheck(m.id)} onClick={e=>e.stopPropagation()} style={{ marginTop:3,cursor:"pointer",flexShrink:0 }} />
                      <div style={{ flex:1,minWidth:0 }} onClick={()=>setSelectedMedia(m)}>
                        <div style={{ display:"flex",gap:6,alignItems:"center",marginBottom:4,flexWrap:"wrap" }}>
                          <span style={{ fontWeight:600,fontSize:14,color:"#0f172a" }}>{m.name}</span>
                          <span style={{ fontSize:12,color:"#94a3b8" }}>{FLAG[m.country]||""}</span>
                        </div>
                        {m.url && <a href={m.url} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()} style={{ fontSize:11,color:"#1d4ed8",textDecoration:"none" }}>{m.url.replace(/https?:\/\/(www\.)?/,"")}</a>}
                        {js.length>0 && <div style={{ marginTop:6,display:"flex",gap:4,flexWrap:"wrap" }}>
                          {js.slice(0,4).map(j=><Badge key={j.id} color="blue">{j.name}</Badge>)}
                          {js.length>4 && <Badge>+{js.length-4}</Badge>}
                        </div>}
                      </div>
                      <div style={{ display:"flex",gap:4,flexShrink:0 }}>
                        <button onClick={e=>{e.stopPropagation();setEditMedia(m);}} style={{ background:"none",border:"1px solid #e2e8f0",borderRadius:6,padding:"3px 8px",cursor:"pointer",fontSize:11,color:"#64748b",fontFamily:"inherit" }}>Rediger</button>
                        <button onClick={e=>{e.stopPropagation();deleteMedia(m);}} style={{ background:"none",border:"1px solid #fee2e2",borderRadius:6,padding:"3px 8px",cursor:"pointer",fontSize:11,color:"#dc2626",fontFamily:"inherit" }}>Slet</button>
                      </div>
                    </div>
                  </div>;
                })}
              </div>
            </div>;
          })}
        </>}

        {!loading && tab==="journalister" && <div style={{ background:"#fff",border:"1px solid #e8edf3",borderRadius:12,padding:"4px 20px 16px" }}>
          {filteredJournalists.length===0 && <div style={{ textAlign:"center",padding:30,color:"#94a3b8" }}>Ingen journalister matcher søgningen</div>}
          {filteredJournalists.map(j=>(
            <div key={j.id} style={{ display:"flex",gap:10,alignItems:"center",padding:"9px 0",borderBottom:"1px solid #f1f5f9" }}>
              <div style={{ width:32,height:32,borderRadius:"50%",background:"#f1f5f9",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:600,color:"#64748b",flexShrink:0 }}>
                {j.name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}
              </div>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontWeight:500,fontSize:13,color:"#0f172a" }}>{j.name}</div>
                <div style={{ fontSize:11,color:"#94a3b8",marginTop:1 }}>{j.email} · {(j.sources||[]).join(", ")}</div>
              </div>
              <div style={{ display:"flex",gap:4 }}>
                <button onClick={()=>setEditJournalist(j)} style={{ background:"none",border:"1px solid #e2e8f0",borderRadius:6,padding:"3px 8px",cursor:"pointer",fontSize:11,color:"#64748b",fontFamily:"inherit" }}>Rediger</button>
                <button onClick={()=>deleteJournalist(j)} style={{ background:"none",border:"1px solid #fee2e2",borderRadius:6,padding:"3px 8px",cursor:"pointer",fontSize:11,color:"#dc2626",fontFamily:"inherit" }}>Slet</button>
              </div>
            </div>
          ))}
        </div>}
      </div>

      {selectedMedia && <Modal title={selectedMedia.name} onClose={()=>setSelectedMedia(null)}>
        <div style={{ marginBottom:12 }}>{selectedMedia.url?<a href={selectedMedia.url} target="_blank" rel="noreferrer" style={{ fontSize:13,color:"#1d4ed8" }}>{selectedMedia.url}</a>:<span style={{ fontSize:13,color:"#94a3b8",fontStyle:"italic" }}>Ingen URL</span>}</div>
        <div style={{ display:"flex",gap:8,marginBottom:20 }}><Badge>{selectedMedia.type||"Ingen kategori"}</Badge><Badge color="blue">{FLAG[selectedMedia.country]} {(selectedMedia.country||"").toUpperCase()}</Badge></div>
        <div style={{ fontWeight:600,fontSize:13,marginBottom:10 }}>Journalister ({getJ(selectedMedia).length})</div>
        {getJ(selectedMedia).length===0?<div style={{ fontSize:13,color:"#94a3b8",fontStyle:"italic" }}>Ingen tilknyttet</div>:getJ(selectedMedia).map(j=>(
          <div key={j.id} style={{ display:"flex",gap:10,alignItems:"center",padding:"8px 0",borderBottom:"1px solid #f1f5f9" }}>
            <div style={{ flex:1 }}><div style={{ fontSize:13,fontWeight:500 }}>{j.name}</div><div style={{ fontSize:11,color:"#94a3b8" }}>{j.email}</div></div>
            <a href={`mailto:${j.email}`} style={{ fontSize:11,color:"#1d4ed8",textDecoration:"none" }}>Send mail</a>
          </div>
        ))}
        <button onClick={()=>{setEditMedia(selectedMedia);setSelectedMedia(null);}} style={{ marginTop:16,padding:"7px 16px",borderRadius:8,border:"1px solid #e2e8f0",background:"transparent",color:"#475569",fontSize:13,cursor:"pointer",fontFamily:"inherit" }}>Rediger medie</button>
      </Modal>}

      {(editMedia||addMedia) && <Modal title={editMedia?`Rediger: ${editMedia.name}`:"Tilføj medie"} onClose={()=>{setEditMedia(null);setAddMedia(false);}}>
        {editMedia?<>
          <Field label="Navn" value={editMedia.name} onChange={v=>setEditMedia({...editMedia,name:v})} />
          <Field label="URL" value={editMedia.url} onChange={v=>setEditMedia({...editMedia,url:v})} />
          <Field label="Land" value={editMedia.country} onChange={v=>setEditMedia({...editMedia,country:v})} options={cntOpts} />
          <Field label="Kategori" value={editMedia.type} onChange={v=>setEditMedia({...editMedia,type:v})} options={catOpts} />
        </>:<>
          <Field label="Navn" value={newMedia.name} onChange={v=>setNewMedia({...newMedia,name:v})} />
          <Field label="URL" value={newMedia.url} onChange={v=>setNewMedia({...newMedia,url:v})} />
          <Field label="Land" value={newMedia.country} onChange={v=>setNewMedia({...newMedia,country:v})} options={cntOpts} />
          <Field label="Kategori" value={newMedia.type} onChange={v=>setNewMedia({...newMedia,type:v})} options={catOpts} />
        </>}
        <div style={{ display:"flex",gap:8,justifyContent:"flex-end",marginTop:8 }}>
          <button onClick={()=>{setEditMedia(null);setAddMedia(false);}} style={{ padding:"7px 16px",borderRadius:8,border:"1px solid #e2e8f0",background:"transparent",color:"#475569",fontSize:13,cursor:"pointer",fontFamily:"inherit" }}>Annuller</button>
          <button onClick={saveMedia} disabled={saving} style={{ padding:"7px 16px",borderRadius:8,border:"none",background:"#0f172a",color:"#fff",fontSize:13,cursor:"pointer",fontFamily:"inherit" }}>{saving?"Gemmer…":"Gem"}</button>
        </div>
      </Modal>}

      {(editJournalist||addJournalist) && <Modal title={editJournalist?`Rediger: ${editJournalist.name}`:"Tilføj journalist"} onClose={()=>{setEditJournalist(null);setAddJournalist(false);}}>
        {editJournalist?<>
          <Field label="Navn" value={editJournalist.name} onChange={v=>setEditJournalist({...editJournalist,name:v})} />
          <Field label="Email" value={editJournalist.email} onChange={v=>setEditJournalist({...editJournalist,email:v})} />
          <Field label="Medier (kommasepareret)" value={Array.isArray(editJournalist.sources)?editJournalist.sources.join(", "):editJournalist.sources} onChange={v=>setEditJournalist({...editJournalist,sources:v})} />
        </>:<>
          <Field label="Navn" value={newJournalist.name} onChange={v=>setNewJournalist({...newJournalist,name:v})} />
          <Field label="Email" value={newJournalist.email} onChange={v=>setNewJournalist({...newJournalist,email:v})} />
          <Field label="Medier (kommasepareret)" value={newJournalist.sources} onChange={v=>setNewJournalist({...newJournalist,sources:v})} />
        </>}
        <div style={{ display:"flex",gap:8,justifyContent:"flex-end",marginTop:8 }}>
          <button onClick={()=>{setEditJournalist(null);setAddJournalist(false);}} style={{ padding:"7px 16px",borderRadius:8,border:"1px solid #e2e8f0",background:"transparent",color:"#475569",fontSize:13,cursor:"pointer",fontFamily:"inherit" }}>Annuller</button>
          <button onClick={saveJournalist} disabled={saving} style={{ padding:"7px 16px",borderRadius:8,border:"none",background:"#0f172a",color:"#fff",fontSize:13,cursor:"pointer",fontFamily:"inherit" }}>{saving?"Gemmer…":"Gem"}</button>
        </div>
      </Modal>}
    </div>
    </>
  );
}
