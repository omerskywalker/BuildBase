// TODO Batch 4: Client detail view
// - Session log history for this client
// - Form assessment panel (needs_cues / getting_there / locked_in)
// - Coach notes compose area
// - Effort + soreness trend charts
export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "#E8F0E8", fontFamily: "var(--font-space-grotesk)", marginBottom: 4 }}>
        Client Detail
      </h1>
      <p style={{ color: "#8A9E8A", fontSize: 14 }}>Client {id} — coming in Batch 4.</p>
    </div>
  );
}
