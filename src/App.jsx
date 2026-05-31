import "./App.css";
import { useEffect, useState } from "react";
import About from "./About";

const GOLD = "#D4AF37";

export default function App() {
  const [epg, setEpg] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [currentProgram, setCurrentProgram] = useState(null);

  const [movieData, setMovieData] = useState(null);
  const [movieCast, setMovieCast] = useState([]);

  const [movieMap, setMovieMap] = useState({});
  const [movieDetails, setMovieDetails] = useState({});

  const [showAbout, setShowAbout] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [maldivesTime, setMaldivesTime] = useState("");

  const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
  const isMobile = window.innerWidth < 768;

  const formatDateFancy = (dateStr) => {
    const d = new Date(dateStr);
    const day = d.getDate();
    const month = d.toLocaleString("en-US", { month: "long" });
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };

  // LOAD EPG
  useEffect(() => {
    fetch("/epg.json").then((r) => r.json()).then(setEpg);
  }, []);

  // PROCESS PROGRAMS
  useEffect(() => {
    if (!epg.length) return;

    const sorted = [...epg].sort(
      (a, b) => new Date(a.start) - new Date(b.start)
    );

    const now = new Date();
    const next24h = new Date(now.getTime() + 86400000);

    const filtered = sorted.filter((p) => {
      const start = new Date(p.start);
      const end = new Date(start.getTime() + p.durationSeconds * 1000);
      return (now >= start && now < end) || (start > now && start <= next24h);
    });

    setPrograms(filtered);

    const current = sorted.find((p) => {
      const start = new Date(p.start);
      const end = new Date(start.getTime() + p.durationSeconds * 1000);
      return now >= start && now < end;
    });

    setCurrentProgram(current || sorted[0]);
  }, [epg]);

  // CURRENT MOVIE
  useEffect(() => {
    if (!currentProgram) return;

    const clean = currentProgram.title.split("-")[0].trim();

    fetch(`https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(clean)}`)
      .then((r) => r.json())
      .then(async (data) => {
        const movie = data.results?.[0];
        if (!movie) return;

        setMovieData(movie);

        const credits = await fetch(
          `https://api.themoviedb.org/3/movie/${movie.id}/credits?api_key=${API_KEY}`
        ).then((r) => r.json());

        setMovieCast(credits.cast?.slice(0, 5));
      });
  }, [currentProgram]);

  // LOAD ALL MOVIES
  useEffect(() => {
    if (!programs.length) return;

    const load = async () => {
      const map = {};
      const details = {};

      for (const p of programs) {
        const clean = p.title.split("-")[0].trim();

        try {
          const res = await fetch(
            `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(clean)}`
          );
          const data = await res.json();

          const movie = data.results?.[0];
          if (!movie) continue;

          map[p.title] = {
            backdrop: movie.backdrop_path
              ? "https://image.tmdb.org/t/p/original" + movie.backdrop_path
              : null,
            poster: movie.poster_path
              ? "https://image.tmdb.org/t/p/w500" + movie.poster_path
              : null,
          };

          const credits = await fetch(
            `https://api.themoviedb.org/3/movie/${movie.id}/credits?api_key=${API_KEY}`
          ).then((r) => r.json());

          const release = await fetch(
            `https://api.themoviedb.org/3/movie/${movie.id}/release_dates?api_key=${API_KEY}`
          ).then((r) => r.json());

          let cert = "";
          const us = release.results?.find((r) => r.iso_3166_1 === "US");
          if (us) cert = us.release_dates?.[0]?.certification || "";

          details[p.title] = {
            overview: movie.overview,
            cast: credits.cast?.slice(0, 4),
            cert,
          };
        } catch {}
      }

      setMovieMap(map);
      setMovieDetails(details);
    };

    load();
  }, [programs]);

  // LIVE CLOCK
  useEffect(() => {
    const updateClock = () => {
      const time = new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
      setMaldivesTime(time);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ background: "#000", color: "#fff", minHeight: "100vh" }}>

      {/* HEADER */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        background: "#000",
        padding: 15,
        borderBottom: `1px solid ${GOLD}`,
        boxShadow: "0 2px 10px rgba(0,0,0,0.5)"
      }}>
        <img src="/hallmovies-logo.png" style={{ height: 85 }} />

        <div style={{
          position: "absolute",
          right: 15,
          color: "#aaa",
          fontSize: "1.2rem",
          fontWeight: "bold"
        }}>
          {maldivesTime}
        </div>
      </div>

      {/* HERO */}
      {currentProgram && movieData && (
        <div style={{
          minHeight: "80vh",
          backgroundImage: `url(https://image.tmdb.org/t/p/original${movieData.backdrop_path})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          display: "flex",
          alignItems: isMobile ? "flex-end" : "center",
        }}>
          <div style={{
            background: isMobile ? "rgba(0,0,0,0.75)" : "rgba(0,0,0,0.6)",
            padding: 20,
            width: isMobile ? "100%" : "50%",
          }}>
            <h1 style={{ fontSize: isMobile ? 28 : 42 }}>
              {currentProgram.title}
            </h1>
            <p>{movieData.overview}</p>
          </div>
        </div>
      )}

      {/* COMING UP */}
      <div style={{ padding: 20 }}>
        <h2 style={{ color: GOLD }}>Coming Up (Next 24h)</h2>

        {programs.map((p, i) => {
          const imgData = movieMap[p.title];
          const img = isMobile ? imgData?.poster : imgData?.backdrop;
          const details = movieDetails[p.title];
          const isExpanded = expanded[i];

          return (
            <div key={i} style={{ marginBottom: 25 }}>

              {isMobile && img && (
                <div style={{
                  height: 260,
                  backgroundImage: `url(${img})`,
                  backgroundSize: "contain",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "center",
                  backgroundColor: "#000"
                }} />
              )}

              {!isMobile && img && (
                <div style={{ height: "55vh", position: "relative" }}>
                  <div style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: `url(${img})`,
                    backgroundSize: "cover"
                  }} />
                  <div style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(0,0,0,0.6)"
                  }} />
                </div>
              )}

              <div style={{
                background: isMobile ? "#000" : "transparent",
                padding: isMobile ? 18 : 20,
                position: "relative"
              }}>
                <h2 style={{ fontSize: isMobile ? 30 : 32 }}>{p.title}</h2>

                <div style={{
                  color: GOLD,
                  fontSize: isMobile ? 30 : 32,
                  fontWeight: "bold"
                }}>
                  {formatDateFancy(p.start)} •{" "}
                  {new Date(p.start).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>

                <p style={{
                  marginTop: 10,
                  fontSize: isMobile ? 17 : 16,
                  lineHeight: 1.6
                }}>
                  {isExpanded
                    ? details?.overview
                    : details?.overview?.slice(0, 160) + "..."}
                </p>

                {details?.overview?.length > 160 && (
                  <span
                    onClick={() =>
                      setExpanded({ ...expanded, [i]: !isExpanded })
                    }
                    style={{ color: GOLD, cursor: "pointer" }}
                  >
                    {isExpanded ? "Read less" : "Read more"}
                  </span>
                )}

                <div style={{
                  marginTop: 8,
                  fontSize: isMobile ? 16 : 16
                }}>
                  <strong style={{ color: GOLD }}>Cast:</strong>{" "}
                  {details?.cast?.map((c) => c.name).join(", ")}
                </div>

                <div style={{
                  position: "absolute",
                  bottom: 10,
                  right: 10,
                  background: GOLD,
                  color: "#000",
                  padding: "5px 10px"
                }}>
                  {details?.cert}
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* ABOUT */}
      <div style={{ borderTop: `1px solid ${GOLD}`, padding: 20, textAlign: "center", position: "relative" }}>
        {!showAbout && (
          <div onClick={() => setShowAbout(true)} style={{ color: GOLD, cursor: "pointer" }}>
            About HallMovies
          </div>
        )}

        {showAbout && (
          <div style={{ position: "relative" }}>
            <div
              onClick={() => setShowAbout(false)}
              style={{
                position: "absolute",
                top: 10,
                right: 15,
                color: GOLD,
                fontSize: 24,
                cursor: "pointer"
              }}
            >
              ✕
            </div>

            <About />
          </div>
        )}
      </div>

      <div style={{ textAlign: "center", padding: 20, color: "#777" }}>
        © HallMovies
      </div>

    </div>
  );
}