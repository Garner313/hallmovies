import { useEffect, useState } from "react";
import About from "./About";

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

export default function App() {
  const [page, setPage] = useState("home");
  const [epg, setEpg] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [currentProgram, setCurrentProgram] = useState(null);
  const [nextProgram, setNextProgram] = useState(null);
  const [movieData, setMovieData] = useState(null);
  const [movieCast, setMovieCast] = useState([]);
  const [posters, setPosters] = useState({});
  const [selectedMovie, setSelectedMovie] = useState(null);

  // LOAD EPG
  useEffect(() => {
    fetch("/epg.json").then((r) => r.json()).then(setEpg);
  }, []);

  // FIXED LOGIC (CURRENT + NEXT 24H)
  useEffect(() => {
    if (!epg.length) return;

    const now = new Date();
    const next24h = new Date(now.getTime() + 86400000);

    const sorted = [...epg].sort(
      (a, b) => new Date(a.start) - new Date(b.start)
    );

    const filtered = sorted.filter((p) => {
      const start = new Date(p.start);
      const end = new Date(start.getTime() + p.durationSeconds * 1000);

      return (
        (now >= start && now < end) ||
        (start > now && start <= next24h)
      );
    });

    setPrograms(filtered);

    const index = sorted.findIndex((p) => {
      const start = new Date(p.start);
      const end = new Date(start.getTime() + p.durationSeconds * 1000);
      return now >= start && now < end;
    });

    if (index !== -1) {
      setCurrentProgram(sorted[index]);
      setNextProgram(sorted[index + 1] || null);
    }
  }, [epg]);

  // TMDB SEARCH (IMPROVED)
  const fetchMovie = async (title) => {
    const clean = title
      .replace(/-/g, " ")
      .replace(/\bPG\b|\bR\b|\bUA\b|\b15\b/g, "")
      .trim();

    const queries = [
      clean,
      clean.split(" ").slice(0, 2).join(" "),
      clean.replace(/[^a-zA-Z0-9 ]/g, ""),
    ];

    for (let q of queries) {
      const res = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(q)}`
      );
      const data = await res.json();
      if (data.results?.length) return data.results[0];
    }

    return null;
  };

  // HERO DATA
  useEffect(() => {
    if (!currentProgram) return;

    fetchMovie(currentProgram.title).then(async (movie) => {
      if (!movie) return;

      setMovieData(movie);

      const credits = await fetch(
        `https://api.themoviedb.org/3/movie/${movie.id}/credits?api_key=${API_KEY}`
      ).then((r) => r.json());

      setMovieCast(credits.cast?.slice(0, 5));
    });
  }, [currentProgram]);

  // LOAD POSTERS
  useEffect(() => {
    if (!programs.length) return;

    const load = async () => {
      const map = {};
      for (const p of programs) {
        const movie = await fetchMovie(p.title);
        if (movie?.poster_path) {
          map[p.title] =
            "https://image.tmdb.org/t/p/w200" + movie.poster_path;
        }
      }
      setPosters(map);
    };

    load();
  }, [programs]);

  // OPEN MOVIE POPUP
  const openMovie = async (title) => {
    const movie = await fetchMovie(title);
    if (!movie) return;

    setSelectedMovie(movie);

    const credits = await fetch(
      `https://api.themoviedb.org/3/movie/${movie.id}/credits?api_key=${API_KEY}`
    ).then((r) => r.json());

    setMovieCast(credits.cast?.slice(0, 8));
  };

  // PROGRESS
  const getProgress = () => {
    if (!currentProgram) return 0;

    const now = new Date();
    const start = new Date(currentProgram.start);
    const end = new Date(start.getTime() + currentProgram.durationSeconds * 1000);

    return Math.min(Math.max(((now - start) / (end - start)) * 100, 0), 100);
  };

  return (
    <div className="bg-black text-white min-h-screen">

      {/* HEADER */}
      <div className="flex justify-between items-center p-4 border-b border-yellow-500">
        <img src="/hallmovies-logo.png" className="h-10" />

        <div className="flex gap-6 text-yellow-500">
          <button onClick={() => setPage("home")}>Home</button>
          <button onClick={() => setPage("about")}>About</button>
        </div>
      </div>

      {page === "home" && (
        <>
          {/* HERO */}
          {currentProgram && (
            <div
              className="h-[70vh] bg-cover bg-center flex items-end relative"
              style={{
                backgroundImage: movieData?.backdrop_path
                  ? `url(https://image.tmdb.org/t/p/original${movieData.backdrop_path})`
                  : movieData?.poster_path
                  ? `url(https://image.tmdb.org/t/p/original${movieData.poster_path})`
                  : "none",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />

              <div className="relative p-6 max-w-3xl">
                <h1 className="text-4xl font-bold">
                  {currentProgram.title}
                </h1>

                <div className="text-sm text-gray-400 mt-1">
                  {new Date(currentProgram.start).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>

                <p className="mt-3 text-gray-300">
                  {movieData?.overview}
                </p>

                <div className="text-sm mt-2">
                  {movieCast.map((c) => c.name).join(", ")}
                </div>

                {/* PROGRESS */}
                <div className="mt-4 w-80">
                  <div className="h-2 bg-gray-700">
                    <div
                      className="h-2 bg-yellow-500"
                      style={{ width: `${getProgress()}%` }}
                    />
                  </div>
                </div>

                {nextProgram && (
                  <div
                    className="mt-4 text-yellow-400 cursor-pointer"
                    onClick={() => openMovie(nextProgram.title)}
                  >
                    ▶ Coming Up: {nextProgram.title}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* LIST */}
          <div className="p-4 space-y-3">
            {programs.map((p, i) => (
              <div
                key={i}
                onClick={() => openMovie(p.title)}
                className={`flex gap-3 p-3 rounded cursor-pointer ${
                  currentProgram?.title === p.title
                    ? "bg-yellow-500 text-black"
                    : "border border-gray-700"
                }`}
              >
                {posters[p.title] && (
                  <img src={posters[p.title]} className="w-16" />
                )}

                <div className="flex-1">{p.title}</div>

                <div>
                  {new Date(p.start).toLocaleDateString("en-US", {
                    month: "short",
                    day: "2-digit",
                  })}{" "}
                  •{" "}
                  {new Date(p.start).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {page === "about" && <About />}

      {/* 🎬 MOVIE INFO POPUP */}
      {selectedMovie && (
        <div className="fixed inset-0 bg-black/90 flex justify-center items-center z-50">
          <div className="bg-gray-900 w-[90%] max-w-md rounded-lg relative overflow-hidden">

            {/* CLOSE BUTTON */}
            <button
              className="absolute top-3 right-3 bg-yellow-500 text-black px-3 py-1 rounded font-bold z-10"
              onClick={() => setSelectedMovie(null)}
            >
              ✕
            </button>

            {/* POSTER */}
            {selectedMovie.poster_path && (
              <img
                src={`https://image.tmdb.org/t/p/w500${selectedMovie.poster_path}`}
                className="w-full h-60 object-cover"
              />
            )}

            {/* CONTENT */}
            <div className="p-4">

              <h2 className="text-xl font-bold mb-2">
                {selectedMovie.title}
              </h2>

              <div className="text-sm text-gray-400 mb-2">
                ⭐ {selectedMovie.vote_average} |{" "}
                {selectedMovie.release_date?.split("-")[0]}
              </div>

              <p className="text-sm text-gray-300 mb-3">
                {selectedMovie.overview}
              </p>

              <div className="text-sm text-gray-400">
                <span className="font-semibold text-white">Cast:</span>{" "}
                {movieCast.map((c) => c.name).join(", ")}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div className="text-center p-4 text-gray-400">
        Contact: bvij@hallmovies.com
      </div>
    </div>
  );
}