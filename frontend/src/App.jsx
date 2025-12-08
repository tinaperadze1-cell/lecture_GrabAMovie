import { useState, useEffect, useRef } from "react";
import "./App.css";
import {
  fetchMovies,
  fetchMovie,
  searchMovies,
  fetchTopRatedMovies,
  login,
  signup,
  addToFavourites,
  removeFromFavourites,
  addToWatchlist,
  removeFromWatchlist,
  getFavourites,
  getWatchlist,
  saveRating,
  getMovieRatings,
  getUserRating,
  createComment,
  getMovieComments,
  updateComment,
  deleteComment,
  getUserProfile,
  updateUserProfile,
  getUserRatings as getUserRatingsHistory,
  getUserComments as getUserCommentsHistory,
  fetchMovieActors,
  fetchSnacks,
  createShowing,
  getShowings,
  getRecommendations,
  getSeats,
  createBooking,
  getQuizQuestions,
  submitQuizResult,
  getDailyBattle,
  submitBattleVote,
  getYesterdayWinner,
  getMonthlyLeader,
  getMovieBattleStats,
  getTrendingMovies,
  submitTrendingVote,
  addTrendingMovie,
} from "./api";
import { nowPlaying2025, comingSoon2025 } from "./newReleases2025";
import AdminPanel from "./AdminPanel";

// Carousel component for newly released movies with Buy Ticket button
function NewlyReleasedCarousel({ movies, onBuyTicket, loading }) {
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const scrollContainerRef = useRef(null);

  const checkScrollButtons = (container) => {
    if (!container) return;
    const { scrollLeft, scrollWidth, clientWidth } = container;
    const maxScroll = scrollWidth - clientWidth;
    setShowLeftArrow(scrollLeft > 10);
    setShowRightArrow(scrollLeft < maxScroll - 5);
  };

  const scrollLeft = (e) => {
    e?.stopPropagation();
    e?.preventDefault();
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = container.clientWidth * 0.75;
      const currentScroll = container.scrollLeft;
      const targetScroll = Math.max(currentScroll - scrollAmount, 0);
      container.scrollTo({ left: targetScroll, behavior: "smooth" });
      setTimeout(() => checkScrollButtons(container), 300);
    }
  };

  const scrollRight = (e) => {
    e?.stopPropagation();
    e?.preventDefault();
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = container.clientWidth * 0.75;
      const currentScroll = container.scrollLeft;
      const maxScroll = container.scrollWidth - container.clientWidth;
      const targetScroll = Math.min(currentScroll + scrollAmount, maxScroll);
      container.scrollTo({ left: targetScroll, behavior: "smooth" });
      setTimeout(() => checkScrollButtons(container), 300);
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      checkScrollButtons(container);
      const handleScroll = () => checkScrollButtons(container);
      container.addEventListener("scroll", handleScroll);
      window.addEventListener("resize", handleScroll);
      return () => {
        container.removeEventListener("scroll", handleScroll);
        window.removeEventListener("resize", handleScroll);
      };
    }
  }, [movies]);

  if (loading) {
    return <p className="no-movies">Loading movies...</p>;
  }

  if (!movies || movies.length === 0) {
    return <p className="no-movies">No movies available.</p>;
  }

  return (
    <div className="horizontal-carousel-wrapper">
      {showLeftArrow && (
        <button
          className="carousel-arrow carousel-arrow-left"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            scrollLeft(e);
          }}
          aria-label="Scroll left"
          type="button"
        >
          ‹
        </button>
      )}
      <div
        className="horizontal-carousel horizontal-carousel-movies"
        ref={scrollContainerRef}
        onScroll={() => checkScrollButtons(scrollContainerRef.current)}
      >
        {movies.map((movie) => (
          <article className="movie-card carousel-card-movie" key={movie.tmdbId}>
            <div className="movie-card-poster-container">
              {movie.posterPath && movie.posterPath.startsWith('http') ? (
                <img
                  src={movie.posterPath}
                  alt={movie.title}
                  className="movie-card-poster"
                  onError={(e) => {
                    // If image fails to load, replace with div placeholder
                    const container = e.target.parentElement;
                    if (container && e.target.tagName === 'IMG') {
                      container.innerHTML = `<div class="movie-card-poster-placeholder"><span>🎬</span><span class="placeholder-title">${movie.title}</span></div>`;
                    }
                  }}
                />
              ) : (
                <div className="movie-card-poster-placeholder">
                  <span>🎬</span>
                  <span className="placeholder-title">{movie.title}</span>
                </div>
              )}
            </div>
            <div className="movie-info">
              <p className="tag">{movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : "2024"}</p>
              <div className="movie-title-row">
                <h3 className="movie-title-clickable">{movie.title}</h3>
              </div>
              <p className="meta">{movie.overview ? movie.overview.substring(0, 100) + "..." : ""}</p>
              <p className="meta" style={{ color: "#9ec9ff", marginTop: "0.5rem", fontSize: "0.85rem" }}>
                ⭐ {movie.voteAverage.toFixed(1)} ({movie.voteCount} votes)
              </p>
              <button
                className="primary-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onBuyTicket(movie);
                }}
                style={{ marginTop: "1rem", width: "100%" }}
              >
                Buy Ticket
              </button>
            </div>
          </article>
        ))}
      </div>
      {showRightArrow && (
        <button
          className="carousel-arrow carousel-arrow-right"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            scrollRight(e);
          }}
          aria-label="Scroll right"
          type="button"
        >
          ›
        </button>
      )}
    </div>
  );
}

// Horizontal Carousel Component for Regular Movie Cards (Ratings Page)
function HorizontalMovieCarousel({ 
  movies, 
  onMovieClick, 
  loading, 
  movieRatings,
  favourites,
  watchlist,
  onFavouriteClick,
  onWatchlistClick,
  onBuyTicket
}) {
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const scrollContainerRef = useRef(null);

  const checkScrollButtons = (container) => {
    if (!container) return;
    const { scrollLeft, scrollWidth, clientWidth } = container;
    const maxScroll = scrollWidth - clientWidth;
    setShowLeftArrow(scrollLeft > 10);
    setShowRightArrow(scrollLeft < maxScroll - 5); // Use 5px threshold for better detection
  };

  const scrollLeft = (e) => {
    e?.stopPropagation();
    e?.preventDefault();
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = container.clientWidth * 0.75;
      const currentScroll = container.scrollLeft;
      
      // Ensure we don't scroll past the beginning
      const targetScroll = Math.max(currentScroll - scrollAmount, 0);
      
      container.scrollTo({ left: targetScroll, behavior: "smooth" });
      setTimeout(() => checkScrollButtons(container), 300);
    }
  };

  const scrollRight = (e) => {
    e?.stopPropagation();
    e?.preventDefault();
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = container.clientWidth * 0.75;
      const currentScroll = container.scrollLeft;
      const maxScroll = container.scrollWidth - container.clientWidth;
      
      // Ensure we don't scroll past the end
      const targetScroll = Math.min(currentScroll + scrollAmount, maxScroll);
      
      container.scrollTo({ left: targetScroll, behavior: "smooth" });
      setTimeout(() => checkScrollButtons(container), 300);
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      checkScrollButtons(container);
      const handleScroll = () => checkScrollButtons(container);
      container.addEventListener("scroll", handleScroll);
      window.addEventListener("resize", handleScroll);
      return () => {
        container.removeEventListener("scroll", handleScroll);
        window.removeEventListener("resize", handleScroll);
      };
    }
  }, [movies]);

  if (loading) {
    return <p className="no-movies">Loading movies...</p>;
  }

  if (!movies || movies.length === 0) {
    return <p className="no-movies">No movies available.</p>;
  }

  return (
    <div className="horizontal-carousel-wrapper">
      {showLeftArrow && (
        <button
          className="carousel-arrow carousel-arrow-left"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            scrollLeft(e);
          }}
          aria-label="Scroll left"
          type="button"
        >
          ‹
        </button>
      )}
      <div
        className="horizontal-carousel horizontal-carousel-movies"
        ref={scrollContainerRef}
        onScroll={() => checkScrollButtons(scrollContainerRef.current)}
      >
        {movies.map((movie) => {
          const movieRatingData = movieRatings?.[movie.id] || { average: null, count: 0 };

          return (
            <article 
              className="movie-card carousel-card-movie"
              key={movie.id}
              onClick={() => onMovieClick(movie.id)}
              style={{ cursor: "pointer" }}
              title="Click to view movie details"
            >
              <div className="movie-card-poster-container">
                {movie.poster_url && movie.poster_url.trim() !== '' && movie.poster_url !== 'N/A' && (movie.poster_url.startsWith('http') || movie.poster_url.startsWith('//') || movie.poster_url.startsWith('m.media-amazon.com')) ? (
                  <img
                    src={movie.poster_url.startsWith('//') ? `https:${movie.poster_url}` : movie.poster_url.startsWith('m.media-amazon.com') ? `https://${movie.poster_url}` : movie.poster_url}
                    alt={movie.title}
                    className="movie-card-poster"
                  onError={(e) => {
                    // If image fails to load, replace with div placeholder immediately
                    const container = e.target.parentElement;
                    if (container && e.target.tagName === 'IMG') {
                      container.innerHTML = `<div class="movie-card-poster-placeholder"><span>🎬</span><span class="placeholder-title">${movie.title}</span></div>`;
                    }
                  }}
                  />
                ) : (
                  <div className="movie-card-poster-placeholder">
                    <span>🎬</span>
                    <span className="placeholder-title">{movie.title}</span>
                  </div>
                )}
              </div>
              <div className="movie-info">
                <p className="tag">{movie.genre}</p>
                <div className="movie-title-row">
                  <h3 className="movie-title-clickable" style={{ cursor: "pointer" }}>
                    {movie.title}
                  </h3>
                  <div className="movie-actions" onClick={(e) => e.stopPropagation()}>
                    {onFavouriteClick && (
                      <button
                        className={`favourite-btn ${favourites?.has(Number(movie.id)) ? "active" : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onFavouriteClick(movie.id);
                        }}
                        aria-label="Add to favourites"
                        title="Add to Favourites"
                      >
                        {favourites?.has(Number(movie.id)) ? "👑" : "♔"}
                      </button>
                    )}
                    {onWatchlistClick && (
                      <button
                        className={`watchlist-btn ${watchlist?.has(Number(movie.id)) ? "active" : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onWatchlistClick(movie.id);
                        }}
                        aria-label="Add to watchlist"
                        title="Add to Watchlist"
                      >
                        {watchlist?.has(Number(movie.id)) ? "✓" : "+"}
                      </button>
                    )}
                  </div>
                </div>
                <p className="meta">{movie.year}</p>
                {onBuyTicket && (
                  <button
                    className="primary-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      onBuyTicket(movie);
                    }}
                    style={{ marginTop: "1rem", width: "100%" }}
                  >
                    Buy Ticket
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
      {showRightArrow && (
        <button
          className="carousel-arrow carousel-arrow-right"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            scrollRight(e);
          }}
          aria-label="Scroll right"
          type="button"
        >
          ›
        </button>
      )}
    </div>
  );
}

