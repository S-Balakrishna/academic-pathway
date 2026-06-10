"use client";

function toCSV(rows) {
  const headers = ["Name", "Email", "Qualification", "Experience (yrs)", "Profession", "Career goal", "Recommendation", "Created at"];
  const escape = (v) => {
    const s = (v ?? "").toString().replace(/"/g, '""');
    return `"${s}"`;
  };
  const lines = [headers.map(escape).join(",")];
  rows.forEach((r) => {
    lines.push([
      r.full_name, r.email, r.qualification, r.experience_years,
      r.profession, r.career_goal, r.recommendation,
      r.created_at ? new Date(r.created_at).toLocaleString() : "",
    ].map(escape).join(","));
  });
  return lines.join("\n");
}

export default function DownloadButton({ rows }) {
  function handleDownload() {
    const csv = toCSV(rows || []);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `submissions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button onClick={handleDownload} className="btn-gold" style={{ padding: "10px 20px", fontSize: "0.9rem" }}>
      ↓ Download CSV
    </button>
  );
}