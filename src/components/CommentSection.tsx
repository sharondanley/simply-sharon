export function CommentSection() {
  return (
    <div
      style={{
        width: "100%",
        minHeight: "540px",
        background: "#e1e1e1",
        borderRadius: "20px",
        padding: "42px 48px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: "28px",
      }}
    >
      <div style={{ fontFamily: "'Source Sans 3', 'Source Sans Pro', sans-serif", fontSize: "48px", fontWeight: 700, color: "#000" }}>
        Comments
      </div>
      <div style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: "32px", lineHeight: "38px", color: "#4b5563", maxWidth: "1040px" }}>
        Reader discussion is being prepared for this page. The article layout and post content are live, and comment functionality can be connected next without changing the page design.
      </div>
      <div style={{ width: "100%", height: "1px", background: "#bdbdbd" }} />
      <div style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: "28px", lineHeight: "34px", color: "#6b7280" }}>
        Come back soon for discussion and replies.
      </div>
    </div>
  );
}