export default function Nav({ active }) {
  const apps = [
    { id: "mediemonitor", label: "Mediemonitor", emoji: "📡" },
    { id: "mediebase", label: "Mediebase", emoji: "🗂️" },
    { id: "crm", label: "Nye Kunder", emoji: "🤝" },
  ];
  const urls = {
    mediemonitor: "https://kudos-mediemonitor.vercel.app",
    mediebase: "https://kudos-mediebase.vercel.app",
    crm: "https://kudos-crm.vercel.app",
  };
  return (
    <div style={{ position:"fixed",top:0,left:0,right:0,zIndex:200,background:"#0a0a0a",borderBottom:"1px solid #1e1e1e",display:"flex",alignItems:"center",height:40 }}>
      <div style={{ padding:"0 16px",fontWeight:700,fontSize:13,color:"#fff",letterSpacing:"-0.3px",borderRight:"1px solid #1e1e1e",height:"100%",display:"flex",alignItems:"center" }}>kudos</div>
      {apps.map(app => (
        <a key={app.id} href={urls[app.id]} style={{ padding:"0 16px",height:"100%",display:"flex",alignItems:"center",gap:6,fontSize:12,textDecoration:"none",color:active===app.id?"#fff":"#666",background:active===app.id?"#1a1a1a":"transparent",borderRight:"1px solid #1e1e1e" }}>
          <span>{app.emoji}</span>{app.label}
        </a>
      ))}
    </div>
  );
}
