// TODO Batch 4: Coach client list
// - Table of coach's clients (filtered by coach_id = current user)
// - Columns: name, enrollment week, last session, completion rate, form issues
// - Click row → /coach/clients/[id]
export default function ClientsPage() {
  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "#2C1A10", fontFamily: "var(--font-space-grotesk)", marginBottom: 4 }}>
        My Clients
      </h1>
      <p style={{ color: "#6B5A48", fontSize: 14 }}>Client list — coming in Batch 4.</p>
    </div>
  );
}
