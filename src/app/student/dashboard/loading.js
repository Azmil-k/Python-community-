export default function StudentDashboardLoading() {
  return (
    <div className="flex-col" style={{ flex: 1, width: "100%" }}>
      <div style={{ padding: "1rem 2rem", background: "var(--surface-color)", borderBottom: "1px solid var(--border-color)", height: "60px" }} />
      <div className="container" style={{ padding: "2rem" }}>
        <div 
          style={{ height: "40px", width: "220px", background: "rgba(255, 255, 255, 0.05)", borderRadius: "var(--radius-sm)", marginBottom: "2rem" }} 
          className="animate-pulse" 
        />
        <div className="flex gap-6" style={{ marginBottom: "2rem", flexWrap: "wrap" }}>
          <div className="glass-panel animate-pulse" style={{ flex: "1 1 260px", height: "120px", background: "rgba(255, 255, 255, 0.03)" }} />
          <div className="glass-panel animate-pulse" style={{ flex: "1 1 300px", height: "120px", background: "rgba(255, 255, 255, 0.03)" }} />
          <div className="glass-panel animate-pulse" style={{ flex: "1 1 300px", height: "120px", background: "rgba(255, 255, 255, 0.03)" }} />
        </div>
        <div className="glass-panel animate-pulse" style={{ height: "300px", background: "rgba(255, 255, 255, 0.03)" }} />
      </div>
    </div>
  );
}
