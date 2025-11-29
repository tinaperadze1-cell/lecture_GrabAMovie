import { useState, useEffect } from "react";
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
} from "./api";

function App() {
  const [movies, setMovies] = useState([]);
  const [topRatedMovies, setTopRatedMovies] = useState([]); // Top-rated movies
  const [ratings, setRatings] = useState({}); // User's current ratings
  const [movieRatings, setMovieRatings] = useState({}); // Average ratings for each movie
  const [comments, setComments] = useState({}); // Comments for each movie { movieId: [comments] }
  const [commentTexts, setCommentTexts] = useState({}); // New comment input text
  const [editingComment, setEditingComment] = useState(null); // { movieId, commentId, text }
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
  const [showProfile, setShowProfile] = useState(false);
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

  // Available themes
  const availableThemes = [
    { value: "dark", label: "Dark Mode" },
    { value: "light", label: "Light Mode" },
    { value: "red", label: "Red Theme" },
    { value: "blue", label: "Blue Theme" },
    { value: "christmas", label: "Christmas Theme" },
    { value: "halloween", label: "Halloween Theme" },
    { value: "stranger", label: "Stranger Things Theme" },
    { value: "custom", label: "Custom Color Theme" },
  ];

  // Apply theme to document root
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("grabamovie_theme", theme);

    // If custom color theme, apply custom colors
    if (theme === "custom") {
      applyCustomColorTheme(customColor);
    }
  }, [theme, customColor]);

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
      try {
        const data = await fetchTopRatedMovies(10);
        setTopRatedMovies(data);
      } catch (error) {
        console.error("Error fetching top-rated movies:", error);
        setTopRatedMovies([]);
      }
    };

    loadTopRated();
  }, [movieRatings]); // Reload when ratings change

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
      // Fetch full movie details
      const movie = await fetchMovie(movieId);
      setSelectedMovie(movie);

      // Scroll to top
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("Error loading movie details:", error);
      alert("Failed to load movie details");
    }
  };

  const handleBackToList = () => {
    setSelectedMovie(null);
    setShowProfile(false);
    setProfileEditMode(false);
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
              <a
                href="#profile"
                onClick={(e) => {
                  e.preventDefault();
                  handleProfileClick();
                }}
                className="nav-edit-link"
              >
                Edit
              </a>
            )}
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
                      {movie.poster_url ? (
                        <img
                          src={movie.poster_url}
                          alt={movie.title}
                          className="search-result-poster"
                          onError={(e) => {
                            e.target.style.display = "none";
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
          </nav>
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
          ) : (
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

              {/* Top Rated Movies Section */}
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

                <div className="top-rated-grid">
                  {topRatedMovies.length === 0 ? (
                    <p className="no-movies">Loading top-rated movies...</p>
                  ) : (
                    topRatedMovies.map((movie) => {
                      const rating = movie.imdb_rating || movie.avg_user_rating;
                      const ratingValue = rating ? parseFloat(rating) : 0;
                      const stars = Math.round(ratingValue / 2); // Convert 10-point scale to 5 stars

                      return (
                        <div
                          key={movie.id}
                          className="top-rated-card"
                          onClick={() => handleMovieClick(movie.id)}
                        >
                          {movie.poster_url ? (
                            <img
                              src={movie.poster_url}
                              alt={movie.title}
                              className="top-rated-poster"
                              onError={(e) => {
                                e.target.style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="top-rated-poster-placeholder">
                              <span>🎬</span>
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
                    })
                  )}
                </div>
              </section>

              {selectedMovie ? (
                <section className="movie-detail-area">
                  <button className="back-btn" onClick={handleBackToList}>
                    ← Back to Movies
                  </button>

                  <div className="movie-detail">
                    <div className="movie-detail-header">
                      {selectedMovie.poster_url ? (
                        <img
                          src={selectedMovie.poster_url}
                          alt={selectedMovie.title}
                          className="movie-poster"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="movie-poster-placeholder">
                          <span>No Poster</span>
                        </div>
                      )}

                      <div className="movie-detail-info">
                        <div className="movie-detail-title-row">
                          <h1>{selectedMovie.title}</h1>
                          <div className="movie-detail-actions">
                            <button
                              className={`favourite-btn ${favourites.has(Number(selectedMovie.id)) ? "active" : ""}`}
                              onClick={() => handleFavouriteClick(selectedMovie.id)}
                              aria-label="Add to favourites"
                              title="Add to Favourites"
                            >
                              {favourites.has(Number(selectedMovie.id)) ? "👑" : "♔"}
                            </button>
                            <button
                              className={`watchlist-btn ${watchlist.has(Number(selectedMovie.id)) ? "active" : ""}`}
                              onClick={() => handleWatchlistClick(selectedMovie.id)}
                              aria-label="Add to watchlist"
                              title="Add to Watchlist"
                            >
                              {watchlist.has(Number(selectedMovie.id)) ? "✓" : "+"}
                            </button>
                          </div>
                        </div>

                        <div className="movie-detail-meta">
                          <span className="movie-year">{selectedMovie.year}</span>
                          <span className="movie-separator">·</span>
                          <span className="movie-genre">{selectedMovie.genre}</span>
                          {selectedMovie.duration && (
                            <>
                              <span className="movie-separator">·</span>
                              <span className="movie-duration">{selectedMovie.duration} min</span>
                            </>
                          )}
                        </div>

                        {movieRatings[selectedMovie.id]?.average && (
                          <div className="movie-detail-rating">
                            <span className="rating-value-large">
                              {movieRatings[selectedMovie.id].average.toFixed(1)}
                            </span>
                            <span className="rating-stars-large">
                              {"★".repeat(Math.round(movieRatings[selectedMovie.id].average))}
                            </span>
                            <span className="rating-count-large">
                              ({movieRatings[selectedMovie.id].count} {movieRatings[selectedMovie.id].count === 1 ? 'rating' : 'ratings'})
                            </span>
                          </div>
                        )}

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
                      </div>
                    </div>

                    {selectedMovie.description && (
                      <div className="movie-description">
                        <h3>Description</h3>
                        <p>{selectedMovie.description}</p>
                      </div>
                    )}

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
                  </div>
                </section>
              ) : (
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
                    ) : filteredMovies.length === 0 ? (
                      <p style={{ gridColumn: "1 / -1", textAlign: "center", color: "#ff8f8f" }}>
                        {movies.length === 0
                          ? "No movies found. Make sure the backend is running and database is initialized."
                          : "No movies match your filters. Try adjusting your filter criteria."}
                      </p>
                    ) : (
                      filteredMovies.map((movie) => {
                        const movieRatingData = movieRatings[movie.id] || { average: null, count: 0 };
                        const movieComments = comments[movie.id] || [];
                        const isEditingThisMovie = editingComment?.movieId === movie.id;

                        return (
                          <article className="movie-card" key={movie.id}>
                            <div className="movie-info">
                              <p className="tag">{movie.genre}</p>
                              <div className="movie-title-row">
                                <h3
                                  className="movie-title-clickable"
                                  onClick={() => handleMovieClick(movie.id)}
                                  style={{ cursor: "pointer" }}
                                  title="Click to view details"
                                >
                                  {movie.title}
                                </h3>
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
                              {movieRatingData.average && (
                                <div className="average-rating">
                                  <span className="rating-value">{movieRatingData.average.toFixed(1)}</span>
                                  <span className="rating-count">({movieRatingData.count} {movieRatingData.count === 1 ? 'rating' : 'ratings'})</span>
                                </div>
                              )}
                            </div>
                            <div className="star-row">{renderStars(movie.id)}</div>

                            {/* Comments Section */}
                            <div className="comments-section">
                              <h4 className="comments-title">Comments</h4>

                              {/* Comment Input */}
                              {isAuthenticated && (
                                <div className="comment-input-container">
                                  <textarea
                                    className="comment-input"
                                    placeholder="Write a comment..."
                                    value={commentTexts[movie.id] || ""}
                                    onChange={(e) =>
                                      setCommentTexts((prev) => ({
                                        ...prev,
                                        [movie.id]: e.target.value,
                                      }))
                                    }
                                    rows={3}
                                  />
                                  <button
                                    className="comment-submit-btn"
                                    onClick={() => handleCommentSubmit(movie.id)}
                                  >
                                    Post Comment
                                  </button>
                                </div>
                              )}

                              {/* Comments List */}
                              <div className="comments-list">
                                {movieComments.length === 0 ? (
                                  <p className="no-comments">No comments yet. Be the first to comment!</p>
                                ) : (
                                  movieComments.map((comment) => {
                                    const isOwnComment = currentUser && comment.user_id === currentUser.id;
                                    const isEditing = isEditingThisMovie && editingComment?.commentId === comment.id;

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
                                                    handleCommentEdit(movie.id, comment.id, comment.comment_text)
                                                  }
                                                >
                                                  Edit
                                                </button>
                                                <button
                                                  className="comment-delete-btn"
                                                  onClick={() => handleCommentDelete(movie.id, comment.id)}
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
                          </article>
                        );
                      })
                    )}
                  </div>
                </section>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