// Horizontal Carousel Component for Top Rated Movies (Home Page)
function HorizontalCarousel({ movies, onMovieClick, loading }) {
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const scrollContainerRef = useRef(null);

  const checkScrollButtons = (container) => {
    if (!container) return;
    const { scrollLeft, scrollWidth, clientWidth } = container;
    const maxScroll = scrollWidth - clientWidth;
    setShowLeftArrow(scrollLeft > 5);
    setShowRightArrow(scrollLeft < maxScroll - 5); // Use 5px threshold for better detection
  };

  const scrollLeft = (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = container.clientWidth * 0.75;
      const currentScroll = container.scrollLeft;
      
      // Ensure we don't scroll past the beginning
      const targetScroll = Math.max(currentScroll - scrollAmount, 0);
      
      container.scrollTo({ left: targetScroll, behavior: "smooth" });
      setTimeout(() => checkScrollButtons(container), 300);
    }
  };

  const scrollRight = (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = container.clientWidth * 0.75;
      const currentScroll = container.scrollLeft;
      const maxScroll = container.scrollWidth - container.clientWidth;
      
      // Ensure we don't scroll past the end
      const targetScroll = Math.min(currentScroll + scrollAmount, maxScroll);
      
      container.scrollTo({ left: targetScroll, behavior: "smooth" });
      setTimeout(() => checkScrollButtons(container), 300);
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      checkScrollButtons(container);
      const handleScroll = () => checkScrollButtons(container);
      container.addEventListener("scroll", handleScroll);
      window.addEventListener("resize", handleScroll);
      return () => {
        container.removeEventListener("scroll", handleScroll);
        window.removeEventListener("resize", handleScroll);
      };
    }
  }, [movies]);

  if (loading) {
    return <p className="no-movies">Loading top-rated movies...</p>;
  }

  if (!movies || movies.length === 0) {
    return <p className="no-movies">No movies available.</p>;
  }

  return (
    <div className="horizontal-carousel-wrapper">
      {showLeftArrow && (
        <button
          className="carousel-arrow carousel-arrow-left"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            scrollLeft(e);
          }}
          aria-label="Scroll left"
          type="button"
        >
          ‹
        </button>
      )}
      <div
        className="horizontal-carousel"
        ref={scrollContainerRef}
        onScroll={() => checkScrollButtons(scrollContainerRef.current)}
      >
        {movies.map((movie) => {
          const rating = movie.imdb_rating || movie.avg_user_rating;
          const ratingValue = rating ? parseFloat(rating) : 0;
          const stars = Math.round(ratingValue / 2);

          return (
            <div
              key={movie.id}
              className="top-rated-card carousel-card"
              onClick={() => onMovieClick(movie.id)}
            >
              {movie.poster_url && movie.poster_url.trim() !== '' && movie.poster_url !== 'N/A' && (movie.poster_url.startsWith('http') || movie.poster_url.startsWith('//') || movie.poster_url.startsWith('m.media-amazon.com')) ? (
                <img
                  src={movie.poster_url.startsWith('//') ? `https:${movie.poster_url}` : movie.poster_url.startsWith('m.media-amazon.com') ? `https://${movie.poster_url}` : movie.poster_url}
                  alt={movie.title}
                  className="top-rated-poster"
                  loading="lazy"
                  onError={(e) => {
                    // If image fails to load (404), replace with placeholder
                    // Note: Browser will log 404 to console before this handler runs - this is normal and unavoidable
                    // The error handler ensures users see a placeholder instead of a broken image
                    if (e.target.tagName === 'IMG') {
                      const placeholder = document.createElement('div');
                      placeholder.className = 'top-rated-poster-placeholder';
                      placeholder.innerHTML = `<span>🎬</span><span class="placeholder-title">${movie.title}</span>`;
                      e.target.parentNode.replaceChild(placeholder, e.target);
                    }
                  }}
                />
              ) : (
                <div className="top-rated-poster-placeholder">
                  <span>🎬</span>
                  <span className="placeholder-title">{movie.title}</span>
                </div>
              )}
              <div className="top-rated-info">
                <h3 className="top-rated-title">{movie.title}</h3>
                <div className="top-rated-meta">
                  <span className="top-rated-year">{movie.year}</span>
                  <span className="top-rated-genre">{movie.genre}</span>
                </div>
                <div className="top-rated-rating">
                  <div className="rating-stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={star <= stars ? "star-filled" : "star-empty"}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="rating-value">
                    {ratingValue > 0 ? ratingValue.toFixed(1) : "N/A"}
                    {movie.imdb_rating ? " (IMDB)" : " (User)"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {showRightArrow && (
        <button
          className="carousel-arrow carousel-arrow-right"
          onClick={(e) => {
            console.log('Right arrow clicked - HorizontalCarousel');
            e.preventDefault();
            e.stopPropagation();
            scrollRight(e);
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
          }}
          aria-label="Scroll right"
          type="button"
          style={{ 
            zIndex: 1001,
            position: 'absolute',
            pointerEvents: 'auto',
            cursor: 'pointer'
          }}
        >
          ›
        </button>
      )}
    </div>
  );
}

function App() {
  const [movies, setMovies] = useState([]);
  const [topRatedMovies, setTopRatedMovies] = useState([]); // Top-rated movies
  const [topRatedLoading, setTopRatedLoading] = useState(true); // Loading state for top-rated movies
  const [ratings, setRatings] = useState({}); // User's current ratings
  const [movieRatings, setMovieRatings] = useState({}); // Average ratings for each movie
  const [comments, setComments] = useState({}); // Comments for each movie { movieId: [comments] }
  const [commentTexts, setCommentTexts] = useState({}); // New comment input text
  const [editingComment, setEditingComment] = useState(null); // { movieId, commentId, text }
  const [actors, setActors] = useState({}); // Actors for each movie { movieId: [actors] }
  const [actorsLoading, setActorsLoading] = useState({}); // Loading state for actors { movieId: true/false }
  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState(""); // Search input value
  const [searchResults, setSearchResults] = useState([]); // Search results
  const [showSearchResults, setShowSearchResults] = useState(false); // Show/hide search dropdown
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    genre: "",
    year: "",
    minRating: "",
    popularity: "", // "high", "medium", "low" or ""
  });
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null); // null = list view, movie object = detail view
  const [showQuiz, setShowQuiz] = useState(false); // Show quiz page
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizAnswers, setQuizAnswers] = useState({}); // { questionIndex: selectedAnswer }
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [currentPage, setCurrentPage] = useState("home"); // "home", "ratings", "watchlist", "favorites", or "battle"
  const [battle, setBattle] = useState(null);
  const [battleLoading, setBattleLoading] = useState(true);
  const [hasVoted, setHasVoted] = useState(false);
  const [yesterdayWinner, setYesterdayWinner] = useState(null);
  const [monthlyLeader, setMonthlyLeader] = useState(null);
  const [movie1Stats, setMovie1Stats] = useState(null);
  const [movie2Stats, setMovie2Stats] = useState(null);
  const [showBattlePopup, setShowBattlePopup] = useState(false);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [showAddMovieModal, setShowAddMovieModal] = useState(false);
  const [newMovieTitle, setNewMovieTitle] = useState("");
  const [previousPage, setPreviousPage] = useState("home"); // Track which page we came from before viewing movie detail
  const [userProfile, setUserProfile] = useState(null);
  const [userRatingsHistory, setUserRatingsHistory] = useState([]);
  const [userCommentsHistory, setUserCommentsHistory] = useState([]);
  const [profileEditMode, setProfileEditMode] = useState(false);
  const [profileForm, setProfileForm] = useState({
    username: "",
    email: "",
    password: "",
    profilePictureUrl: "",
    themePreference: "dark",
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null); // Store logged-in user
  const [favourites, setFavourites] = useState(new Set()); // Track favorited movie IDs
  const [watchlist, setWatchlist] = useState(new Set()); // Track watchlist movie IDs
  const [watchlistMovies, setWatchlistMovies] = useState([]); // Full movie objects for watchlist page
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [favoritesMovies, setFavoritesMovies] = useState([]); // Full movie objects for favorites page
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [recommendedMovies, setRecommendedMovies] = useState([]); // Recommended movies
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [authMode, setAuthMode] = useState("signin"); // "signin" or "signup"
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authSuccess, setAuthSuccess] = useState("");
  const [moviesLoading, setMoviesLoading] = useState(true);
  const [authForm, setAuthForm] = useState({
    username: "",
    password: "",
  });
  const [theme, setTheme] = useState(() => {
    // Load theme from localStorage, default to 'dark'
    const savedTheme = localStorage.getItem("grabamovie_theme");
    return savedTheme || "dark";
  });

  const [customColor, setCustomColor] = useState(() => {
    // Load custom color from localStorage, default to blue
    const savedColor = localStorage.getItem("grabamovie_custom_color");
    return savedColor || "#6699ff";
  });
  const [fabOpen, setFabOpen] = useState(false); // Floating Action Button open state
  const [showAdminPanel, setShowAdminPanel] = useState(false); // Admin panel state
  const [isAdmin, setIsAdmin] = useState(false); // Admin status
  const [shouldRedirectToAdmin, setShouldRedirectToAdmin] = useState(false); // Flag for redirect after login
  
  // Booking flow state
  const [nowPlayingMovies, setNowPlayingMovies] = useState([]);
  const [upcomingMovies, setUpcomingMovies] = useState([]);
  const [nowPlayingLoading, setNowPlayingLoading] = useState(false);
  const [upcomingLoading, setUpcomingLoading] = useState(false);
  const [bookingFlow, setBookingFlow] = useState({
    step: null, // null, "seats", "snacks", "checkout", "confirmation"
    movie: null, // Selected movie for booking
    showing: null, // Selected showing
    seats: [], // Selected seat IDs
    snacks: [], // Selected snacks [{snackId, quantity, price}]
    totalAmount: 0,
  });
  const [availableSeats, setAvailableSeats] = useState([]);
  const [snacks, setSnacks] = useState([]);
  const [snacksLoading, setSnacksLoading] = useState(false);

  // Available themes
  const availableThemes = [
    { value: "normal", label: "Normal (Default)" },
    { value: "dark", label: "Dark Mode" },
    { value: "light", label: "Light Mode" },
    { value: "red", label: "Red Theme" },
    { value: "blue", label: "Blue Theme" },
    { value: "christmas", label: "Christmas Theme" },
    { value: "halloween", label: "Halloween Theme" },
    { value: "stranger", label: "Stranger Things Theme" },
    { value: "anniversary", label: "Anniversary Theme" },
    { value: "custom", label: "Custom Color Theme" },
  ];

  // Function to reset all custom CSS variables to default
  const resetCustomTheme = () => {
    const root = document.documentElement;
    // Remove all custom CSS properties to return to default values from CSS
    root.style.removeProperty('--bg-primary');
    root.style.removeProperty('--bg-secondary');
    root.style.removeProperty('--bg-tertiary');
    root.style.removeProperty('--bg-card');
    root.style.removeProperty('--bg-hero');
    root.style.removeProperty('--bg-gradient');
    root.style.removeProperty('--text-primary');
    root.style.removeProperty('--text-secondary');
    root.style.removeProperty('--text-tertiary');
    root.style.removeProperty('--text-accent');
    root.style.removeProperty('--text-gold');
    root.style.removeProperty('--border-color');
    root.style.removeProperty('--border-light');
    root.style.removeProperty('--shadow');
  };

  // Apply theme to document root
  useEffect(() => {
    if (theme === "normal") {
      // Reset to normal/default theme
      document.documentElement.removeAttribute("data-theme");
      resetCustomTheme();
      // Reset custom color to default and clear from storage
      localStorage.removeItem("grabamovie_custom_color");
      localStorage.setItem("grabamovie_theme", "normal");
      // Reset custom color state if it's not already default
      if (customColor !== "#6699ff") {
        setCustomColor("#6699ff");
      }
    } else {
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem("grabamovie_theme", theme);

      // If custom color theme, apply custom colors
      if (theme === "custom") {
        applyCustomColorTheme(customColor);
      } else {
        // If switching from custom to another theme, reset custom CSS variables
        resetCustomTheme();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);
  
  // Separate effect for custom color changes (only when theme is custom)
  useEffect(() => {
    if (theme === "custom") {
      applyCustomColorTheme(customColor);
    }
  }, [customColor, theme]);

  // Function to generate custom color theme
  const applyCustomColorTheme = (color) => {
    // Parse the color
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Create darker and lighter variations
    const darken = (amount) => {
      return `rgb(${Math.max(0, r - amount)}, ${Math.max(0, g - amount)}, ${Math.max(0, b - amount)})`;
    };

    const lighten = (amount) => {
      return `rgb(${Math.min(255, r + amount)}, ${Math.min(255, g + amount)}, ${Math.min(255, b + amount)})`;
    };

    // Set CSS variables for custom theme
    const root = document.documentElement;
    root.style.setProperty('--bg-primary', darken(200));
    root.style.setProperty('--bg-secondary', `rgba(${Math.max(0, r - 50)}, ${Math.max(0, g - 50)}, ${Math.max(0, b - 50)}, 0.95)`);
    root.style.setProperty('--bg-tertiary', `rgba(${Math.max(0, r - 100)}, ${Math.max(0, g - 100)}, ${Math.max(0, b - 100)}, 0.95)`);
    root.style.setProperty('--bg-card', `rgba(${Math.max(0, r - 30)}, ${Math.max(0, g - 30)}, ${Math.max(0, b - 30)}, 0.9)`);
    root.style.setProperty('--bg-hero', `linear-gradient(135deg, rgba(${Math.max(0, r - 40)}, ${Math.max(0, g - 40)}, ${Math.max(0, b - 40)}, 0.9), rgba(${Math.max(0, r - 60)}, ${Math.max(0, g - 60)}, ${Math.max(0, b - 60)}, 0.9))`);
    root.style.setProperty('--bg-gradient', `radial-gradient(circle at top, ${darken(150)} 0%, ${darken(200)} 65%, ${darken(250)} 100%)`);
    root.style.setProperty('--text-primary', lighten(150));
    root.style.setProperty('--text-secondary', color);
    root.style.setProperty('--text-tertiary', `rgba(${r}, ${g}, ${b}, 0.7)`);
    root.style.setProperty('--text-accent', lighten(100));
    root.style.setProperty('--text-gold', lighten(50));
    root.style.setProperty('--border-color', `rgba(${r}, ${g}, ${b}, 0.35)`);
    root.style.setProperty('--border-light', `rgba(${r}, ${g}, ${b}, 0.2)`);
    root.style.setProperty('--shadow', `rgba(${r}, ${g}, ${b}, 0.3)`);
  };

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

        // Load ratings and comments for all movies
        const ratingsData = {};
        const commentsData = {};
        for (const movie of data) {
          try {
            const ratingsResult = await getMovieRatings(movie.id);
            ratingsData[movie.id] = ratingsResult;

            const commentsResult = await getMovieComments(movie.id);
            commentsData[movie.id] = commentsResult;
          } catch (error) {
            console.error(`Error loading data for movie ${movie.id}:`, error);
          }
        }
        setMovieRatings(ratingsData);
        setComments(commentsData);
      } catch (error) {
        console.error("Error fetching movies:", error);
        console.error("Full error details:", error);
        // Check if it's a connection error
        if (error.message && (error.message.includes("Failed to fetch") || error.message.includes("NetworkError"))) {
          console.error("⚠️ Backend server might not be running. Make sure to start it with: cd backend && npm start");
        }
        // Fallback to empty array if API fails
        setMovies([]);
      } finally {
        setMoviesLoading(false);
      }
    };

    loadMovies();
  }, []);

  // Load top-rated movies
  useEffect(() => {
    const loadTopRated = async () => {
      setTopRatedLoading(true);
      try {
        const data = await fetchTopRatedMovies(10);
        setTopRatedMovies(data);
      } catch (error) {
        console.error("Error fetching top-rated movies:", error);
        setTopRatedMovies([]);
      } finally {
        setTopRatedLoading(false);
      }
    };

    loadTopRated();
  }, [movieRatings]); // Reload when ratings change

  // Load now playing and upcoming movies from hardcoded 2025 list
  useEffect(() => {
    // Use hardcoded 2025 movies - no API needed
    setNowPlayingMovies(nowPlaying2025);
    setUpcomingMovies(comingSoon2025);
    setNowPlayingLoading(false);
    setUpcomingLoading(false);
  }, []);

  // Load snacks when component mounts or when step changes to snacks
  useEffect(() => {
    const loadSnacks = async () => {
      try {
        setSnacksLoading(true);
        const data = await fetchSnacks();
        console.log("Loaded snacks:", data);
        setSnacks(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching snacks:", error);
        setSnacks([]);
      } finally {
        setSnacksLoading(false);
      }
    };

    // Load snacks on mount
    if (snacks.length === 0) {
      loadSnacks();
    }
  }, []); // Only on mount

  // Also reload snacks when navigating to snacks step (in case they weren't loaded)
  useEffect(() => {
    if (bookingFlow.step === "snacks" && snacks.length === 0 && !snacksLoading) {
      const loadSnacks = async () => {
        try {
          setSnacksLoading(true);
          const data = await fetchSnacks();
          console.log("Reloaded snacks for snacks step:", data);
          setSnacks(Array.isArray(data) ? data : []);
        } catch (error) {
          console.error("Error fetching snacks:", error);
          setSnacks([]);
        } finally {
          setSnacksLoading(false);
        }
      };
      loadSnacks();
    }
  }, [bookingFlow.step]);

  // Search movies as user types
  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery.trim().length === 0) {
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }

      try {
        const results = await searchMovies(searchQuery);
        setSearchResults(results);
        setShowSearchResults(true);
      } catch (error) {
        console.error("Error searching movies:", error);
        setSearchResults([]);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(() => {
      performSearch();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Load user's ratings when user logs in
  useEffect(() => {
    const loadUserRatings = async () => {
      if (currentUser && isAuthenticated && movies.length > 0) {
        try {
          const userRatings = {};
          for (const movie of movies) {
            try {
              const result = await getUserRating(movie.id, currentUser.id);
              if (result.rating) {
                userRatings[movie.id] = result.rating;
              }
            } catch (error) {
              console.error(`Error loading rating for movie ${movie.id}:`, error);
            }
          }
          setRatings(userRatings);
        } catch (error) {
          console.error("Error loading user ratings:", error);
        }
      } else {
        setRatings({});
      }
    };

    loadUserRatings();
  }, [currentUser, isAuthenticated, movies]);

  // Apply filters to movies
  useEffect(() => {
    let filtered = [...movies];

    // Filter by genre
    if (filters.genre) {
      filtered = filtered.filter((movie) => movie.genre === filters.genre);
    }

    // Filter by year
    if (filters.year) {
      filtered = filtered.filter((movie) => movie.year === parseInt(filters.year));
    }

    // Filter by minimum rating
    if (filters.minRating) {
      const minRatingNum = parseFloat(filters.minRating);
      filtered = filtered.filter((movie) => {
        const ratingData = movieRatings[movie.id];
        if (!ratingData || !ratingData.average) return false;
        return ratingData.average >= minRatingNum;
      });
    }

    // Filter by popularity
    if (filters.popularity) {
      filtered = filtered.filter((movie) => {
        const ratingData = movieRatings[movie.id];
        const ratingCount = ratingData?.count || 0;

        if (filters.popularity === "high") {
          return ratingCount >= 5;
        } else if (filters.popularity === "medium") {
          return ratingCount >= 2 && ratingCount < 5;
        } else if (filters.popularity === "low") {
          return ratingCount < 2;
        }
        return true;
      });
    }

    setFilteredMovies(filtered);
  }, [movies, filters, movieRatings]);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showFilters && !event.target.closest(".filter-container")) {
        setShowFilters(false);
      }
    };

    if (showFilters) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showFilters]);

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

  // Load watchlist movies when watchlist page is opened
  useEffect(() => {
    const loadWatchlistMovies = async () => {
      if (currentPage === "watchlist" && currentUser && isAuthenticated && watchlist.size > 0) {
        setWatchlistLoading(true);
        try {
          // Fetch full movie details for all watchlist IDs
          const moviePromises = Array.from(watchlist).map(movieId => fetchMovie(movieId));
          const watchlistMoviesData = await Promise.all(moviePromises);
          setWatchlistMovies(watchlistMoviesData);
        } catch (error) {
          console.error("Error loading watchlist movies:", error);
          setWatchlistMovies([]);
        } finally {
          setWatchlistLoading(false);
        }
      } else if (currentPage === "watchlist" && watchlist.size === 0) {
        setWatchlistMovies([]);
        setWatchlistLoading(false);
      }
    };

    loadWatchlistMovies();
  }, [currentPage, watchlist, currentUser, isAuthenticated]);

  // Load favorites movies when favorites page is opened
  useEffect(() => {
    const loadFavoritesMovies = async () => {
      if (currentPage === "favorites" && currentUser && isAuthenticated && favourites.size > 0) {
        setFavoritesLoading(true);
        try {
          // Fetch full movie details for all favorites IDs
          const moviePromises = Array.from(favourites).map(movieId => fetchMovie(movieId));
          const favoritesMoviesData = await Promise.all(moviePromises);
          setFavoritesMovies(favoritesMoviesData);
        } catch (error) {
          console.error("Error loading favorites movies:", error);
          setFavoritesMovies([]);
        } finally {
          setFavoritesLoading(false);
        }
      } else if (currentPage === "favorites" && favourites.size === 0) {
        setFavoritesMovies([]);
        setFavoritesLoading(false);
      }
    };

    loadFavoritesMovies();
  }, [currentPage, favourites, currentUser, isAuthenticated]);

  // Load personalized recommendations
  useEffect(() => {
    const loadRecommendations = async () => {
      if (currentUser && isAuthenticated && currentPage === "home") {
        setRecommendationsLoading(true);
        try {
          const recommendations = await getRecommendations(currentUser.id);
          setRecommendedMovies(recommendations);
        } catch (error) {
          console.error("Error loading recommendations:", error);
          setRecommendedMovies([]);
        } finally {
          setRecommendationsLoading(false);
        }
      } else {
        setRecommendedMovies([]);
      }
    };

    loadRecommendations();
  }, [currentUser, isAuthenticated, currentPage, ratings, favourites, watchlist]);

  // Load battle data when battle page is opened
  useEffect(() => {
    const loadBattleData = async () => {
      if (currentPage === "battle") {
        setBattleLoading(true);
        try {
          const userId = currentUser?.id || null;
          const battleData = await getDailyBattle(userId);
          setBattle(battleData);
          setHasVoted(battleData.hasVoted || false);

          // Load stats for both movies
          const [stats1, stats2] = await Promise.all([
            getMovieBattleStats(battleData.movie1.id),
            getMovieBattleStats(battleData.movie2.id),
          ]);
          setMovie1Stats(stats1);
          setMovie2Stats(stats2);

          // Load yesterday winner and monthly leader
          const [yesterday, leader] = await Promise.all([
            getYesterdayWinner(),
            getMonthlyLeader(),
          ]);
          setYesterdayWinner(yesterday);
          setMonthlyLeader(leader);
        } catch (error) {
          console.error("Error loading battle data:", error);
          setBattle(null);
        } finally {
          setBattleLoading(false);
        }
      }
    };
    loadBattleData();
  }, [currentPage, currentUser]);

  // Show popup on site open (check localStorage for dismissed state)
  useEffect(() => {
    const hasSeenPopup = localStorage.getItem("battle_popup_dismissed");
    const lastDismissedDate = localStorage.getItem("battle_popup_dismissed_date");
    const today = new Date().toISOString().split('T')[0];
    
    // Show popup if never seen, or if dismissed yesterday or earlier
    if (!hasSeenPopup || lastDismissedDate !== today) {
      setTimeout(() => {
        setShowBattlePopup(true);
      }, 2000); // Show after 2 seconds
    }
  }, []);

  // Load trending movies for leaderboard
  useEffect(() => {
    const loadTrendingMovies = async () => {
      if (currentPage === "home") {
        setTrendingLoading(true);
        try {
          const userId = currentUser?.id || null;
          const movies = await getTrendingMovies(5, userId);
          setTrendingMovies(movies);
        } catch (error) {
          console.error("Error loading trending movies:", error);
          setTrendingMovies([]);
        } finally {
          setTrendingLoading(false);
        }
      }
    };
    loadTrendingMovies();
  }, [currentPage, currentUser]);

  const handleRating = async (movieId, rating) => {
    if (!currentUser) {
      alert("Please sign in to rate movies");
      return;
    }

    try {
      // Ensure IDs are numbers
      const userId = Number(currentUser.id);
      const movieIdNum = Number(movieId);
      const ratingNum = Number(rating);

      if (isNaN(userId) || isNaN(movieIdNum) || isNaN(ratingNum)) {
        throw new Error("Invalid user ID, movie ID, or rating");
      }

      // Save to backend
      await saveRating(userId, movieIdNum, ratingNum);

      // Update local state
      setRatings((prev) => ({ ...prev, [movieId]: ratingNum }));

      // Refresh movie ratings to update average
      const ratingsResult = await getMovieRatings(movieIdNum);
      setMovieRatings((prev) => ({ ...prev, [movieId]: ratingsResult }));

      // Reload top-rated movies to reflect new rating
      const topRated = await fetchTopRatedMovies(10);
      setTopRatedMovies(topRated);
    } catch (error) {
      console.error("Error saving rating:", error);
      const errorMessage = error.message || "Failed to save rating. Make sure the database tables exist (run: npm run init-db in backend folder)";
      alert(errorMessage);
    }
  };

  const handleFavouriteClick = async (movieId) => {
    console.log("handleFavouriteClick called with movieId:", movieId, "type:", typeof movieId);
    if (!currentUser) {
      alert("Please sign in to add favorites");
      return;
    }

    const movieIdNum = Number(movieId);
    const isFavourite = favourites.has(movieIdNum);
    console.log("isFavourite:", isFavourite, "movieIdNum:", movieIdNum);

    try {
      if (isFavourite) {
        // Remove from favourites
        await removeFromFavourites(currentUser.id, movieIdNum);
        setFavourites((prev) => {
          const newSet = new Set(prev);
          newSet.delete(movieIdNum);
          return newSet;
        });
        // Remove from favoritesMovies if on favorites page
        if (currentPage === "favorites") {
          setFavoritesMovies((prev) => prev.filter(movie => movie.id !== movieIdNum));
        }
        // Don't show alert for removal - it's less intrusive
      } else {
        // Add to favourites
        try {
          await addToFavourites(currentUser.id, movieIdNum);
          setFavourites((prev) => new Set([...prev, movieIdNum]));
          // Don't show alert for addition - it's less intrusive
        } catch (addError) {
          // If it's already in favourites (409 conflict), just update the UI
          if (addError.message && addError.message.includes("already")) {
            setFavourites((prev) => new Set([...prev, movieIdNum]));
          } else {
            throw addError;
          }
        }
      }
    } catch (error) {
      console.error("Error toggling favourite:", error);
      // Only show alert for unexpected errors (not 404s or "already" messages)
      if (!error.message || (!error.message.includes("already") && !error.message.includes("not found") && !error.message.includes("not in"))) {
        alert(error.message || "Failed to update favourites");
      }
    }
  };

  const handleWatchlistClick = async (movieId) => {
    console.log("🔥 handleWatchlistClick called with movieId:", movieId, "type:", typeof movieId);
    if (!currentUser) {
      alert("Please sign in to add to watchlist");
      return;
    }

    const movieIdNum = Number(movieId);
    const isInWatchlist = watchlist.has(movieIdNum);
    console.log("isInWatchlist:", isInWatchlist, "movieIdNum:", movieIdNum);

    try {
      if (isInWatchlist) {
        // Remove from watchlist
        await removeFromWatchlist(currentUser.id, movieIdNum);
        setWatchlist((prev) => {
          const newSet = new Set(prev);
          newSet.delete(movieIdNum);
          return newSet;
        });
        // Remove from watchlistMovies if on watchlist page
        if (currentPage === "watchlist") {
          setWatchlistMovies((prev) => prev.filter(movie => movie.id !== movieIdNum));
        }
        // Don't show alert for removal - it's less intrusive
      } else {
        // Add to watchlist
        try {
          await addToWatchlist(currentUser.id, movieIdNum);
          setWatchlist((prev) => new Set([...prev, movieIdNum]));
          // Don't show alert for addition - it's less intrusive
        } catch (addError) {
          // If it's already in watchlist (409 conflict), just update the UI
          if (addError.message && addError.message.includes("already")) {
            setWatchlist((prev) => new Set([...prev, movieIdNum]));
          } else {
            throw addError;
          }
        }
      }
    } catch (error) {
      console.error("Error toggling watchlist:", error);
      // Only show alert for unexpected errors (not 404s or "already" messages)
      if (!error.message || (!error.message.includes("already") && !error.message.includes("not found") && !error.message.includes("not in"))) {
        alert(error.message || "Failed to update watchlist");
      }
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
    setCommentTexts({});
    setEditingComment(null);
  };

  const handleCommentSubmit = async (movieId) => {
    if (!currentUser) {
      alert("Please sign in to leave comments");
      return;
    }

    const commentText = commentTexts[movieId]?.trim();
    if (!commentText) {
      alert("Please enter a comment");
      return;
    }

    try {
      // Ensure IDs are numbers
      const userId = Number(currentUser.id);
      const movieIdNum = Number(movieId);

      if (isNaN(userId) || isNaN(movieIdNum)) {
        throw new Error("Invalid user ID or movie ID");
      }

      const result = await createComment(userId, movieIdNum, commentText);

      // Refresh comments
      const commentsResult = await getMovieComments(movieIdNum);
      setComments((prev) => ({ ...prev, [movieId]: commentsResult }));

      // Clear input
      setCommentTexts((prev) => ({ ...prev, [movieId]: "" }));
    } catch (error) {
      console.error("Error creating comment:", error);
      const errorMessage = error.message || "Failed to create comment. Make sure the database tables exist (run: npm run init-db in backend folder)";
      alert(errorMessage);
    }
  };

  const handleCommentEdit = (movieId, commentId, currentText) => {
    setEditingComment({ movieId, commentId, text: currentText });
  };

  const handleCommentUpdate = async () => {
    if (!editingComment || !currentUser) return;

    const { movieId, commentId, text } = editingComment;
    if (!text.trim()) {
      alert("Comment cannot be empty");
      return;
    }

    try {
      await updateComment(commentId, currentUser.id, text);

      // Refresh comments
      const commentsResult = await getMovieComments(movieId);
      setComments((prev) => ({ ...prev, [movieId]: commentsResult }));

      setEditingComment(null);
    } catch (error) {
      console.error("Error updating comment:", error);
      alert(error.message || "Failed to update comment");
    }
  };

  const handleCommentDelete = async (movieId, commentId) => {
    if (!currentUser) return;

    if (!confirm("Are you sure you want to delete this comment?")) {
      return;
    }

    try {
      await deleteComment(commentId, currentUser.id);

      // Refresh comments
      const commentsResult = await getMovieComments(movieId);
      setComments((prev) => ({ ...prev, [movieId]: commentsResult }));
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert(error.message || "Failed to delete comment");
    }
  };

  const handleMovieClick = async (movieId) => {
    try {
      // Scroll to top immediately before loading
      window.scrollTo(0, 0);
      
      // Save the current page before showing movie detail
      setPreviousPage(currentPage);
      
      // Reset quiz state when clicking a movie
      setShowQuiz(false);
      setQuizQuestions([]);
      setQuizAnswers({});
      setQuizSubmitted(false);
      
      // Fetch full movie details
      const movie = await fetchMovie(movieId);
      setSelectedMovie(movie);

      // Fetch actors for the movie
      setActorsLoading((prev) => ({ ...prev, [movieId]: true }));
      try {
        const actorsData = await fetchMovieActors(movieId);
        setActors((prev) => ({ ...prev, [movieId]: actorsData.actors || [] }));
      } catch (actorError) {
        console.error("Error fetching actors:", actorError);
        setActors((prev) => ({ ...prev, [movieId]: [] })); // Set empty array on error
      } finally {
        setActorsLoading((prev) => ({ ...prev, [movieId]: false }));
      }

      // Scroll to top again after content loads (with a small delay to ensure DOM is updated)
      setTimeout(() => {
        window.scrollTo(0, 0);
      }, 100);
    } catch (error) {
      console.error("Error loading movie details:", error);
      alert("Failed to load movie details");
      // Reset state on error
      setSelectedMovie(null);
      setShowQuiz(false);
    }
  };

  const handleBackToList = () => {
    setSelectedMovie(null);
    setShowQuiz(false);
    setQuizQuestions([]);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setShowProfile(false);
    setProfileEditMode(false);
    // Return to the page we came from before viewing the movie
    setCurrentPage(previousPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleTakeQuiz = async () => {
    if (!selectedMovie) return;
    
    setQuizLoading(true);
    setQuizAnswers({});
    setQuizSubmitted(false);
    
    try {
      const questions = await getQuizQuestions(selectedMovie.id);
      if (!questions || !Array.isArray(questions) || questions.length === 0) {
        throw new Error("No quiz questions available for this movie");
      }
      setQuizQuestions(questions);
      setShowQuiz(true);
      window.scrollTo(0, 0);
    } catch (error) {
      console.error("Error loading quiz:", error);
      const errorMessage = error.message || "Failed to load quiz questions. Please try again.";
      alert(errorMessage);
    } finally {
      setQuizLoading(false);
    }
  };

  const handleQuizAnswer = (questionIndex, answer) => {
    if (quizSubmitted) return;
    setQuizAnswers(prev => ({ ...prev, [questionIndex]: answer }));
  };

  const handleQuizSubmit = async () => {
    if (!selectedMovie || !quizQuestions || quizQuestions.length === 0) return;

    try {
      // Calculate score
      const score = Object.keys(quizAnswers).reduce((total, index) => {
        const userAnswer = quizAnswers[index];
        const correctAnswer = quizQuestions[index].correctAnswer;
        return total + (userAnswer === correctAnswer ? 1 : 0);
      }, 0);

      const totalQuestions = quizQuestions.length;
      const userId = currentUser?.id || null;

      // Submit results to database
      await submitQuizResult(
        selectedMovie.id,
        userId,
        score,
        totalQuestions,
        quizAnswers
      );

      setQuizSubmitted(true);
    } catch (error) {
      console.error("Error submitting quiz:", error);
      alert("Failed to save quiz results. Please try again.");
    }
  };

  const handleBackFromQuiz = () => {
    setShowQuiz(false);
    setQuizQuestions([]);
    setQuizAnswers({});
    setQuizSubmitted(false);
    window.scrollTo(0, 0);
  };

  const handleBattleVote = async (votedForMovieId) => {
    if (!battle || hasVoted) return;

    try {
      const userId = currentUser?.id || null;
      const result = await submitBattleVote(battle.id, votedForMovieId, userId);
      
      // Update battle state with new vote counts
      setBattle(prev => ({
        ...prev,
        movie1Votes: result.movie1Votes,
        movie2Votes: result.movie2Votes,
      }));
      setHasVoted(true);

      // Reload stats for both movies
      const [stats1, stats2] = await Promise.all([
        getMovieBattleStats(battle.movie1.id),
        getMovieBattleStats(battle.movie2.id),
      ]);
      setMovie1Stats(stats1);
      setMovie2Stats(stats2);
    } catch (error) {
      console.error("Error submitting vote:", error);
      alert(error.message || "Failed to submit vote. Please try again.");
    }
  };

  const handleBattlePageClick = () => {
    setCurrentPage("battle");
    setShowBattlePopup(false);
    window.scrollTo(0, 0);
  };

  const handleDismissBattlePopup = () => {
    setShowBattlePopup(false);
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem("battle_popup_dismissed", "true");
    localStorage.setItem("battle_popup_dismissed_date", today);
  };

  const handleTrendingVote = async (movieId) => {
    try {
      const userId = currentUser?.id || null;
      const result = await submitTrendingVote(movieId, userId);
      
      // Update the movie's vote count in the list
      setTrendingMovies(prev => prev.map(movie => 
        movie.id === movieId 
          ? { ...movie, votes: result.votes, hasVoted: true }
          : movie
      ));
      
      // Sort by votes descending
      setTrendingMovies(prev => [...prev].sort((a, b) => b.votes - a.votes));
    } catch (error) {
      console.error("Error submitting trending vote:", error);
      alert(error.message || "Failed to submit vote. You may have already voted for this movie this month.");
    }
  };

  const handleAddTrendingMovie = async () => {
    if (!newMovieTitle.trim()) {
      alert("Please enter a movie title");
      return;
    }

    try {
      const userId = currentUser?.id || null;
      const result = await addTrendingMovie(null, newMovieTitle.trim(), null, userId);
      
      // Add the new movie to the list
      setTrendingMovies(prev => [...prev, { ...result.movie, hasVoted: false }].sort((a, b) => b.votes - a.votes));
      
      setNewMovieTitle("");
      setShowAddMovieModal(false);
    } catch (error) {
      console.error("Error adding trending movie:", error);
      alert(error.message || "Failed to add movie. It may already be in the list.");
    }
  };

  // Dynamic mood-based backgrounds based on selected movie genre
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    
    if (selectedMovie && selectedMovie.genre) {
      const genre = selectedMovie.genre.toLowerCase().trim();
      
      // Map genres to mood backgrounds - comprehensive genre matching
      let moodClass = "";
      
      // Crime (dark red, gloomy - similar to horror)
      if (genre === "crime" || genre.includes("crime")) {
        moodClass = "mood-crime";
      }
      // Horror/Thriller (dark red, black, gray)
      else if (genre === "horror" || genre === "thriller" || genre.includes("horror") || genre.includes("thriller")) {
        moodClass = "mood-horror";
      }
      // Romance (soft pink, warm)
      else if (genre === "romance" || genre === "romantic" || genre.includes("romance") || genre.includes("romantic")) {
        moodClass = "mood-romance";
      }
      // Sci-Fi/Fantasy (neon blue, cyan)
      else if (genre === "sci-fi" || genre === "science fiction" || genre === "fantasy" || 
               genre.includes("sci-fi") || genre.includes("science") || genre.includes("fantasy")) {
        moodClass = "mood-scifi";
      }
      // Action/Adventure (metallic, sharp gradients)
      else if (genre === "action" || genre === "adventure" || genre.includes("action") || genre.includes("adventure")) {
        moodClass = "mood-action";
      }
      // Comedy (warm yellow, bright)
      else if (genre === "comedy" || genre.includes("comedy")) {
        moodClass = "mood-comedy";
      }
      // Drama (deep purple, moody)
      else if (genre === "drama" || genre.includes("drama")) {
        moodClass = "mood-drama";
      }
      // Default fallback
      else {
        moodClass = "mood-default";
      }
      
      root.setAttribute("data-mood", moodClass);
      body.setAttribute("data-mood", moodClass);
      
      console.log(`🎨 Applied mood background: ${moodClass} for genre: "${selectedMovie.genre}"`);
    } else {
      root.removeAttribute("data-mood");
      body.removeAttribute("data-mood");
    }
    
    return () => {
      // Cleanup on unmount
      root.removeAttribute("data-mood");
      body.removeAttribute("data-mood");
    };
  }, [selectedMovie]);

  // Scroll to top when movie detail page opens
  useEffect(() => {
    if (selectedMovie) {
      // Scroll immediately and also after a short delay to ensure DOM is updated
      window.scrollTo(0, 0);
      const timeoutId = setTimeout(() => {
        window.scrollTo(0, 0);
        // Also try scrolling the main container if it exists
        const mainElement = document.querySelector('main');
        if (mainElement) {
          mainElement.scrollTop = 0;
        }
        const pageElement = document.querySelector('.page');
        if (pageElement) {
          pageElement.scrollTop = 0;
        }
        
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [selectedMovie, currentUser]);

  const handleHomeClick = (e) => {
    e.preventDefault();
    // Close profile and selected movie views
    setShowProfile(false);
    setSelectedMovie(null);
    setProfileEditMode(false);
    setShowAdminPanel(false);
    window.location.hash = "";
    // Switch to home page
    setCurrentPage("home");
    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRatingsClick = (e) => {
    e.preventDefault();
    // Close profile and selected movie views
    setShowProfile(false);
    setSelectedMovie(null);
    setProfileEditMode(false);
    setShowAdminPanel(false);
    window.location.hash = "";
    // Switch to ratings page
    setCurrentPage("ratings");
    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleWatchlistPageClick = (e) => {
    e.preventDefault();
    // Close profile and selected movie views
    setShowProfile(false);
    setProfileEditMode(false);
    setSelectedMovie(null);
    setShowAdminPanel(false);
    window.location.hash = "";
    // Switch to watchlist page
    setCurrentPage("watchlist");
    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFavoritesPageClick = (e) => {
    e.preventDefault();
    // Close profile and selected movie views
    setShowProfile(false);
    setProfileEditMode(false);
    setSelectedMovie(null);
    setShowAdminPanel(false);
    window.location.hash = "";
    // Switch to favorites page
    setCurrentPage("favorites");
    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNewlyReleasedPageClick = (e) => {
    e.preventDefault();
    // Close profile and selected movie views
    setShowProfile(false);
    setProfileEditMode(false);
    setSelectedMovie(null);
    // Switch to newly released page
    setCurrentPage("newly-released");
    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Booking flow handlers
  const handleBuyTicket = async (movie) => {
    if (!isAuthenticated || !currentUser) {
      alert("Please sign in to book tickets");
      return;
    }

    try {
      // Determine movie identifier - use database ID for regular movies
      // Regular movies from database have numeric id, newly released have tmdbId
      if (!movie.id && !movie.tmdbId) {
        throw new Error("Movie must have either id or tmdbId");
      }
      
      // Try to get existing showings using movie.id (database ID) first
      let showings = [];
      let movieIdentifier = movie.id;
      
      // For newly released movies with fake tmdbId (2025xxx), we need to create movie in DB first
      // For regular movies, use the database id directly
      if (movie.id && typeof movie.id === 'number' && movie.id < 10000) {
        // This is a regular database movie ID
        movieIdentifier = movie.id;
      } else if (movie.tmdbId && movie.tmdbId >= 2025000) {
        // This is a fake 2025 movie ID - we'll need to handle it differently
        // For now, try to find by tmdbId or create movie
        movieIdentifier = movie.tmdbId;
      } else if (movie.id) {
        movieIdentifier = movie.id;
      } else {
        movieIdentifier = movie.tmdbId;
      }
      
      try {
        showings = await getShowings(movieIdentifier);
      } catch (err) {
        console.log("No existing showings found, will create new one:", err.message);
      }
      
      // If no showings exist, create one
      if (showings.length === 0) {
        // Create a default showing (tomorrow at 7 PM)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(19, 0, 0, 0);
        
        const showingData = {
          showtime: tomorrow.toISOString(),
          theaterName: "Main Theater",
          totalSeats: 80,
        };
        
        // Add movie identifier - prefer database ID over tmdbId
        if (movie.id && typeof movie.id === 'number' && movie.id < 10000) {
          // Regular database movie
          showingData.movieId = movie.id;
        } else if (movie.tmdbId && movie.tmdbId >= 2025000) {
          // Fake 2025 movie - need to provide movie data to backend
          showingData.tmdbId = movie.tmdbId;
          showingData.movieTitle = movie.title;
          showingData.movieYear = movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : 2025;
          showingData.movieGenre = movie.genre || "Unknown";
          showingData.movieDescription = movie.overview || "";
          showingData.moviePoster = movie.posterPath || null;
        } else if (movie.tmdbId) {
          // Real TMDB ID
          showingData.tmdbId = movie.tmdbId;
        } else if (movie.id) {
          showingData.movieId = movie.id;
        } else {
          throw new Error("Movie ID is required");
        }
        
        const showing = await createShowing(showingData);
        showings = [showing];
      }

      if (!showings[0] || !showings[0].id) {
        throw new Error("Failed to create or retrieve showing");
      }

      // Initialize booking flow with first showing
      setBookingFlow({
        step: "seats",
        movie: movie,
        showing: showings[0],
        seats: [],
        snacks: [],
        totalAmount: 0,
      });

      // Load seats for the showing
      const seats = await getSeats(showings[0].id);
      if (!seats || seats.length === 0) {
        throw new Error("No seats available for this showing");
      }
      setAvailableSeats(seats);
      
      setCurrentPage("booking");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("Error starting booking:", error);
      console.error("Movie data:", movie);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        movieId: movie.id,
        tmdbId: movie.tmdbId,
      });
      
      // Show more helpful error message
      let errorMsg = "Failed to start booking. ";
      if (error.message) {
        errorMsg += error.message;
      } else {
        errorMsg += "Please make sure you're signed in and try again.";
      }
      alert(errorMsg);
    }
  };

  const handleSeatSelect = (seatId) => {
    setBookingFlow((prev) => {
      const isSelected = prev.seats.includes(seatId);
      const newSeats = isSelected
        ? prev.seats.filter((id) => id !== seatId)
        : [...prev.seats, seatId];
      
      // Calculate seat cost (assuming $12 per seat)
      const seatCost = newSeats.length * 12;
      const snackCost = prev.snacks.reduce((sum, snack) => sum + (parseFloat(snack.price) || 0) * snack.quantity, 0);
      
      return {
        ...prev,
        seats: newSeats,
        totalAmount: seatCost + snackCost,
      };
    });
  };

  const handleSeatsContinue = () => {
    if (bookingFlow.seats.length === 0) {
      alert("Please select at least one seat");
      return;
    }
    setBookingFlow((prev) => ({ ...prev, step: "snacks" }));
  };

  const handleSnackAdd = (snack) => {
    setBookingFlow((prev) => {
      const existing = prev.snacks.find((s) => s.snackId === snack.id);
      let newSnacks;
      
      if (existing) {
        newSnacks = prev.snacks.map((s) =>
          s.snackId === snack.id
            ? { ...s, quantity: s.quantity + 1 }
            : s
        );
      } else {
        newSnacks = [...prev.snacks, { snackId: snack.id, quantity: 1, price: parseFloat(snack.price) || 0 }];
      }
      
      const seatCost = prev.seats.length * 12;
      const snackCost = newSnacks.reduce((sum, s) => sum + (parseFloat(s.price) || 0) * s.quantity, 0);
      
      return {
        ...prev,
        snacks: newSnacks,
        totalAmount: seatCost + snackCost,
      };
    });
  };

  const handleSnackRemove = (snackId) => {
    setBookingFlow((prev) => {
      const newSnacks = prev.snacks
        .map((s) => (s.snackId === snackId ? { ...s, quantity: s.quantity - 1 } : s))
        .filter((s) => s.quantity > 0);
      
      const seatCost = prev.seats.length * 12;
      const snackCost = newSnacks.reduce((sum, s) => sum + (parseFloat(s.price) || 0) * s.quantity, 0);
      
      return {
        ...prev,
        snacks: newSnacks,
        totalAmount: seatCost + snackCost,
      };
    });
  };

  const handleSnacksContinue = () => {
    setBookingFlow((prev) => ({ ...prev, step: "checkout" }));
  };

  const handleCheckoutConfirm = async () => {
    if (!currentUser) return;

    try {
      // Get the database movie ID from the showing
      // The showing already has the correct movie_id
      const booking = await createBooking({
        userId: currentUser.id,
        movieId: bookingFlow.showing.movie_id, // Use the movie_id from showing
        showingId: bookingFlow.showing.id,
        seatIds: bookingFlow.seats,
        snacks: bookingFlow.snacks,
        totalAmount: bookingFlow.totalAmount,
      });

      setBookingFlow((prev) => ({ ...prev, step: "confirmation", booking }));
    } catch (error) {
      console.error("Error creating booking:", error);
      alert("Failed to complete booking. Please try again.");
    }
  };

  const handleBookingClose = () => {
    setBookingFlow({
      step: null,
      movie: null,
      showing: null,
      seats: [],
      snacks: [],
      totalAmount: 0,
    });
    setCurrentPage("home");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleProfileClick = async () => {
    if (!currentUser) return;

    try {
      setShowProfile(true);
      setSelectedMovie(null);

      // Load user profile
      const profile = await getUserProfile(currentUser.id);
      setUserProfile(profile);
      const savedTheme = profile.theme_preference || "dark";
      setProfileForm({
        username: profile.username || "",
        email: profile.email || "",
        password: "",
        profilePictureUrl: profile.profile_picture_url || "",
        themePreference: savedTheme,
      });

      // Apply saved theme if different
      if (savedTheme !== theme) {
        setTheme(savedTheme);
      }

      // If custom theme, load custom color
      if (savedTheme === "custom") {
        const savedColor = localStorage.getItem("grabamovie_custom_color") || "#6699ff";
        setCustomColor(savedColor);
      } else if (savedTheme === "normal") {
        // Reset custom color for normal theme
        setCustomColor("#6699ff");
      }

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("Error loading profile:", error);
      alert("Failed to load profile");
    }
  };

  const handleProfileUpdate = async () => {
    if (!currentUser) return;

    try {
      const updateData = {};
      if (profileForm.username && profileForm.username !== userProfile.username) {
        updateData.username = profileForm.username;
      }
      if (profileForm.email !== undefined) {
        updateData.email = profileForm.email;
      }
      if (profileForm.password && profileForm.password.length >= 3) {
        updateData.password = profileForm.password;
      }
      if (profileForm.profilePictureUrl !== undefined) {
        updateData.profilePictureUrl = profileForm.profilePictureUrl;
      }
      if (profileForm.themePreference) {
        updateData.themePreference = profileForm.themePreference;
      }

      if (Object.keys(updateData).length === 0) {
        alert("No changes to save");
        return;
      }

      const result = await updateUserProfile(currentUser.id, updateData);

      // Update current user
      const updatedUser = { ...currentUser, ...result.user };
      setCurrentUser(updatedUser);
      localStorage.setItem("grabamovie_user", JSON.stringify(updatedUser));

      // Update theme if changed
      if (updateData.themePreference) {
        setTheme(updateData.themePreference);
        localStorage.setItem("grabamovie_theme", updateData.themePreference);

        // If switching to custom, ensure custom color is applied
        if (updateData.themePreference === "custom") {
          const savedColor = localStorage.getItem("grabamovie_custom_color") || customColor;
          setCustomColor(savedColor);
        } else if (updateData.themePreference === "normal") {
          // Reset custom color when switching to normal
          setCustomColor("#6699ff");
          localStorage.removeItem("grabamovie_custom_color");
        }
      }

      // Reload profile
      const profile = await getUserProfile(currentUser.id);
      setUserProfile(profile);
      setProfileEditMode(false);
      setProfileForm((prev) => ({ ...prev, password: "" })); // Clear password field

      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert(error.message || "Failed to update profile");
    }
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
        
        // Check if user is admin and redirect if so
        try {
          const profile = await getUserProfile(data.user.id);
          // Handle both boolean true/false and string "true"/"false"
          const adminStatus = profile.is_admin === true || profile.is_admin === "true" || profile.is_admin === 1;
          console.log("Login admin check:", { userId: data.user.id, is_admin: profile.is_admin, adminStatus });
          setIsAdmin(adminStatus);
          
          // Don't auto-redirect - admin can click button to access panel when ready
        } catch (err) {
          console.error("Error checking admin status:", err);
          setIsAdmin(false);
        }
        
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

  // Check admin status when user is loaded from localStorage
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (currentUser && isAuthenticated) {
        try {
          const profile = await getUserProfile(currentUser.id);
          // Handle both boolean true/false and string "true"/"false"
          const adminStatus = profile.is_admin === true || profile.is_admin === "true" || profile.is_admin === 1;
          console.log("Admin status check:", { userId: currentUser.id, is_admin: profile.is_admin, adminStatus });
          setIsAdmin(adminStatus);
          
          // Don't auto-redirect - admin can click button to access panel
          // Admin button will be visible in navigation when isAdmin is true
        } catch (err) {
          console.error("Error checking admin status:", err);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    };
    checkAdminStatus();
  }, [currentUser, isAuthenticated, shouldRedirectToAdmin]);

  // Check URL hash on mount and when hash changes
  useEffect(() => {
    const checkHash = () => {
      if (window.location.hash === "#admin" && currentUser && isAdmin) {
        setShowAdminPanel(true);
      } else if (window.location.hash === "#admin" && (!currentUser || !isAdmin)) {
        // If not admin, remove hash and show error
        window.location.hash = "";
        alert("Access denied. Admin privileges required.");
      }
    };

    checkHash();
    window.addEventListener("hashchange", checkHash);
    return () => window.removeEventListener("hashchange", checkHash);
  }, [currentUser, isAdmin]);

  // Show admin panel if requested or if hash is #admin
  if ((showAdminPanel || window.location.hash === "#admin") && currentUser && isAdmin) {
    return (
      <AdminPanel
        currentUser={currentUser}
        onBack={() => {
          setShowAdminPanel(false);
          window.location.hash = "";
        }}
      />
    );
  }
  
  // If hash is #admin but user is not admin, show access denied
  if (window.location.hash === "#admin" && (!currentUser || !isAdmin)) {
    return (
      <div className="page" style={{ 
        padding: "50px", 
        textAlign: "center", 
        minHeight: "100vh", 
        display: "flex", 
        flexDirection: "column", 
        justifyContent: "center", 
        alignItems: "center",
        background: "#1a1a1a",
        color: "#fff"
      }}>
        <h1 style={{ color: "#ff6b6b", marginBottom: "20px", fontSize: "2.5rem" }}>Access Denied</h1>
        <p style={{ color: "#ccc", marginBottom: "30px", fontSize: "1.2rem" }}>You must be an administrator to access this panel.</p>
        <button 
          onClick={() => { window.location.hash = ""; }} 
          style={{
            padding: "12px 24px",
            background: "#4caf50",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "bold"
          }}
        >
          Go Back
        </button>
      </div>
    );
  }

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
        {/* Admin notification banner - Removed to avoid clutter, button in nav is enough */}
        <header className="site-header">
          <div className={`brand brand-${theme}`} data-theme={theme}>GRABAMOVIE</div>
          <div className="header-right">
            <nav>
              <a href="#hero" onClick={handleHomeClick}>Home</a>
            </nav>
            <div className="search-container">
              <input
                type="text"
                className="search-input"
                placeholder="Search movies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchResults.length > 0) setShowSearchResults(true);
                }}
                onBlur={() => {
                  // Delay hiding to allow clicking on results
                  setTimeout(() => setShowSearchResults(false), 200);
                }}
              />
              {showSearchResults && searchResults.length > 0 && (
                <div className="search-results">
                  {searchResults.map((movie) => (
                    <div
                      key={movie.id}
                      className="search-result-item"
                      onClick={() => {
                        handleMovieClick(movie.id);
                        setSearchQuery("");
                        setShowSearchResults(false);
                      }}
                    >
                      {movie.poster_url && movie.poster_url.trim() !== '' && movie.poster_url !== 'N/A' && (movie.poster_url.startsWith('http') || movie.poster_url.startsWith('//')) ? (
                        <img
                          src={movie.poster_url.startsWith('//') ? `https:${movie.poster_url}` : movie.poster_url}
                          alt={movie.title}
                          className="search-result-poster"
                          onError={(e) => {
                            // If image fails to load, hide it and show placeholder
                            e.target.style.display = "none";
                            const container = e.target.parentElement;
                            if (container && !container.querySelector('.search-result-poster-placeholder')) {
                              const placeholder = document.createElement('div');
                              placeholder.className = 'search-result-poster-placeholder';
                              placeholder.textContent = '🎬';
                              container.insertBefore(placeholder, e.target);
                            }
                          }}
                        />
                      ) : (
                        <div className="search-result-poster-placeholder">🎬</div>
                      )}
                      <div className="search-result-info">
                        <div className="search-result-title">{movie.title}</div>
                        <div className="search-result-meta">
                          {movie.year} • {movie.genre}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="filter-container">
              <button
                className="filter-btn"
                onClick={() => setShowFilters(!showFilters)}
                title="Filter movies"
                aria-label="Filter movies"
              >
                🔍 Filter
              </button>
              {showFilters && (
                <div className="filter-dropdown">
                  <div className="filter-section">
                    <label>Genre</label>
                    <select
                      value={filters.genre}
                      onChange={(e) =>
                        setFilters((prev) => ({ ...prev, genre: e.target.value }))
                      }
                    >
                      <option value="">All Genres</option>
                      {Array.from(new Set(movies.map((m) => m.genre))).map((genre) => (
                        <option key={genre} value={genre}>
                          {genre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="filter-section">
                    <label>Release Year</label>
                    <select
                      value={filters.year}
                      onChange={(e) =>
                        setFilters((prev) => ({ ...prev, year: e.target.value }))
                      }
                    >
                      <option value="">All Years</option>
                      {Array.from(new Set(movies.map((m) => m.year)))
                        .sort((a, b) => b - a)
                        .map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="filter-section">
                    <label>Minimum Rating</label>
                    <select
                      value={filters.minRating}
                      onChange={(e) =>
                        setFilters((prev) => ({ ...prev, minRating: e.target.value }))
                      }
                    >
                      <option value="">Any Rating</option>
                      <option value="4">4+ Stars</option>
                      <option value="3">3+ Stars</option>
                      <option value="2">2+ Stars</option>
                      <option value="1">1+ Stars</option>
                    </select>
                  </div>
                  <div className="filter-section">
                    <label>Popularity</label>
                    <select
                      value={filters.popularity}
                      onChange={(e) =>
                        setFilters((prev) => ({ ...prev, popularity: e.target.value }))
                      }
                    >
                      <option value="">Any Popularity</option>
                      <option value="high">High (5+ ratings)</option>
                      <option value="medium">Medium (2-4 ratings)</option>
                      <option value="low">Low (0-1 ratings)</option>
                    </select>
                  </div>
                  <div className="filter-actions">
                    <button
                      className="filter-clear-btn"
                      onClick={() => {
                        setFilters({ genre: "", year: "", minRating: "", popularity: "" });
                      }}
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="theme-toggle-container">
              <button
                className="theme-toggle-btn"
                onClick={() => {
                  const newTheme = theme === "dark" ? "light" : "dark";
                  setTheme(newTheme);
                }}
                title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              >
                {theme === "dark" ? "☀️" : "🌙"}
              </button>
            </div>
            {isAuthenticated && currentUser && (
              <div className="user-section">
                <span className="user-name">{currentUser.username}</span>
                <button className="logout-btn" onClick={handleLogout} title="Log out">
                  Log Out
                </button>
              </div>
            )}
          </div>
        </header>

        <main>
          {showProfile && userProfile ? (
            <section className="profile-area">
              <button className="back-btn" onClick={handleBackToList}>
                ← Back to Movies
              </button>

              <div className="profile-container">
                <div className="profile-header">
                  {userProfile.profile_picture_url ? (
                    <img
                      src={userProfile.profile_picture_url}
                      alt={userProfile.username}
                      className="profile-picture"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="profile-picture-placeholder">
                      {userProfile.username.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="profile-info">
                    <h1>{userProfile.username}</h1>
                    {userProfile.email && <p className="profile-email">{userProfile.email}</p>}
                    <p className="profile-joined">
                      Joined {new Date(userProfile.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="profile-edit-form">
                  <h2>Edit Profile</h2>
                  <div className="form-group">
                    <label>Username</label>
                    <input
                      type="text"
                      value={profileForm.username}
                      onChange={(e) =>
                        setProfileForm((prev) => ({ ...prev, username: e.target.value }))
                      }
                      placeholder="Username"
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) =>
                        setProfileForm((prev) => ({ ...prev, email: e.target.value }))
                      }
                      placeholder="Email (optional)"
                    />
                  </div>
                  <div className="form-group">
                    <label>New Password</label>
                    <input
                      type="password"
                      value={profileForm.password}
                      onChange={(e) =>
                        setProfileForm((prev) => ({ ...prev, password: e.target.value }))
                      }
                      placeholder="Leave blank to keep current password"
                    />
                  </div>
                  <div className="form-group">
                    <label>Profile Picture URL</label>
                    <input
                      type="url"
                      value={profileForm.profilePictureUrl}
                      onChange={(e) =>
                        setProfileForm((prev) => ({ ...prev, profilePictureUrl: e.target.value }))
                      }
                      placeholder="https://example.com/picture.jpg"
                    />
                  </div>
                  <div className="form-group">
                    <label>Theme Preference</label>
                    <select
                      value={profileForm.themePreference}
                      onChange={(e) => {
                        const newTheme = e.target.value;
                        setProfileForm((prev) => ({ ...prev, themePreference: newTheme }));
                        // Preview theme change immediately
                        setTheme(newTheme);
                        // If switching to normal, reset custom color
                        if (newTheme === "normal") {
                          setCustomColor("#6699ff");
                        }
                      }}
                    >
                      {availableThemes.map((themeOption) => (
                        <option key={themeOption.value} value={themeOption.value}>
                          {themeOption.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {profileForm.themePreference === "custom" && (
                    <div className="form-group">
                      <label>Choose Your Color</label>
                      <div className="color-picker-container">
                        <input
                          type="color"
                          value={customColor}
                          onChange={(e) => {
                            const newColor = e.target.value;
                            setCustomColor(newColor);
                            setTheme("custom");
                            // Save custom color to localStorage
                            localStorage.setItem("grabamovie_custom_color", newColor);
                          }}
                          className="color-picker"
                        />
                        <input
                          type="text"
                          value={customColor}
                          onChange={(e) => {
                            const newColor = e.target.value;
                            if (/^#[0-9A-F]{6}$/i.test(newColor)) {
                              setCustomColor(newColor);
                              setTheme("custom");
                              localStorage.setItem("grabamovie_custom_color", newColor);
                            }
                          }}
                          placeholder="#6699ff"
                          className="color-input"
                        />
                      </div>
                      <p className="color-picker-hint">Pick any color to customize your theme!</p>
                    </div>
                  )}
                  <button className="profile-save-btn" onClick={handleProfileUpdate}>
                    Save Changes
                  </button>
                </div>
              </div>
            </section>
          ) : showQuiz && selectedMovie ? (
            <section className="quiz-area">
              <button className="back-btn" onClick={handleBackFromQuiz}>
                ← Back to Movie
              </button>
              
              <div className="quiz-container">
                <h1 className="quiz-title">Movie Quiz: {selectedMovie.title}</h1>
                
                {quizLoading ? (
                  <div className="quiz-loading">Loading quiz questions...</div>
                ) : quizQuestions.length === 0 ? (
                  <div className="quiz-error">
                    <p>No quiz questions available for this movie.</p>
                    <button onClick={handleBackFromQuiz} className="quiz-back-btn">
                      Go Back
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="quiz-questions">
                      {quizQuestions.map((question, index) => {
                        const userAnswer = quizAnswers[index];
                        // Normalize answers for comparison (handle 9/10 vs 9.0/10)
                        const normalizeAnswer = (answer) => {
                          if (!answer) return null;
                          // Extract number from "X/10" or "X.0/10" format
                          const match = answer.toString().match(/(\d+\.?\d*)\/10/);
                          return match ? parseFloat(match[1]) : null;
                        };
                        const userAnswerValue = normalizeAnswer(userAnswer);
                        const correctAnswerValue = normalizeAnswer(question.correctAnswer);
                        const isCorrect = userAnswerValue !== null && correctAnswerValue !== null && 
                                          Math.abs(userAnswerValue - correctAnswerValue) < 0.01;
                        const showResult = quizSubmitted;

                        return (
                          <div key={index} className="quiz-question">
                            <div className="quiz-question-header">
                              <span className="question-number">Question {index + 1}</span>
                              <span className="question-category">{question.category}</span>
                            </div>
                            <h3 className="question-text">{question.question}</h3>
                            <div className="quiz-options">
                              {question.options.map((option, optIndex) => {
                                const isSelected = userAnswer === option;
                                const isCorrectOption = option === question.correctAnswer;
                                let optionClass = "quiz-option";
                                
                                if (showResult) {
                                  if (isCorrectOption) {
                                    optionClass += " correct";
                                  } else if (isSelected && !isCorrectOption) {
                                    optionClass += " incorrect";
                                  }
                                } else if (isSelected) {
                                  optionClass += " selected";
                                }

                                return (
                                  <button
                                    key={optIndex}
                                    className={optionClass}
                                    onClick={() => handleQuizAnswer(index, option)}
                                    disabled={quizSubmitted}
                                  >
                                    {showResult && isCorrectOption && "✓ "}
                                    {showResult && isSelected && !isCorrectOption && "✗ "}
                                    {option}
                                  </button>
                                );
                              })}
                            </div>
                            {showResult && (
                              <div className={`quiz-feedback ${isCorrect ? "correct-feedback" : "incorrect-feedback"}`}>
                                {isCorrect ? (
                                  <span>✓ Correct!</span>
                                ) : (
                                  <span>✗ Incorrect. The correct answer is: <strong>{question.correctAnswer}</strong></span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {!quizSubmitted && (
                      <div className="quiz-actions">
                        <button
                          className="quiz-submit-btn"
                          onClick={handleQuizSubmit}
                          disabled={Object.keys(quizAnswers).length < quizQuestions.length}
                        >
                          Submit Quiz
                        </button>
                        <p className="quiz-progress">
                          Answered {Object.keys(quizAnswers).length} of {quizQuestions.length} questions
                        </p>
                      </div>
                    )}

                    {quizSubmitted && (
                      <div className="quiz-results">
                        <h2>Quiz Results</h2>
                        <div className="quiz-score">
                          {Object.keys(quizAnswers).reduce((score, index) => {
                            return score + (quizAnswers[index] === quizQuestions[index].correctAnswer ? 1 : 0);
                          }, 0)} / {quizQuestions.length}
                        </div>
                        <p className="quiz-percentage">
                          {Math.round(
                            (Object.keys(quizAnswers).reduce((score, index) => {
                              return score + (quizAnswers[index] === quizQuestions[index].correctAnswer ? 1 : 0);
                            }, 0) / quizQuestions.length) * 100
                          )}% Correct
                        </p>
                        <button onClick={handleBackFromQuiz} className="quiz-back-btn">
                          Back to Movie
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </section>
          ) : selectedMovie ? (
            <section className="movie-detail-area">
              <button className="back-btn" onClick={handleBackToList}>
                ← Back to Movies
              </button>

              <div className="movie-detail">
                <div className="movie-detail-header">
                  {selectedMovie?.poster_url && selectedMovie.poster_url.trim() !== '' && selectedMovie.poster_url !== 'N/A' && (selectedMovie.poster_url.startsWith('http') || selectedMovie.poster_url.startsWith('//') || selectedMovie.poster_url.startsWith('m.media-amazon.com')) ? (
                    <img
                      src={selectedMovie.poster_url.startsWith('//') ? `https:${selectedMovie.poster_url}` : selectedMovie.poster_url.startsWith('m.media-amazon.com') ? `https://${selectedMovie.poster_url}` : selectedMovie.poster_url}
                      alt={selectedMovie?.title || 'Movie poster'}
                      className="movie-poster"
                      onError={(e) => {
                        // If image fails to load, replace with placeholder div
                        const container = e.target.parentElement;
                        if (container && e.target.tagName === 'IMG') {
                          container.innerHTML = '<div class="movie-poster-placeholder"><span>No Poster</span></div>';
                        }
                      }}
                    />
                  ) : (
                    <div className="movie-poster-placeholder">
                      <span>No Poster</span>
                    </div>
                  )}

                  <div className="movie-detail-info">
                    <div className="movie-detail-title-row">
                      <h1>{selectedMovie?.title || 'Untitled Movie'}</h1>
                      <div className="movie-detail-actions">
                        {selectedMovie?.id && (
                          <>
                            <button
                              className={`favourite-btn ${favourites.has(Number(selectedMovie.id)) ? "active" : ""}`}
                              onClick={(e) => {
                                console.log("✅ FAVOURITE BUTTON CLICKED - movieId:", selectedMovie.id);
                                e.preventDefault();
                                e.stopPropagation();
                                if (handleFavouriteClick) {
                                  handleFavouriteClick(selectedMovie.id);
                                } else {
                                  console.error("❌ handleFavouriteClick is undefined!");
                                }
                              }}
                              onMouseDown={() => console.log("✅ FAVOURITE BUTTON MOUSEDOWN")}
                              aria-label="Add to favourites"
                              title="Add to Favourites"
                              type="button"
                              style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                            >
                              {favourites.has(Number(selectedMovie.id)) ? "👑" : "♔"}
                            </button>
                            <button
                              className={`watchlist-btn ${watchlist.has(Number(selectedMovie.id)) ? "active" : ""}`}
                              onClick={(e) => {
                                console.log("✅ WATCHLIST BUTTON CLICKED - movieId:", selectedMovie.id);
                                e.preventDefault();
                                e.stopPropagation();
                                if (handleWatchlistClick) {
                                  handleWatchlistClick(selectedMovie.id);
                                } else {
                                  console.error("❌ handleWatchlistClick is undefined!");
                                }
                              }}
                              onMouseDown={() => console.log("✅ WATCHLIST BUTTON MOUSEDOWN")}
                              aria-label="Add to watchlist"
                              title="Add to Watchlist"
                              type="button"
                              style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                            >
                              {watchlist.has(Number(selectedMovie.id)) ? "✓" : "+"}
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="movie-detail-meta">
                      {selectedMovie?.year && <span className="movie-year">{selectedMovie.year}</span>}
                      {selectedMovie?.year && selectedMovie?.genre && <span className="movie-separator">·</span>}
                      {selectedMovie?.genre && <span className="movie-genre">{selectedMovie.genre}</span>}
                      {selectedMovie.duration && (
                        <>
                          <span className="movie-separator">·</span>
                          <span className="movie-duration">{selectedMovie.duration} min</span>
                        </>
                      )}
                    </div>

                    {/* IMDB Rating */}
                    {selectedMovie.imdb_rating && (
                      <div className="movie-detail-imdb-rating">
                        <span className="imdb-label">IMDB</span>
                        <span className="imdb-rating-value">{selectedMovie.imdb_rating}/10</span>
                        <span className="imdb-stars">
                          {"★".repeat(Math.round(selectedMovie.imdb_rating / 2))}
                        </span>
                      </div>
                    )}

                    {selectedMovie?.id && movieRatings[selectedMovie.id]?.average && (
                      <div className="movie-detail-rating">
                        <span className="rating-label">User Rating</span>
                        <span className="rating-value-large">
                          {movieRatings[selectedMovie.id].average.toFixed(1)}/5
                        </span>
                        <span className="rating-stars-large">
                          {"★".repeat(Math.round(movieRatings[selectedMovie.id].average))}
                        </span>
                        <span className="rating-count-large">
                          ({movieRatings[selectedMovie.id].count} {movieRatings[selectedMovie.id].count === 1 ? 'rating' : 'ratings'})
                        </span>
                      </div>
                    )}

                    <div className="movie-detail-action-buttons">
                      {selectedMovie.trailer_url && (
                        <a
                          href={selectedMovie.trailer_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="trailer-btn"
                        >
                          ▶ Watch Trailer
                        </a>
                      )}
                      <button
                        className="quiz-btn"
                        onClick={handleTakeQuiz}
                        disabled={quizLoading}
                      >
                        {quizLoading ? "Loading..." : "🎯 Take Quiz"}
                      </button>
                    </div>
                  </div>
                </div>

                {selectedMovie.description && (
                  <div className="movie-description">
                    <h3>Description</h3>
                    <p>{selectedMovie.description}</p>
                  </div>
                )}

                {/* Actors Section */}
                {selectedMovie?.id && actors[selectedMovie.id] && actors[selectedMovie.id].length > 0 && (
                  <div className="movie-actors-section">
                    <h3>Cast</h3>
                    <div className="actors-grid">
                      {actors[selectedMovie.id].map((actor, index) => (
                        <div key={index} className="actor-card">
                          {actor.profilePhoto ? (
                            <img
                              src={actor.profilePhoto}
                              alt={actor.name}
                              className="actor-photo"
                              onError={(e) => {
                                e.target.style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="actor-photo-placeholder">
                              <span>{actor.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}</span>
                            </div>
                          )}
                          <div className="actor-info">
                            <div className="actor-name">{actor.name}</div>
                            {actor.character && (
                              <div className="actor-character">{actor.character}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedMovie?.id && actorsLoading[selectedMovie.id] && (
                  <div className="movie-actors-section">
                    <h3>Cast</h3>
                    <div className="actors-loading">Loading cast...</div>
                  </div>
                )}

                {selectedMovie?.id && (
                  <>
                    <div className="movie-detail-rating-section">
                      <h3>Your Rating</h3>
                      <div className="star-row-large">{renderStars(selectedMovie.id)}</div>
                    </div>

                    <div className="movie-detail-comments">
                      <h3>Comments</h3>

                      {isAuthenticated && (
                        <div className="comment-input-container">
                          <textarea
                            className="comment-input"
                            placeholder="Write a comment..."
                            value={commentTexts[selectedMovie.id] || ""}
                            onChange={(e) =>
                              setCommentTexts((prev) => ({
                                ...prev,
                                [selectedMovie.id]: e.target.value,
                              }))
                            }
                            rows={3}
                          />
                          <button
                            className="comment-submit-btn"
                            onClick={() => handleCommentSubmit(selectedMovie.id)}
                          >
                            Post Comment
                          </button>
                        </div>
                      )}

                      <div className="comments-list">
                        {comments[selectedMovie.id]?.length === 0 ? (
                          <p className="no-comments">No comments yet. Be the first to comment!</p>
                        ) : (
                          (comments[selectedMovie.id] || []).map((comment) => {
                            const isOwnComment = currentUser && comment.user_id === currentUser.id;
                            const isEditing = editingComment?.movieId === selectedMovie.id && editingComment?.commentId === comment.id;

                        return (
                          <div key={comment.id} className="comment-item">
                            {isEditing ? (
                              <div className="comment-edit-form">
                                <textarea
                                  className="comment-edit-input"
                                  value={editingComment.text}
                                  onChange={(e) =>
                                    setEditingComment((prev) => ({
                                      ...prev,
                                      text: e.target.value,
                                    }))
                                  }
                                  rows={3}
                                />
                                <div className="comment-edit-actions">
                                  <button
                                    className="comment-save-btn"
                                    onClick={handleCommentUpdate}
                                  >
                                    Save
                                  </button>
                                  <button
                                    className="comment-cancel-btn"
                                    onClick={() => setEditingComment(null)}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="comment-header">
                                  <span className="comment-author">{comment.username}</span>
                                  <span className="comment-date">
                                    {new Date(comment.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="comment-text">{comment.comment_text}</p>
                                {isOwnComment && (
                                  <div className="comment-actions">
                                    <button
                                      className="comment-edit-btn"
                                      onClick={() =>
                                        handleCommentEdit(selectedMovie.id, comment.id, comment.comment_text)
                                      }
                                    >
                                      Edit
                                    </button>
                                    <button
                                      className="comment-delete-btn"
                                      onClick={() => handleCommentDelete(selectedMovie.id, comment.id)}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                    </div>
                  </>
                )}
              </div>
            </section>
          ) : currentPage === "home" ? (
            <>
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
                    <a 
                      className="primary-btn" 
                      href="#ratings"
                      onClick={(e) => {
                        e.preventDefault();
                        handleRatingsClick(e);
                      }}
                    >
                      Start rating
                    </a>
                    <button className="secondary-btn" type="button" disabled>
                      Watch tutorial (soon)
                    </button>
                    {isAuthenticated && isAdmin && (
                      <a
                        className="primary-btn"
                        href="#admin"
                        onClick={(e) => {
                          e.preventDefault();
                          setShowAdminPanel(true);
                          window.location.hash = "#admin";
                        }}
                        style={{
                          background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
                          color: '#000',
                          border: '1px solid #ffd700',
                          fontWeight: 'bold',
                          boxShadow: '0 4px 15px rgba(255, 215, 0, 0.4)'
                        }}
                      >
                        👑 Admin Panel
                      </a>
                    )}
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
                        movies.slice(0, 5).map((movie) => (
                          <li
                            key={movie.id}
                            onClick={() => handleMovieClick(movie.id)}
                            style={{ cursor: "pointer" }}
                            title="Click to view details"
                          >
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

              {/* Trending Movies Leaderboard */}
              <section className="trending-leaderboard" id="trending">
                <div className="trending-header">
                  <h2>🔥 Trending & Popular</h2>
                  <p className="trending-subtitle">Vote for Movie of the Month</p>
                </div>
                {trendingLoading ? (
                  <div className="trending-loading">Loading trending movies...</div>
                ) : trendingMovies.length === 0 ? (
                  <div className="trending-empty">
                    <p>No movies in trending list yet. Be the first to add one!</p>
                    {isAuthenticated && (
                      <button 
                        className="trending-add-btn"
                        onClick={() => setShowAddMovieModal(true)}
                      >
                        + Add Movie
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="trending-list">
                      {trendingMovies.map((movie, index) => (
                        <div key={movie.id} className={`trending-movie-card ${index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : ''}`}>
                          <div className="trending-rank">
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                          </div>
                          <div className="trending-poster">
                            {movie.posterUrl && movie.posterUrl.trim() !== '' && movie.posterUrl !== 'N/A' ? (
                              <img
                                src={movie.posterUrl.startsWith('//') ? `https:${movie.posterUrl}` : movie.posterUrl.startsWith('m.media-amazon.com') ? `https://${movie.posterUrl}` : movie.posterUrl}
                                alt={movie.title}
                                onError={(e) => { 
                                  e.target.style.display = 'none'; 
                                  const placeholder = e.target.nextElementSibling;
                                  if (!placeholder || !placeholder.classList.contains('trending-poster-placeholder')) {
                                    const div = document.createElement('div');
                                    div.className = 'trending-poster-placeholder';
                                    div.innerHTML = '<span>🎬</span>';
                                    e.target.parentElement.appendChild(div);
                                  }
                                }}
                              />
                            ) : null}
                            {(!movie.posterUrl || movie.posterUrl.trim() === '' || movie.posterUrl === 'N/A') && (
                              <div className="trending-poster-placeholder">🎬</div>
                            )}
                          </div>
                          <div className="trending-info">
                            <h3 className="trending-title">{movie.title}</h3>
                            <div className="trending-votes">
                              <span className="trending-vote-count">{movie.votes}</span>
                              <span className="trending-vote-label">{movie.votes === 1 ? 'vote' : 'votes'}</span>
                            </div>
                            {isAuthenticated ? (
                              <button
                                className={`trending-vote-btn ${movie.hasVoted ? 'voted' : ''}`}
                                onClick={() => handleTrendingVote(movie.id)}
                                disabled={movie.hasVoted}
                              >
                                {movie.hasVoted ? '✓ Voted' : '🗳️ Vote'}
                              </button>
                            ) : (
                              <p className="trending-login-prompt">Sign in to vote</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {isAuthenticated && (
                      <div className="trending-add-section">
                        <button 
                          className="trending-add-btn"
                          onClick={() => setShowAddMovieModal(true)}
                        >
                          + Add New Movie
                        </button>
                      </div>
                    )}
                  </>
                )}
              </section>

              {/* Personalized Recommendations Section - Only shown when user is logged in */}
              {isAuthenticated && currentUser && (
                <section className="recommendations-section" id="recommendations">
                  <div className="rating-top">
                    <div>
                      <p className="section-label">Personalized</p>
                      <h2>You Might Like…</h2>
                      <p>
                        Discover movies tailored to your taste based on your ratings, watchlist, and favorites.
                      </p>
                    </div>
                  </div>

                  {recommendationsLoading ? (
                    <div className="loading" style={{ textAlign: "center", padding: "2rem", color: "var(--text-tertiary)" }}>
                      Loading recommendations...
                    </div>
                  ) : recommendedMovies.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-tertiary)" }}>
                      <p>Start rating movies and adding to your watchlist to get personalized recommendations!</p>
                    </div>
                  ) : (
                    <HorizontalCarousel
                      movies={recommendedMovies}
                      onMovieClick={handleMovieClick}
                      loading={false}
                    />
                  )}
                </section>
              )}

              {/* Top Rated Movies Section - Horizontal Scroll */}
              <section className="top-rated-section" id="top-rated">
                <div className="rating-top">
                  <div>
                    <p className="section-label">Top Rated</p>
                    <h2>Highest Rated Movies</h2>
                    <p>
                      Discover the most acclaimed films based on IMDB ratings and user reviews.
                    </p>
                  </div>
                </div>

                <HorizontalCarousel
                  movies={topRatedMovies}
                  onMovieClick={handleMovieClick}
                  loading={topRatedLoading}
                />
              </section>
            </>
          ) : currentPage === "newly-released" ? (
            <section className="rating-area" id="newly-released">
              <div className="rating-top">
                <div>
                  <p className="section-label">Now Playing & Coming Soon</p>
                  <h2>Soon to be Released</h2>
                  <p>
                    Discover the latest movies currently playing in theaters and upcoming releases. Book your tickets now!
                  </p>
                </div>
              </div>

              {/* Now Playing Section */}
              <div style={{ marginBottom: "4rem" }}>
                <h3 style={{ marginBottom: "1.5rem", fontSize: "1.5rem" }}>Now Playing</h3>
                {nowPlayingLoading ? (
                  <p style={{ textAlign: "center", color: "#9ec9ff", padding: "2rem" }}>
                    Loading newly released movies...
                  </p>
                ) : nowPlayingMovies.length === 0 ? (
                  <p style={{ textAlign: "center", color: "#ff8f8f", padding: "2rem" }}>
                    No newly released movies available at the moment.
                  </p>
                ) : (
                  <NewlyReleasedCarousel
                    movies={nowPlayingMovies}
                    onBuyTicket={handleBuyTicket}
                    loading={nowPlayingLoading}
                  />
                )}
              </div>

              {/* Coming Soon Section */}
              <div style={{ marginBottom: "4rem" }}>
                <h3 style={{ marginBottom: "1.5rem", fontSize: "1.5rem" }}>Coming Soon</h3>
                {upcomingLoading ? (
                  <p style={{ textAlign: "center", color: "#9ec9ff", padding: "2rem" }}>
                    Loading upcoming movies...
                  </p>
                ) : upcomingMovies.length === 0 ? (
                  <p style={{ textAlign: "center", color: "#ff8f8f", padding: "2rem" }}>
                    No upcoming movies available at the moment.
                  </p>
                ) : (
                  <NewlyReleasedCarousel
                    movies={upcomingMovies}
                    onBuyTicket={handleBuyTicket}
                    loading={upcomingLoading}
                  />
                )}
              </div>
            </section>
          ) : currentPage === "booking" ? (
            <>
              {/* Seat Selection Page */}
              {bookingFlow.step === "seats" && (
                <section className="rating-area" id="booking-seats">
                  <div className="rating-top">
                    <div>
                      <p className="section-label">Step 1 of 3</p>
                      <h2>Select Your Seats</h2>
                      <p>
                        {bookingFlow.movie?.title} - {bookingFlow.showing?.theater_name}
                      </p>
                      <p style={{ fontSize: "0.9rem", color: "#9ec9ff" }}>
                        {bookingFlow.showing?.showtime
                          ? new Date(bookingFlow.showing.showtime).toLocaleString()
                          : ""}
                      </p>
                    </div>
                  </div>

                  <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                    <div
                      style={{
                        display: "inline-block",
                        padding: "1rem 2rem",
                        background: "var(--bg-card)",
                        borderRadius: "8px",
                        marginBottom: "2rem",
                      }}
                    >
                      <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🎬</div>
                      <div style={{ fontSize: "0.9rem", color: "#9ec9ff" }}>SCREEN</div>
                    </div>
                  </div>

                  <div style={{ maxWidth: "800px", margin: "0 auto", padding: "0 2rem" }}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(10, 1fr)",
                        gap: "0.5rem",
                        marginBottom: "2rem",
                      }}
                    >
                      {availableSeats.map((seat) => {
                        const isSelected = bookingFlow.seats.includes(seat.id);
                        const isReserved = seat.is_reserved;

                        return (
                          <button
                            key={seat.id}
                            onClick={() => !isReserved && handleSeatSelect(seat.id)}
                            disabled={isReserved}
                            style={{
                              padding: "0.75rem",
                              background: isReserved
                                ? "#444"
                                : isSelected
                                ? "var(--text-accent)"
                                : "var(--bg-card)",
                              color: isReserved
                                ? "#888"
                                : isSelected
                                ? "#000"
                                : "var(--text-primary)",
                              border: `2px solid ${
                                isReserved
                                  ? "#666"
                                  : isSelected
                                  ? "var(--text-accent)"
                                  : "var(--border-color)"
                              }`,
                              borderRadius: "4px",
                              cursor: isReserved ? "not-allowed" : "pointer",
                              fontSize: "0.85rem",
                              fontWeight: isSelected ? "bold" : "normal",
                            }}
                            title={
                              isReserved
                                ? "Reserved"
                                : `${seat.row_label}${seat.seat_number}`
                            }
                          >
                            {seat.row_label}
                            {seat.seat_number}
                          </button>
                        );
                      })}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: "2rem",
                        justifyContent: "center",
                        marginBottom: "2rem",
                        flexWrap: "wrap",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <div
                          style={{
                            width: "20px",
                            height: "20px",
                            background: "var(--bg-card)",
                            border: "2px solid var(--border-color)",
                            borderRadius: "4px",
                          }}
                        />
                        <span>Available</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <div
                          style={{
                            width: "20px",
                            height: "20px",
                            background: "var(--text-accent)",
                            border: "2px solid var(--text-accent)",
                            borderRadius: "4px",
                          }}
                        />
                        <span>Selected</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <div
                          style={{
                            width: "20px",
                            height: "20px",
                            background: "#444",
                            border: "2px solid #666",
                            borderRadius: "4px",
                          }}
                        />
                        <span>Reserved</span>
                      </div>
                    </div>

                    <div
                      style={{
                        textAlign: "center",
                        padding: "1.5rem",
                        background: "var(--bg-card)",
                        borderRadius: "8px",
                        marginBottom: "2rem",
                      }}
                    >
                      <div style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
                        ${(bookingFlow?.totalAmount || 0).toFixed(2)}
                      </div>
                      <div style={{ fontSize: "0.9rem", color: "#9ec9ff" }}>
                        {bookingFlow.seats.length} seat{bookingFlow.seats.length !== 1 ? "s" : ""} selected
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
                      <button className="secondary-btn" onClick={handleBookingClose}>
                        Cancel
                      </button>
                      <button
                        className="primary-btn"
                        onClick={handleSeatsContinue}
                        disabled={bookingFlow.seats.length === 0}
                      >
                        Continue to Snacks
                      </button>
                    </div>
                  </div>
                </section>
              )}

              {/* Snacks Selection Page */}
              {bookingFlow.step === "snacks" && (
                <section className="rating-area" id="booking-snacks">
                  <div className="rating-top">
                    <div>
                      <p className="section-label">Step 2 of 3</p>
                      <h2>Add Snacks & Drinks</h2>
                      <p>Would you like to add snacks to your order?</p>
                    </div>
                  </div>

                  {snacksLoading ? (
                    <div style={{ textAlign: "center", padding: "2rem" }}>
                      <p style={{ color: "#9ec9ff", padding: "2rem" }}>
                        Loading snacks...
                      </p>
                    </div>
                  ) : !snacks || !Array.isArray(snacks) || snacks.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
                      <p style={{ color: "#ff8f8f", marginBottom: "1rem", fontSize: "1.1rem" }}>
                        {!snacks || !Array.isArray(snacks) ? "Loading snacks..." : "No snacks available at the moment."}
                      </p>
                      <p style={{ color: "#9ec9ff", fontSize: "0.9rem", marginBottom: "2rem" }}>
                        You can continue without snacks.
                      </p>
                      <div style={{ display: "flex", gap: "1rem", justifyContent: "center", marginTop: "2rem" }}>
                        <button
                          className="secondary-btn"
                          onClick={() => setBookingFlow((prev) => ({ ...prev, step: "seats" }))}
                        >
                          Back
                        </button>
                        <button
                          className="primary-btn"
                          onClick={handleSnacksContinue}
                        >
                          Continue to Checkout
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                          gap: "1.5rem",
                          maxWidth: "1000px",
                          margin: "0 auto",
                          padding: "0 2rem",
                          marginBottom: "2rem",
                        }}
                      >
                        {snacks && Array.isArray(snacks) && snacks.map((snack) => {
                          if (!snack || !snack.id) return null;
                          const cartItem = bookingFlow.snacks.find((s) => s.snackId === snack.id);
                          const quantity = cartItem?.quantity || 0;

                          return (
                            <div
                              key={snack.id}
                              style={{
                                background: "var(--bg-card)",
                                borderRadius: "8px",
                                padding: "1.5rem",
                                border: "1px solid var(--border-color)",
                              }}
                            >
                              {snack.image_url && (snack.image_url.startsWith('http') || snack.image_url.startsWith('//')) ? (
                                <img
                                  src={snack.image_url.startsWith('//') ? `https:${snack.image_url}` : snack.image_url}
                                  alt={snack.name}
                                  style={{
                                    width: "100%",
                                    height: "150px",
                                    objectFit: "cover",
                                    borderRadius: "4px",
                                    marginBottom: "1rem",
                                  }}
                                  onError={(e) => {
                                    // Replace broken snack image with placeholder
                                    const shortName = snack.name.length > 10 ? snack.name.substring(0, 10) : snack.name;
                                    // If profile picture fails, hide it
                                    e.target.style.display = "none";
                                  }}
                                />
                              ) : (
                                <div style={{
                                  width: "100%",
                                  height: "150px",
                                  background: "var(--bg-secondary)",
                                  borderRadius: "4px",
                                  marginBottom: "1rem",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "3rem",
                                }}>
                                  🍿
                                </div>
                              )}
                              <h3 style={{ marginBottom: "0.5rem" }}>{snack.name || "Snack"}</h3>
                              <p style={{ fontSize: "0.9rem", color: "#9ec9ff", marginBottom: "1rem" }}>
                                {snack.description || ""}
                              </p>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  marginBottom: "1rem",
                                }}
                              >
                                <span style={{ fontSize: "1.2rem", fontWeight: "bold" }}>
                                  ${(parseFloat(snack.price) || 0).toFixed(2)}
                                </span>
                                {quantity > 0 && (
                                  <span style={{ color: "var(--text-accent)" }}>× {quantity}</span>
                                )}
                              </div>
                              <div style={{ display: "flex", gap: "0.5rem" }}>
                                {quantity > 0 && (
                                  <button
                                    className="secondary-btn"
                                    onClick={() => handleSnackRemove(snack.id)}
                                    style={{ flex: 1 }}
                                  >
                                    −
                                  </button>
                                )}
                                <button
                                  className="primary-btn"
                                  onClick={() => handleSnackAdd(snack)}
                                  style={{ flex: quantity > 0 ? 1 : 2 }}
                                >
                                  {quantity > 0 ? "+" : "Add"}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div
                        style={{
                          maxWidth: "1000px",
                          margin: "0 auto",
                          padding: "0 2rem",
                          marginBottom: "2rem",
                        }}
                      >
                        <div
                          style={{
                            background: "var(--bg-card)",
                            borderRadius: "8px",
                            padding: "1.5rem",
                            marginBottom: "1rem",
                          }}
                        >
                          <h3 style={{ marginBottom: "1rem" }}>Your Order</h3>
                          {bookingFlow.snacks.length === 0 ? (
                            <p style={{ color: "#9ec9ff" }}>No snacks added yet</p>
                          ) : (
                            <>
                              {bookingFlow.snacks.map((snack) => {
                                const snackData = snacks.find((s) => s.id === snack.snackId);
                                return (
                                  <div
                                    key={snack.snackId}
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      marginBottom: "0.5rem",
                                    }}
                                  >
                                    <span>
                                      {snackData?.name} × {snack.quantity}
                                    </span>
                                    <span>${(parseFloat(snack.price) * snack.quantity).toFixed(2)}</span>
                                  </div>
                                );
                              })}
                              <div
                                style={{
                                  borderTop: "1px solid var(--border-color)",
                                  marginTop: "1rem",
                                  paddingTop: "1rem",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  fontWeight: "bold",
                                }}
                              >
                                <span>Snacks Total:</span>
                                <span>
                                  $
                                  {bookingFlow.snacks
                                    .reduce((sum, s) => sum + (parseFloat(s.price) || 0) * s.quantity, 0)
                                    .toFixed(2)}
                                </span>
                              </div>
                            </>
                          )}
                        </div>

                        <div
                          style={{
                            textAlign: "center",
                            padding: "1.5rem",
                            background: "var(--bg-card)",
                            borderRadius: "8px",
                            marginBottom: "2rem",
                          }}
                        >
                          <div style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
                            Total: ${(bookingFlow?.totalAmount || 0).toFixed(2)}
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
                          <button
                            className="secondary-btn"
                            onClick={() => setBookingFlow((prev) => ({ ...prev, step: "seats" }))}
                          >
                            Back
                          </button>
                          <button className="primary-btn" onClick={handleSnacksContinue}>
                            Continue to Checkout
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </section>
              )}

              {/* Checkout Page */}
              {bookingFlow.step === "checkout" && (
                <section className="rating-area" id="booking-checkout">
                  <div className="rating-top">
                    <div>
                      <p className="section-label">Step 3 of 3</p>
                      <h2>Review Your Order</h2>
                      <p>Please review your booking details before confirming</p>
                    </div>
                  </div>

                  <div style={{ maxWidth: "800px", margin: "0 auto", padding: "0 2rem" }}>
                    <div
                      style={{
                        background: "var(--bg-card)",
                        borderRadius: "8px",
                        padding: "2rem",
                        marginBottom: "2rem",
                      }}
                    >
                      <h3 style={{ marginBottom: "1.5rem" }}>Movie Details</h3>
                      <div style={{ marginBottom: "1rem" }}>
                        <strong>Movie:</strong> {bookingFlow.movie?.title}
                      </div>
                      <div style={{ marginBottom: "1rem" }}>
                        <strong>Theater:</strong> {bookingFlow.showing?.theater_name}
                      </div>
                      <div style={{ marginBottom: "1rem" }}>
                        <strong>Showtime:</strong>{" "}
                        {bookingFlow.showing?.showtime
                          ? new Date(bookingFlow.showing.showtime).toLocaleString()
                          : ""}
                      </div>
                    </div>

                    <div
                      style={{
                        background: "var(--bg-card)",
                        borderRadius: "8px",
                        padding: "2rem",
                        marginBottom: "2rem",
                      }}
                    >
                      <h3 style={{ marginBottom: "1.5rem" }}>Selected Seats</h3>
                      {bookingFlow.seats.length === 0 ? (
                        <p style={{ color: "#9ec9ff" }}>No seats selected</p>
                      ) : (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                          {bookingFlow.seats.map((seatId) => {
                            const seat = availableSeats.find((s) => s.id === seatId);
                            return seat ? (
                              <span
                                key={seatId}
                                style={{
                                  padding: "0.5rem 1rem",
                                  background: "var(--bg-secondary)",
                                  borderRadius: "4px",
                                }}
                              >
                                {seat.row_label}
                                {seat.seat_number}
                              </span>
                            ) : null;
                          })}
                        </div>
                      )}
                      <div style={{ marginTop: "1rem", fontWeight: "bold" }}>
                        Seats: ${(bookingFlow.seats.length * 12).toFixed(2)}
                      </div>
                    </div>

                    {bookingFlow.snacks.length > 0 && (
                      <div
                        style={{
                          background: "var(--bg-card)",
                          borderRadius: "8px",
                          padding: "2rem",
                          marginBottom: "2rem",
                        }}
                      >
                        <h3 style={{ marginBottom: "1.5rem" }}>Snacks & Drinks</h3>
                        {bookingFlow.snacks.map((snack) => {
                          const snackData = snacks.find((s) => s.id === snack.snackId);
                          return (
                            <div
                              key={snack.snackId}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginBottom: "0.5rem",
                              }}
                            >
                              <span>
                                {snackData?.name} × {snack.quantity}
                              </span>
                              <span>${(parseFloat(snack.price) * snack.quantity).toFixed(2)}</span>
                            </div>
                          );
                        })}
                        <div
                          style={{
                            borderTop: "1px solid var(--border-color)",
                            marginTop: "1rem",
                            paddingTop: "1rem",
                            fontWeight: "bold",
                          }}
                        >
                          Snacks: $
                          {bookingFlow.snacks
                            .reduce((sum, s) => sum + s.price * s.quantity, 0)
                            .toFixed(2)}
                        </div>
                      </div>
                    )}

                    <div
                      style={{
                        background: "var(--bg-card)",
                        borderRadius: "8px",
                        padding: "2rem",
                        marginBottom: "2rem",
                        textAlign: "center",
                      }}
                    >
                      <div style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
                        Total: ${(bookingFlow?.totalAmount || 0).toFixed(2)}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
                      <button
                        className="secondary-btn"
                        onClick={() => setBookingFlow((prev) => ({ ...prev, step: "snacks" }))}
                      >
                        Back
                      </button>
                      <button className="primary-btn" onClick={handleCheckoutConfirm}>
                        Confirm Order
                      </button>
                    </div>
                  </div>
                </section>
              )}

              {/* Confirmation Page */}
              {bookingFlow.step === "confirmation" && (
                <section className="rating-area" id="booking-confirmation">
                  <div className="rating-top">
                    <div>
                      <p className="section-label">Booking Confirmed!</p>
                      <h2>Thank you! Your ticket has been reserved.</h2>
                    </div>
                  </div>

                  <div
                    style={{
                      maxWidth: "600px",
                      margin: "0 auto",
                      padding: "2rem",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "4rem",
                        marginBottom: "2rem",
                      }}
                    >
                      ✅
                    </div>
                    <div
                      style={{
                        background: "var(--bg-card)",
                        borderRadius: "8px",
                        padding: "2rem",
                        marginBottom: "2rem",
                      }}
                    >
                      <div style={{ marginBottom: "1rem" }}>
                        <strong>Booking Reference:</strong> {bookingFlow.booking?.booking_reference}
                      </div>
                      <div style={{ marginBottom: "1rem" }}>
                        <strong>Movie:</strong> {bookingFlow.movie?.title}
                      </div>
                      <div style={{ marginBottom: "1rem" }}>
                        <strong>Total Amount:</strong> ${(bookingFlow?.totalAmount || 0).toFixed(2)}
                      </div>
                    </div>
                    <button className="primary-btn" onClick={handleBookingClose}>
                      Return to Home
                    </button>
                  </div>
                </section>
              )}
            </>
          ) : currentPage === "ratings" ? (
            <section className="rating-area" id="ratings">
                    <div className="rating-top">
                      <div>
                        <p className="section-label">Fresh Picks</p>
                        <h2>Rate today&apos;s featured movies</h2>
                        <p>
                          Sample a few cinematic bites and color the stars with your taste.
                        </p>
                      </div>
                    </div>

                  {/* Horizontal Scrolling Movie Carousel */}
                  {moviesLoading ? (
                    <p style={{ textAlign: "center", color: "#9ec9ff", padding: "2rem" }}>
                      Loading movies from database...
                    </p>
                  ) : filteredMovies.length === 0 ? (
                    <div style={{ textAlign: "center", color: "#ff8f8f", padding: "2rem" }}>
                      {movies.length === 0 ? (
                        <div>
                          <p style={{ marginBottom: "1rem" }}>No movies found.</p>
                          <p style={{ fontSize: "0.9rem", opacity: 0.8, marginBottom: "0.5rem" }}>
                            The backend server is starting... Please wait a few seconds and refresh the page.
                          </p>
                          <p style={{ fontSize: "0.85rem", opacity: 0.7, marginTop: "1rem" }}>
                            If this persists, check that the backend is running on port 4000.
                          </p>
                        </div>
                      ) : (
                        <p>No movies match your filters. Try adjusting your filter criteria.</p>
                      )}
                    </div>
                  ) : (
                    <HorizontalMovieCarousel
                      movies={filteredMovies}
                      onMovieClick={handleMovieClick}
                      loading={moviesLoading}
                      movieRatings={movieRatings}
                      favourites={favourites}
                      watchlist={watchlist}
                      onFavouriteClick={handleFavouriteClick}
                      onWatchlistClick={handleWatchlistClick}
                      onBuyTicket={handleBuyTicket}
                    />
                  )}
                </section>
          ) : currentPage === "watchlist" ? (
            <section className="rating-area" id="watchlist">
              <div className="rating-top">
                <div>
                  <p className="section-label">My Watchlist</p>
                  <h2>Movies I Want to Watch</h2>
                  <p>
                    Your personal collection of movies you&apos;ve saved for later.
                  </p>
                </div>
              </div>

              {/* Horizontal Scrolling Watchlist Carousel */}
              {!isAuthenticated || !currentUser ? (
                <p style={{ textAlign: "center", color: "#ff8f8f", padding: "2rem" }}>
                  Please sign in to view your watchlist.
                </p>
              ) : watchlistLoading ? (
                <p style={{ textAlign: "center", color: "#9ec9ff", padding: "2rem" }}>
                  Loading your watchlist...
                </p>
              ) : watchlistMovies.length === 0 ? (
                <p style={{ textAlign: "center", color: "#ff8f8f", padding: "2rem" }}>
                  Your watchlist is empty. Add movies to your watchlist to see them here!
                </p>
              ) : (
                <HorizontalMovieCarousel
                  movies={watchlistMovies}
                  onMovieClick={handleMovieClick}
                  loading={watchlistLoading}
                  movieRatings={movieRatings}
                  favourites={favourites}
                  watchlist={watchlist}
                  onFavouriteClick={handleFavouriteClick}
                  onWatchlistClick={handleWatchlistClick}
                  onBuyTicket={handleBuyTicket}
                />
              )}
            </section>
          ) : currentPage === "favorites" ? (
            <section className="rating-area" id="favorites">
              <div className="rating-top">
                <div>
                  <p className="section-label">My Favorites</p>
                  <h2>Movies I Love</h2>
                  <p>
                    Your collection of favorite movies that you&apos;ve marked with a crown.
                  </p>
                </div>
              </div>

              {/* Horizontal Scrolling Favorites Carousel */}
              {!isAuthenticated || !currentUser ? (
                <p style={{ textAlign: "center", color: "#ff8f8f", padding: "2rem" }}>
                  Please sign in to view your favorites.
                </p>
              ) : favoritesLoading ? (
                <p style={{ textAlign: "center", color: "#9ec9ff", padding: "2rem" }}>
                  Loading your favorites...
                </p>
              ) : favoritesMovies.length === 0 ? (
                <p style={{ textAlign: "center", color: "#ff8f8f", padding: "2rem" }}>
                  Your favorites list is empty. Add movies to your favorites to see them here!
                </p>
              ) : (
                <HorizontalMovieCarousel
                  movies={favoritesMovies}
                  onMovieClick={handleMovieClick}
                  loading={favoritesLoading}
                  movieRatings={movieRatings}
                  favourites={favourites}
                  watchlist={watchlist}
                  onFavouriteClick={handleFavouriteClick}
                  onWatchlistClick={handleWatchlistClick}
                  onBuyTicket={handleBuyTicket}
                />
              )}
            </section>
          ) : currentPage === "battle" ? (
            <section className="battle-area">
              <div className="battle-header">
                <div className="rating-top">
                  <div>
                    <p className="section-label">Daily Competition</p>
                    <h1>Movie Battle of the Day</h1>
                    <p>
                      Vote for which movie you think is better! Results update in real-time.
                    </p>
                  </div>
                </div>
              </div>

              {battleLoading ? (
                <div className="battle-loading">
                  <p>Loading today's battle...</p>
                </div>
              ) : !battle ? (
                <div className="battle-error">
                  <p>Unable to load battle. Please try again later.</p>
                </div>
              ) : (
                <>
                  <div className="battle-container">
                    <div className="battle-movies">
                      {/* Movie 1 */}
                      <div className={`battle-movie-card ${hasVoted && battle.movie1Votes > battle.movie2Votes ? 'winner' : ''}`}>
                        <div className="battle-poster-container">
                          {battle.movie1.poster_url && battle.movie1.poster_url.trim() !== '' && battle.movie1.poster_url !== 'N/A' && (battle.movie1.poster_url.startsWith('http') || battle.movie1.poster_url.startsWith('//') || battle.movie1.poster_url.startsWith('m.media-amazon.com')) ? (
                            <img
                              src={battle.movie1.poster_url.startsWith('//') ? `https:${battle.movie1.poster_url}` : battle.movie1.poster_url.startsWith('m.media-amazon.com') ? `https://${battle.movie1.poster_url}` : battle.movie1.poster_url}
                              alt={battle.movie1.title}
                              className="battle-poster"
                              onError={(e) => {
                                const container = e.target.parentElement;
                                if (container && e.target.tagName === 'IMG') {
                                  container.innerHTML = '<div class="battle-poster-placeholder"><span>🎬</span></div>';
                                }
                              }}
                            />
                          ) : (
                            <div className="battle-poster-placeholder">
                              <span>🎬</span>
                            </div>
                          )}
                        </div>
                        <div className="battle-movie-info">
                          <h2 className="battle-movie-title">{battle.movie1.title}</h2>
                          <p className="battle-movie-meta">
                            {battle.movie1.year} • {battle.movie1.genre}
                            {battle.movie1.imdb_rating && ` • ⭐ ${battle.movie1.imdb_rating}/10`}
                          </p>
                          {movie1Stats && (
                            <div className="battle-movie-stats">
                              <span>Wins: {movie1Stats.battlesWon}</span>
                              <span>Win Rate: {movie1Stats.winPercentage}%</span>
                            </div>
                          )}
                          {!hasVoted ? (
                            <button
                              className="battle-vote-btn"
                              onClick={() => handleBattleVote(battle.movie1.id)}
                            >
                              Vote for This Movie
                            </button>
                          ) : (
                            <div className="battle-voted-indicator">
                              {battle.movie1Votes > battle.movie2Votes ? '🏆 Winner!' : 'Voted'}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* VS Divider */}
                      <div className="battle-vs">
                        <span>VS</span>
                      </div>

                      {/* Movie 2 */}
                      <div className={`battle-movie-card ${hasVoted && battle.movie2Votes > battle.movie1Votes ? 'winner' : ''}`}>
                        <div className="battle-poster-container">
                          {battle.movie2.poster_url && battle.movie2.poster_url.trim() !== '' && battle.movie2.poster_url !== 'N/A' && (battle.movie2.poster_url.startsWith('http') || battle.movie2.poster_url.startsWith('//') || battle.movie2.poster_url.startsWith('m.media-amazon.com')) ? (
                            <img
                              src={battle.movie2.poster_url.startsWith('//') ? `https:${battle.movie2.poster_url}` : battle.movie2.poster_url.startsWith('m.media-amazon.com') ? `https://${battle.movie2.poster_url}` : battle.movie2.poster_url}
                              alt={battle.movie2.title}
                              className="battle-poster"
                              onError={(e) => {
                                const container = e.target.parentElement;
                                if (container && e.target.tagName === 'IMG') {
                                  container.innerHTML = '<div class="battle-poster-placeholder"><span>🎬</span></div>';
                                }
                              }}
                            />
                          ) : (
                            <div className="battle-poster-placeholder">
                              <span>🎬</span>
                            </div>
                          )}
                        </div>
                        <div className="battle-movie-info">
                          <h2 className="battle-movie-title">{battle.movie2.title}</h2>
                          <p className="battle-movie-meta">
                            {battle.movie2.year} • {battle.movie2.genre}
                            {battle.movie2.imdb_rating && ` • ⭐ ${battle.movie2.imdb_rating}/10`}
                          </p>
                          {movie2Stats && (
                            <div className="battle-movie-stats">
                              <span>Wins: {movie2Stats.battlesWon}</span>
                              <span>Win Rate: {movie2Stats.winPercentage}%</span>
                            </div>
                          )}
                          {!hasVoted ? (
                            <button
                              className="battle-vote-btn"
                              onClick={() => handleBattleVote(battle.movie2.id)}
                            >
                              Vote for This Movie
                            </button>
                          ) : (
                            <div className="battle-voted-indicator">
                              {battle.movie2Votes > battle.movie1Votes ? '🏆 Winner!' : 'Voted'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Results Display */}
                    {hasVoted && (
                      <div className="battle-results">
                        <h3>Live Results</h3>
                        <div className="battle-results-bars">
                          <div className="battle-result-bar">
                            <div className="battle-result-label">
                              <span>{battle.movie1.title}</span>
                              <span className="battle-result-percentage">
                                {battle.movie1Votes + battle.movie2Votes > 0
                                  ? Math.round((battle.movie1Votes / (battle.movie1Votes + battle.movie2Votes)) * 100)
                                  : 0}%
                              </span>
                            </div>
                            <div className="battle-progress-bar">
                              <div
                                className="battle-progress-fill"
                                style={{
                                  width: battle.movie1Votes + battle.movie2Votes > 0
                                    ? `${(battle.movie1Votes / (battle.movie1Votes + battle.movie2Votes)) * 100}%`
                                    : '0%',
                                }}
                              />
                            </div>
                            <span className="battle-vote-count">{battle.movie1Votes} votes</span>
                          </div>
                          <div className="battle-result-bar">
                            <div className="battle-result-label">
                              <span>{battle.movie2.title}</span>
                              <span className="battle-result-percentage">
                                {battle.movie1Votes + battle.movie2Votes > 0
                                  ? Math.round((battle.movie2Votes / (battle.movie1Votes + battle.movie2Votes)) * 100)
                                  : 0}%
                              </span>
                            </div>
                            <div className="battle-progress-bar">
                              <div
                                className="battle-progress-fill"
                                style={{
                                  width: battle.movie1Votes + battle.movie2Votes > 0
                                    ? `${(battle.movie2Votes / (battle.movie1Votes + battle.movie2Votes)) * 100}%`
                                    : '0%',
                                }}
                              />
                            </div>
                            <span className="battle-vote-count">{battle.movie2Votes} votes</span>
                          </div>
                        </div>
                        <p className="battle-total-votes">
                          Total Votes: {battle.movie1Votes + battle.movie2Votes}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Statistics Section */}
                  <div className="battle-stats-section">
                    <div className="battle-stat-card">
                      <h3>Yesterday's Winner</h3>
                      {yesterdayWinner ? (
                        <div className="battle-stat-movie">
                          <div className="battle-stat-poster">
                            {yesterdayWinner.poster_url && yesterdayWinner.poster_url.trim() !== '' && yesterdayWinner.poster_url !== 'N/A' ? (
                              <img
                                src={yesterdayWinner.poster_url.startsWith('//') ? `https:${yesterdayWinner.poster_url}` : yesterdayWinner.poster_url.startsWith('m.media-amazon.com') ? `https://${yesterdayWinner.poster_url}` : yesterdayWinner.poster_url}
                                alt={yesterdayWinner.title}
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            ) : (
                              <div className="battle-stat-placeholder">🎬</div>
                            )}
                          </div>
                          <div className="battle-stat-info">
                            <h4>{yesterdayWinner.title}</h4>
                            <p>{yesterdayWinner.votesReceived} votes ({Math.round((yesterdayWinner.votesReceived / yesterdayWinner.totalVotes) * 100)}%)</p>
                          </div>
                        </div>
                      ) : (
                        <p className="battle-stat-empty">No winner data available</p>
                      )}
                    </div>

                    <div className="battle-stat-card">
                      <h3>Monthly Leader</h3>
                      {monthlyLeader ? (
                        <div className="battle-stat-movie">
                          <div className="battle-stat-poster">
                            {monthlyLeader.poster_url && monthlyLeader.poster_url.trim() !== '' && monthlyLeader.poster_url !== 'N/A' ? (
                              <img
                                src={monthlyLeader.poster_url.startsWith('//') ? `https:${monthlyLeader.poster_url}` : monthlyLeader.poster_url.startsWith('m.media-amazon.com') ? `https://${monthlyLeader.poster_url}` : monthlyLeader.poster_url}
                                alt={monthlyLeader.title}
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            ) : (
                              <div className="battle-stat-placeholder">🎬</div>
                            )}
                          </div>
                          <div className="battle-stat-info">
                            <h4>{monthlyLeader.title}</h4>
                            <p>🏆 {monthlyLeader.winsThisMonth} wins this month</p>
                          </div>
                        </div>
                      ) : (
                        <p className="battle-stat-empty">No leader data available</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </section>
          ) : null}
        </main>
      </div>

      {/* Battle Popup Modal */}
      {showBattlePopup && (
        <div className="battle-popup-overlay" onClick={handleDismissBattlePopup}>
          <div className="battle-popup" onClick={(e) => e.stopPropagation()}>
            <button className="battle-popup-close" onClick={handleDismissBattlePopup}>×</button>
            <h2>⚔️ Movie Battle of the Day!</h2>
            <p>Two movies are competing today. Vote for your favorite and see which one wins!</p>
            <div className="battle-popup-actions">
              <button className="battle-popup-btn primary" onClick={handleBattlePageClick}>
                Go to Battle
              </button>
              <button className="battle-popup-btn secondary" onClick={handleDismissBattlePopup}>
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Movie Modal */}
      {showAddMovieModal && (
        <div className="trending-modal-overlay" onClick={() => setShowAddMovieModal(false)}>
          <div className="trending-modal" onClick={(e) => e.stopPropagation()}>
            <button className="trending-modal-close" onClick={() => setShowAddMovieModal(false)}>×</button>
            <h2>Add Movie to Trending</h2>
            <p>Add a movie to the trending voting list</p>
            <div className="trending-modal-form">
              <input
                type="text"
                className="trending-modal-input"
                placeholder="Enter movie title"
                value={newMovieTitle}
                onChange={(e) => setNewMovieTitle(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTrendingMovie()}
              />
              <div className="trending-modal-actions">
                <button className="trending-modal-btn primary" onClick={handleAddTrendingMovie}>
                  Add Movie
                </button>
                <button className="trending-modal-btn secondary" onClick={() => setShowAddMovieModal(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      {isAuthenticated && (
        <div className={`fab-container ${fabOpen ? "open" : ""}`}>
          {/* Overlay when menu is open */}
          {fabOpen && (
            <div 
              className="fab-overlay" 
              onClick={() => setFabOpen(false)}
              aria-label="Close menu"
            />
          )}

          {/* Quick Actions Menu */}
          <div className={`fab-menu ${fabOpen ? "open" : ""}`}>
            {/* Home Action */}
            <button
              className="fab-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                setFabOpen(false);
                handleHomeClick(e);
              }}
              title="Go to Home"
              aria-label="Go to Home page"
            >
              <span className="fab-icon">🏠</span>
              <span className="fab-label">Home</span>
            </button>

            {/* Ratings Action */}
            <button
              className="fab-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                setFabOpen(false);
                handleRatingsClick(e);
              }}
              title="Go to Ratings"
              aria-label="Go to Ratings page"
            >
              <span className="fab-icon">⭐</span>
              <span className="fab-label">Ratings</span>
            </button>

            {/* Watchlist Action - Only visible when authenticated */}
            {isAuthenticated && currentUser && (
              <button
                className="fab-action-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setFabOpen(false);
                  handleWatchlistPageClick(e);
                }}
                title="Go to Watchlist"
                aria-label="Go to Watchlist page"
              >
                <span className="fab-icon">📋</span>
                <span className="fab-label">Watchlist</span>
              </button>
            )}

            {/* Favorites Action - Only visible when authenticated */}
            {isAuthenticated && currentUser && (
              <button
                className="fab-action-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setFabOpen(false);
                  handleFavoritesPageClick(e);
                }}
                title="Go to Favorites"
                aria-label="Go to Favorites page"
              >
                <span className="fab-icon">❤️</span>
                <span className="fab-label">Favorites</span>
              </button>
            )}

            {/* Edit/Profile Action */}
            {isAuthenticated && currentUser && (
              <button
                className="fab-action-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setFabOpen(false);
                  handleProfileClick();
                }}
                title="Edit Profile"
                aria-label="Edit Profile"
              >
                <span className="fab-icon">✏️</span>
                <span className="fab-label">Edit</span>
              </button>
            )}

            {/* Admin Panel Action - Only visible to admins */}
            {isAuthenticated && currentUser && isAdmin && (
              <button
                className="fab-action-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setFabOpen(false);
                  setShowAdminPanel(true);
                  window.location.hash = "#admin";
                }}
                title="Admin Panel"
                aria-label="Open Admin Panel"
                style={{ background: 'rgba(255, 215, 0, 0.2)', border: '1px solid #ffd700' }}
              >
                <span className="fab-icon">👑</span>
                <span className="fab-label">Admin</span>
              </button>
            )}

            {/* Movie Battle Action */}
            <button
              className="fab-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                setFabOpen(false);
                handleBattlePageClick();
              }}
              title="Movie Battle"
              aria-label="Go to Movie Battle"
              style={{ background: 'rgba(255, 87, 34, 0.2)', border: '1px solid #ff5722' }}
            >
              <span className="fab-icon">⚔️</span>
              <span className="fab-label">Battle</span>
            </button>

            {/* Soon to be Released Action */}
            <button
              className="fab-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                setFabOpen(false);
                handleNewlyReleasedPageClick(e);
              }}
              title="Soon to be Released"
              aria-label="Go to Soon to be Released page"
            >
              <span className="fab-icon">🎬</span>
              <span className="fab-label">Soon to be Released</span>
            </button>

            {/* Light/Dark Mode Toggle */}
            <button
              className="fab-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                setFabOpen(false);
                const newTheme = theme === "dark" ? "light" : "dark";
                setTheme(newTheme);
              }}
              title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
              aria-label={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
            >
              <span className="fab-icon">{theme === "dark" ? "☀️" : "🌙"}</span>
              <span className="fab-label">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
            </button>
          </div>

          {/* Main FAB Button */}
          <button
            className={`fab-main-btn ${fabOpen ? "open" : ""}`}
            onClick={() => setFabOpen(!fabOpen)}
            aria-label={fabOpen ? "Close quick actions" : "Open quick actions"}
            aria-expanded={fabOpen}
          >
            <span className="fab-main-icon">{fabOpen ? "✕" : "☰"}</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
