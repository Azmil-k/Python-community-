export default function StudentProfileLoading() {
  return (
    <div className="flex-col" style={{ flex: 1, width: "100%" }}>
      <div style={{ padding: "1rem 2rem", background: "var(--surface-color)", borderBottom: "1px solid var(--border-color)", height: "60px" }} />
      <div className="container" style={{ padding: "2rem", maxWidth: "900px" }}>
        <div style={{ height: "35px", width: "100px", background: "rgba(255, 255, 255, 0.05)", borderRadius: "var(--radius-sm)", marginBottom: "1.5rem" }} className="animate-pulse" />
        <div className="glass-panel animate-pulse" style={{ display: "flex", flexDirection: "column", gap: "2rem", background: "rgba(255, 255, 255, 0.03)", height: "500px" }}>
          <div style={{ height: "60px", width: "40%", background: "rgba(255, 255, 255, 0.05)", borderRadius: "var(--radius-sm)" }} />
          <div style={{ height: "100px", width: "100%", background: "rgba(255, 255, 255, 0.03)", borderRadius: "var(--radius-sm)" }} />
          <div style={{ height: "150px", width: "100%", background: "rgba(255, 255, 255, 0.03)", borderRadius: "var(--radius-sm)" }} />
        </div>
      </div>
    </div>
  );
}
