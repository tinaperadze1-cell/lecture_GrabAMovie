import { useState, useEffect } from "react";
import "./App.css";
import {
  fetchMovies,
  login,
  signup,
  addToFavourites,
  removeFromFavourites,
  addToWatchlist,
  removeFromWatchlist,
  getFavourites,
  getWatchlist,
} from "./api";

function App() {
  const [movies, setMovies] = useState([]);
  const [ratings, setRatings] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null); // Store logged-in user
  const [favourites, setFavourites] = useState(new Set()); // Track favorited movie IDs
  const [watchlist, setWatchlist] = useState(new Set()); // Track watchlist movie IDs
  const [authMode, setAuthMode] = useState("signin"); // "signin" or "signup"
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authSuccess, setAuthSuccess] = useState("");
  const [moviesLoading, setMoviesLoading] = useState(true);
  const [authForm, setAuthForm] = useState({
    username: "",
    password: "",
  });

  // Check localStorage for saved login on component mount
  useEffect(() => {
    const savedUser = localStorage.getItem("grabamovie_user");
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Error parsing saved user:", error);
        localStorage.removeItem("grabamovie_user");
      }
    }
  }, []);

  // Fetch movies from backend database API on component mount
  useEffect(() => {
    const loadMovies = async () => {
      try {
        setMoviesLoading(true);
        const data = await fetchMovies();
        setMovies(data);
      } catch (error) {
        console.error("Error fetching movies:", error);
        // Fallback to empty array if API fails
        setMovies([]);
      } finally {
        setMoviesLoading(false);
      }
    };

    loadMovies();
  }, []);

  // Load user's favourites and watchlist when user logs in
  useEffect(() => {
    const loadUserData = async () => {
      if (currentUser && isAuthenticated) {
        try {
          const [favouritesData, watchlistData] = await Promise.all([
            getFavourites(currentUser.id),
            getWatchlist(currentUser.id),
          ]);

          // Convert arrays to Sets, ensuring IDs are numbers
          setFavourites(new Set(favouritesData.map(id => Number(id))));
          setWatchlist(new Set(watchlistData.map(id => Number(id))));
        } catch (error) {
          console.error("Error loading user favourites/watchlist:", error);
        }
      } else {
        // Clear favourites/watchlist when user logs out
        setFavourites(new Set());
        setWatchlist(new Set());
      }
    };

    loadUserData();
  }, [currentUser, isAuthenticated]);

  const handleRating = (movieId, rating) => {
    setRatings((prev) => ({ ...prev, [movieId]: rating }));
  };

  const handleFavouriteClick = async (movieId) => {
    if (!currentUser) {
      alert("Please sign in to add favorites");
      return;
    }

    const isFavourite = favourites.has(movieId);

    try {
      if (isFavourite) {
        // Remove from favourites
        await removeFromFavourites(currentUser.id, movieId);
        setFavourites((prev) => {
          const newSet = new Set(prev);
          newSet.delete(Number(movieId));
          return newSet;
        });
        alert("Removed from Favourites");
      } else {
        // Add to favourites
        await addToFavourites(currentUser.id, movieId);
        setFavourites((prev) => new Set([...prev, Number(movieId)]));
        alert("Added to Favourites");
      }
    } catch (error) {
      console.error("Error toggling favourite:", error);
      alert(error.message || "Failed to update favourites");
    }
  };

  const handleWatchlistClick = async (movieId) => {
    if (!currentUser) {
      alert("Please sign in to add to watchlist");
      return;
    }

    const isInWatchlist = watchlist.has(movieId);

    try {
      if (isInWatchlist) {
        // Remove from watchlist
        await removeFromWatchlist(currentUser.id, movieId);
        setWatchlist((prev) => {
          const newSet = new Set(prev);
          newSet.delete(Number(movieId));
          return newSet;
        });
        alert("Removed from Watchlist");
      } else {
        // Add to watchlist
        await addToWatchlist(currentUser.id, movieId);
        setWatchlist((prev) => new Set([...prev, Number(movieId)]));
        alert("Added to Watchlist");
      }
    } catch (error) {
      console.error("Error toggling watchlist:", error);
      alert(error.message || "Failed to update watchlist");
    }
  };

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem("grabamovie_user");
    // Reset all user-related state
    setCurrentUser(null);
    setIsAuthenticated(false);
    setFavourites(new Set());
    setWatchlist(new Set());
    setRatings({});
  };

  const renderStars = (movieId) => {
    const currentRating = ratings[movieId] || 0;

    return Array.from({ length: 5 }, (_, index) => {
      const starValue = index + 1;
      const isActive = starValue <= currentRating;

      return (
        <button
          key={starValue}
          className={`star ${isActive ? "active" : ""}`}
          onClick={() => handleRating(movieId, starValue)}
          aria-label={`Set rating ${starValue} for movie`}
        >
          ★
        </button>
      );
    });
  };

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    setAuthSuccess("");

    try {
      if (authMode === "signup") {
        // Create new account
        const data = await signup(authForm.username, authForm.password);
        setAuthSuccess(data.message || "Account created successfully! You can now sign in.");
        // Switch to sign in mode after successful signup
        setTimeout(() => {
          setAuthMode("signin");
          setAuthSuccess("");
        }, 2000);
      } else {
        // Sign in existing user
        const data = await login(authForm.username, authForm.password);
        // Success - user authenticated from database
        setCurrentUser(data.user); // Store user info
        // Save user to localStorage for persistence
        localStorage.setItem("grabamovie_user", JSON.stringify(data.user));
        setIsAuthenticated(true);
        setAuthError("");
        // Favourites and watchlist will be loaded by useEffect when currentUser changes
      }
    } catch (error) {
      console.error("Auth error:", error);
      setAuthError(
        error.message || "Connection error. Please check if the backend is running."
      );
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="page">
      {!isAuthenticated && (
        <div className="login-overlay">
          <form className="login-card" onSubmit={handleAuthSubmit}>
            <div className="auth-tabs">
              <button
                type="button"
                className={`auth-tab ${authMode === "signin" ? "active" : ""}`}
                onClick={() => {
                  setAuthMode("signin");
                  setAuthError("");
                  setAuthSuccess("");
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`auth-tab ${authMode === "signup" ? "active" : ""}`}
                onClick={() => {
                  setAuthMode("signup");
                  setAuthError("");
                  setAuthSuccess("");
                }}
              >
                Sign Up
              </button>
            </div>

            <h1>{authMode === "signup" ? "Create Account" : "Sign In"}</h1>
            <p>
              {authMode === "signup"
                ? "Create a new account to start rating movies."
                : "Enter your username and password to access GRABAMOVIE."}
            </p>

            <label htmlFor="auth-username">Username</label>
            <input
              id="auth-username"
              type="text"
              placeholder={authMode === "signup" ? "Choose a username" : "moviebuff"}
              value={authForm.username}
              onChange={(event) =>
                setAuthForm((prev) => ({ ...prev, username: event.target.value }))
              }
              required
              disabled={authLoading}
              minLength={3}
            />

            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              placeholder={authMode === "signup" ? "Choose a password" : "popcorn123"}
              value={authForm.password}
              onChange={(event) =>
                setAuthForm((prev) => ({ ...prev, password: event.target.value }))
              }
              required
              disabled={authLoading}
              minLength={3}
            />

            {authError && <p className="login-error">{authError}</p>}
            {authSuccess && <p className="login-success">{authSuccess}</p>}

            <button type="submit" disabled={authLoading}>
              {authLoading
                ? authMode === "signup"
                  ? "Creating account..."
                  : "Signing in..."
                : authMode === "signup"
                  ? "Create Account"
                  : "Enter"}
            </button>

            {authMode === "signin" && (
              <div className="login-hint">
                <p>
                  Demo account: <strong>moviebuff / popcorn123</strong>
                </p>
              </div>
            )}
          </form>
        </div>
      )}

      <div className={`desktop-frame ${isAuthenticated ? "" : "blurred"}`}>
        <header className="site-header">
          <div className="brand">GRABAMOVIE</div>
          <nav>
            <a href="#hero">Home</a>
            <a href="#ratings">Ratings</a>
            {isAuthenticated && currentUser && (
              <div className="user-section">
                <span className="user-name">{currentUser.username}</span>
                <button className="logout-btn" onClick={handleLogout} title="Log out">
                  Log Out
                </button>
              </div>
            )}
          </nav>
        </header>

        <main>
          <section className="hero-grid" id="hero">
            <div className="hero-content">
              <p className="eyebrow">Movie night, sorted.</p>
              <h1>GRABAMOVIE</h1>
              <p className="subtitle">rate your favourite movies</p>
              <p className="hero-copy">
                Discover hidden gems, share opinions, and see how others rate the
                same flicks. Grab popcorn, tap a star, and keep the retro vibes
                alive.
              </p>
              <div className="hero-actions">
                <a className="primary-btn" href="#ratings">
                  Start rating
                </a>
                <button className="secondary-btn" type="button" disabled>
                  Watch tutorial (soon)
                </button>
              </div>
            </div>

            <aside className="hero-side">
              <div className="hero-stat">
                <p className="label">Current mood</p>
                <p className="value">Retro • Minimalist</p>
              </div>
              <div className="hero-card">
                <p className="hero-card-title">Tonight&apos;s lineup</p>
                <ul>
                  {moviesLoading ? (
                    <li>Loading movies...</li>
                  ) : (
                    movies.slice(0, 3).map((movie) => (
                      <li key={movie.id}>
                        <span>{movie.title}</span>
                        <span className="year">{movie.year}</span>
                      </li>
                    ))
                  )}
                </ul>
                <div className="hero-star">★ ★ ★ ★ ★</div>
              </div>
            </aside>
          </section>

          <section className="rating-area" id="ratings">
            <div className="rating-top">
              <div>
                <p className="section-label">Fresh Picks</p>
                <h2>Rate today&apos;s featured movies</h2>
                <p>
                  Search is coming soon. For now, sample a few cinematic bites
                  and color the stars with your taste.
                </p>
              </div>

              <div className="search-bar">
                <input
                  type="search"
                  placeholder="Search movies..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  disabled
                />
                <button disabled>Search</button>
              </div>
            </div>

            <div className="movie-grid">
              {moviesLoading ? (
                <p style={{ gridColumn: "1 / -1", textAlign: "center", color: "#9ec9ff" }}>
                  Loading movies from database...
                </p>
              ) : movies.length === 0 ? (
                <p style={{ gridColumn: "1 / -1", textAlign: "center", color: "#ff8f8f" }}>
                  No movies found. Make sure the backend is running and database is initialized.
                </p>
              ) : (
                movies.map((movie) => (
                  <article className="movie-card" key={movie.id}>
                    <div className="movie-info">
                      <p className="tag">{movie.genre}</p>
                      <div className="movie-title-row">
                        <h3>{movie.title}</h3>
                        <div className="movie-actions">
                          <button
                            className={`favourite-btn ${favourites.has(Number(movie.id)) ? "active" : ""}`}
                            onClick={() => handleFavouriteClick(movie.id)}
                            aria-label="Add to favourites"
                            title="Add to Favourites"
                          >
                            {favourites.has(Number(movie.id)) ? "👑" : "♔"}
                          </button>
                          <button
                            className={`watchlist-btn ${watchlist.has(Number(movie.id)) ? "active" : ""}`}
                            onClick={() => handleWatchlistClick(movie.id)}
                            aria-label="Add to watchlist"
                            title="Add to Watchlist"
                          >
                            {watchlist.has(Number(movie.id)) ? "✓" : "+"}
                          </button>
                        </div>
                      </div>
                      <p className="meta">
                        {movie.year} · {movie.genre}
                      </p>
                    </div>
                    <div className="star-row">{renderStars(movie.id)}</div>
                  </article>
                ))
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default App;
