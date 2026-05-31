export default function About() {
  return (
    <div style={{ padding: "20px", color: "white" }}>
      
      <img src="/hallmovies-logo.png" style={{ height: 70 }} />

     <p style={{ color: "#ccc", lineHeight: "1.6" }}>
  Hallmovies is a premium international satellite movie channel operated by{" "}
  <a
    href="https://www.garnerbroadcasting.com"
    target="_blank"
    rel="noopener noreferrer"
    style={{ color: "#D4AF37", textDecoration: "none" }}
  >
    Garner Broadcasting Consultants Pvt. Ltd.
  </a>
</p>

      <p style={{ color: "#ccc", marginTop: "10px", lineHeight: "1.6" }}>
        The channel delivers curated movie programming across genres including
        action, drama, romance, and blockbuster entertainment, scheduled in a
        linear broadcast format.
      </p>

      <p style={{ color: "#ccc", marginTop: "10px", lineHeight: "1.6" }}>
        Designed for global audiences, Hallmovies brings a cinematic experience
        through structured programming.
      </p>

      <p style={{ color: "#ccc", marginTop: "15px", lineHeight: "1.6" }}>
        Please reach out to{" "}
        <a
          href="mailto:bvij@hallmovies.com"
          style={{ color: "#D4AF37", textDecoration: "none" }}
        >
          bvij@hallmovies.com
        </a>{" "}
        for enquiries.
      </p>

    </div>
  );
}