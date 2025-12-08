import { useState, useEffect } from "react";
import {
  fetchMovies,
  adminCreateMovie,
  adminUpdateMovie,
  adminDeleteMovie,
  adminGetShowings,
  adminCreateShowing,
  adminUpdateShowing,
  adminDeleteShowing,
  adminGetBookings,
  adminGetUsers,
  adminGetUserActivity,
  adminBanUser,
  adminWarnUser,
  adminGetFlaggedComments,
  adminGetComments,
  adminDeleteComment,
  adminUnflagComment,
  adminGetMovieRatings,
  adminGetPopularMovies,
  adminRemoveFavourite,
  adminRemoveWatchlist,
} from "./api";
import "./AdminPanel.css";

function AdminPanel({ currentUser, onBack }) {
  const [activeTab, setActiveTab] = useState("movies");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Movie Management
  const [movies, setMovies] = useState([]);
  const [editingMovie, setEditingMovie] = useState(null);
  const [showMovieForm, setShowMovieForm] = useState(false);

  // Ticket Management
  const [showings, setShowings] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [editingShowing, setEditingShowing] = useState(null);
  const [showShowingForm, setShowShowingForm] = useState(false);

  // User Management
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userActivity, setUserActivity] = useState(null);

  // Comments & Ratings
  const [comments, setComments] = useState([]);
  const [flaggedComments, setFlaggedComments] = useState([]);
  const [selectedMovieRatings, setSelectedMovieRatings] = useState(null);

  // Watchlist & Favorites
  const [popularMovies, setPopularMovies] = useState(null);

  useEffect(() => {
    if (currentUser?.id) {
      loadData();
    }
  }, [activeTab, currentUser]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      switch (activeTab) {
        case "movies":
          const moviesData = await fetchMovies();
          setMovies(moviesData);
          break;
        case "tickets":
          const [showingsData, bookingsData, moviesForTickets] = await Promise.all([
            adminGetShowings(currentUser.id),
            adminGetBookings(currentUser.id),
            fetchMovies(), // Load movies for ticket management
          ]);
          setShowings(showingsData);
          setBookings(bookingsData);
          setMovies(moviesForTickets);
          break;
        case "users":
          const usersData = await adminGetUsers(currentUser.id);
          setUsers(usersData);
          break;
        case "comments":
          const [commentsData, flaggedData, moviesForComments] = await Promise.all([
            adminGetComments(currentUser.id),
            adminGetFlaggedComments(currentUser.id),
            fetchMovies(), // Load movies for comments moderation
          ]);
          setComments(commentsData);
          setFlaggedComments(flaggedData);
          setMovies(moviesForComments);
          break;
        case "popular":
          const popularData = await adminGetPopularMovies(currentUser.id);
          setPopularMovies(popularData);
          break;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 3000);
  };

  const showError = (message) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  };

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>Admin Panel</h1>
        <button onClick={onBack} className="btn-back">Back to App</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="admin-tabs">
        <button
          className={activeTab === "movies" ? "active" : ""}
          onClick={() => setActiveTab("movies")}
        >
          🎬 Movies
        </button>
        <button
          className={activeTab === "tickets" ? "active" : ""}
          onClick={() => setActiveTab("tickets")}
        >
          🎫 Tickets
        </button>
        <button
          className={activeTab === "users" ? "active" : ""}
          onClick={() => setActiveTab("users")}
        >
          👥 Users
        </button>
        <button
          className={activeTab === "comments" ? "active" : ""}
          onClick={() => setActiveTab("comments")}
        >
          💬 Comments & Ratings
        </button>
        <button
          className={activeTab === "popular" ? "active" : ""}
          onClick={() => setActiveTab("popular")}
        >
          ⭐ Popular Movies
        </button>
      </div>

      <div className="admin-content">
        {loading && <div className="loading">Loading...</div>}

        {activeTab === "movies" && (
          <MovieManagement
            movies={movies}
            currentUser={currentUser}
            onRefresh={loadData}
            onSuccess={showSuccess}
            onError={showError}
          />
        )}

        {activeTab === "tickets" && (
          <TicketManagement
            showings={showings}
            bookings={bookings}
            movies={movies}
            currentUser={currentUser}
            onRefresh={loadData}
            onSuccess={showSuccess}
            onError={showError}
          />
        )}

        {activeTab === "users" && (
          <UserManagement
            users={users}
            currentUser={currentUser}
            onRefresh={loadData}
            onSuccess={showSuccess}
            onError={showError}
          />
        )}

        {activeTab === "comments" && (
          <CommentsModeration
            comments={comments}
            flaggedComments={flaggedComments}
            movies={movies}
            currentUser={currentUser}
            onRefresh={loadData}
            onSuccess={showSuccess}
            onError={showError}
          />
        )}

        {activeTab === "popular" && (
          <PopularMoviesOverview
            popularMovies={popularMovies}
            currentUser={currentUser}
            onRefresh={loadData}
            onSuccess={showSuccess}
            onError={showError}
          />
        )}
      </div>
    </div>
  );
}

// Movie Management Component
function MovieManagement({ movies, currentUser, onRefresh, onSuccess, onError }) {
  const [showForm, setShowForm] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    year: new Date().getFullYear(),
    genre: "",
    description: "",
    duration: "",
  });
  const [posterFile, setPosterFile] = useState(null);
  const [trailerFile, setTrailerFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingMovie) {
        await adminUpdateMovie(editingMovie.id, formData, currentUser.id, posterFile, trailerFile);
        onSuccess("Movie updated successfully!");
      } else {
        await adminCreateMovie(formData, currentUser.id, posterFile, trailerFile);
        onSuccess("Movie created successfully!");
      }
      setShowForm(false);
      setEditingMovie(null);
      setFormData({ title: "", year: new Date().getFullYear(), genre: "", description: "", duration: "" });
      setPosterFile(null);
      setTrailerFile(null);
      onRefresh();
    } catch (err) {
      onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (movie) => {
    setEditingMovie(movie);
    setFormData({
      title: movie.title,
      year: movie.year,
      genre: movie.genre,
      description: movie.description || "",
      duration: movie.duration || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (movieId) => {
    if (!window.confirm("Are you sure you want to delete this movie?")) return;
    try {
      await adminDeleteMovie(movieId, currentUser.id);
      onSuccess("Movie deleted successfully!");
      onRefresh();
    } catch (err) {
      onError(err.message);
    }
  };

  return (
    <div className="admin-section">
      <div className="section-header">
        <h2>Movie Management</h2>
        <button onClick={() => { setShowForm(true); setEditingMovie(null); }} className="btn-primary">
          + Add Movie
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="movie-form">
          <h3>{editingMovie ? "Edit Movie" : "Add New Movie"}</h3>
          <input
            type="text"
            placeholder="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
          <input
            type="number"
            placeholder="Year"
            value={formData.year}
            onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
            required
          />
          <input
            type="text"
            placeholder="Genre"
            value={formData.genre}
            onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
            required
          />
          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <input
            type="number"
            placeholder="Duration (minutes)"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
          />
          <label>Poster Image:</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPosterFile(e.target.files[0])}
          />
          <label>Trailer Video:</label>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => setTrailerFile(e.target.files[0])}
          />
          <div className="form-actions">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Saving..." : editingMovie ? "Update" : "Create"}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditingMovie(null); }} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="movies-grid">
        {movies.map((movie) => (
          <div key={movie.id} className="movie-card">
            {movie.poster_url && <img src={movie.poster_url} alt={movie.title} />}
            <h3>{movie.title} ({movie.year})</h3>
            <p>{movie.genre}</p>
            <div className="movie-actions">
              <button onClick={() => handleEdit(movie)} className="btn-edit">Edit</button>
              <button onClick={() => handleDelete(movie.id)} className="btn-delete">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Ticket Management Component
function TicketManagement({ showings, bookings, movies, currentUser, onRefresh, onSuccess, onError }) {
  const [showForm, setShowForm] = useState(false);
  const [editingShowing, setEditingShowing] = useState(null);
  const [formData, setFormData] = useState({
    movieId: "",
    showtime: "",
    theaterName: "Main Theater",
    totalSeats: 80,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingShowing) {
        await adminUpdateShowing(editingShowing.id, formData, currentUser.id);
        onSuccess("Showing updated successfully!");
      } else {
        await adminCreateShowing(formData, currentUser.id);
        onSuccess("Showing created successfully!");
      }
      setShowForm(false);
      setEditingShowing(null);
      setFormData({ movieId: "", showtime: "", theaterName: "Main Theater", totalSeats: 80 });
      onRefresh();
    } catch (err) {
      onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (showingId) => {
    if (!window.confirm("Are you sure you want to delete this showing?")) return;
    try {
      await adminDeleteShowing(showingId, currentUser.id);
      onSuccess("Showing deleted successfully!");
      onRefresh();
    } catch (err) {
      onError(err.message);
    }
  };

  return (
    <div className="admin-section">
      <div className="section-header">
        <h2>Ticket Management</h2>
        <button onClick={() => { setShowForm(true); setEditingShowing(null); }} className="btn-primary">
          + Add Showing
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="showing-form">
          <h3>{editingShowing ? "Edit Showing" : "Add New Showing"}</h3>
          <select
            value={formData.movieId}
            onChange={(e) => setFormData({ ...formData, movieId: e.target.value })}
            required
          >
            <option value="">Select Movie</option>
            {movies.map((movie) => (
              <option key={movie.id} value={movie.id}>{movie.title}</option>
            ))}
          </select>
          <input
            type="datetime-local"
            value={formData.showtime}
            onChange={(e) => setFormData({ ...formData, showtime: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Theater Name"
            value={formData.theaterName}
            onChange={(e) => setFormData({ ...formData, theaterName: e.target.value })}
          />
          <input
            type="number"
            placeholder="Total Seats"
            value={formData.totalSeats}
            onChange={(e) => setFormData({ ...formData, totalSeats: parseInt(e.target.value) })}
          />
          <div className="form-actions">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Saving..." : editingShowing ? "Update" : "Create"}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditingShowing(null); }} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="showings-list">
        <h3>Showings</h3>
        {showings.map((showing) => (
          <div key={showing.id} className="showing-item">
            <div>
              <strong>{showing.movie_title}</strong> - {new Date(showing.showtime).toLocaleString()}
              <br />
              {showing.theater_name} | Reserved: {showing.reserved_seats}/{showing.total_seats}
            </div>
            <div className="showing-actions">
              <button onClick={() => handleDelete(showing.id)} className="btn-delete">Delete</button>
            </div>
          </div>
        ))}
      </div>

      <div className="bookings-list">
        <h3>Recent Bookings</h3>
        {bookings.slice(0, 20).map((booking) => (
          <div key={booking.id} className="booking-item">
            <strong>{booking.movie_title}</strong> - {booking.username}
            <br />
            {new Date(booking.booking_date).toLocaleString()} | ${booking.total_amount}
          </div>
        ))}
      </div>
    </div>
  );
}

// User Management Component
function UserManagement({ users, currentUser, onRefresh, onSuccess, onError }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [userActivity, setUserActivity] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleViewActivity = async (userId) => {
    setLoading(true);
    try {
      const activity = await adminGetUserActivity(userId, currentUser.id);
      setUserActivity(activity);
      setSelectedUser(userId);
    } catch (err) {
      onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBan = async (user, isBanned) => {
    if (!window.confirm(`Are you sure you want to ${isBanned ? "ban" : "unban"} ${user.username}?`)) return;
    try {
      await adminBanUser(user.id, { isBanned, banReason: isBanned ? "Admin action" : null }, currentUser.id);
      onSuccess(`User ${isBanned ? "banned" : "unbanned"} successfully!`);
      onRefresh();
    } catch (err) {
      onError(err.message);
    }
  };

  const handleWarn = async (userId) => {
    const reason = window.prompt("Enter warning reason:");
    if (!reason) return;
    try {
      await adminWarnUser(userId, reason, currentUser.id);
      onSuccess("User warned successfully!");
      onRefresh();
    } catch (err) {
      onError(err.message);
    }
  };

  return (
    <div className="admin-section">
      <h2>User Management</h2>
      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Email</th>
              <th>Status</th>
              <th>Activity</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.username}</td>
                <td>{user.email || "-"}</td>
                <td>
                  {user.is_admin && <span className="badge badge-admin">Admin</span>}
                  {user.is_banned && <span className="badge badge-banned">Banned</span>}
                  {!user.is_admin && !user.is_banned && <span className="badge badge-active">Active</span>}
                </td>
                <td>
                  Comments: {user.comment_count} | Ratings: {user.rating_count} | 
                  Favorites: {user.favourite_count} | Watchlist: {user.watchlist_count}
                </td>
                <td>
                  <button onClick={() => handleViewActivity(user.id)} className="btn-view">View</button>
                  <button onClick={() => handleBan(user, !user.is_banned)} className={user.is_banned ? "btn-unban" : "btn-ban"}>
                    {user.is_banned ? "Unban" : "Ban"}
                  </button>
                  {!user.is_admin && (
                    <button onClick={() => handleWarn(user.id)} className="btn-warn">Warn</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedUser && userActivity && (
        <div className="user-activity-modal">
          <h3>User Activity</h3>
          <button onClick={() => { setSelectedUser(null); setUserActivity(null); }} className="btn-close">×</button>
          <div className="activity-sections">
            <div>
              <h4>Comments ({userActivity.comments.length})</h4>
              {userActivity.comments.map((c) => (
                <div key={c.id}>{c.movie_title}: {c.comment_text}</div>
              ))}
            </div>
            <div>
              <h4>Ratings ({userActivity.ratings.length})</h4>
              {userActivity.ratings.map((r) => (
                <div key={r.id}>{r.movie_title}: {r.rating} stars</div>
              ))}
            </div>
            <div>
              <h4>Warnings ({userActivity.warnings.length})</h4>
              {userActivity.warnings.map((w) => (
                <div key={w.id}>{w.warning_reason} - {new Date(w.created_at).toLocaleString()}</div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Comments Moderation Component
function CommentsModeration({ comments, flaggedComments, movies, currentUser, onRefresh, onSuccess, onError }) {
  const [selectedMovieRatings, setSelectedMovieRatings] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleDelete = async (commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;
    try {
      await adminDeleteComment(commentId, currentUser.id);
      onSuccess("Comment deleted successfully!");
      onRefresh();
    } catch (err) {
      onError(err.message);
    }
  };

  const handleUnflag = async (commentId) => {
    try {
      await adminUnflagComment(commentId, currentUser.id);
      onSuccess("Comment unflagged successfully!");
      onRefresh();
    } catch (err) {
      onError(err.message);
    }
  };

  const handleViewRatings = async (movieId) => {
    setLoading(true);
    try {
      const ratings = await adminGetMovieRatings(movieId, currentUser.id);
      setSelectedMovieRatings({ movieId, ...ratings });
    } catch (err) {
      onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-section">
      <h2>Comments & Ratings Moderation</h2>

      <div className="flagged-comments">
        <h3>Flagged Comments ({flaggedComments.length})</h3>
        {flaggedComments.map((comment) => (
          <div key={comment.id} className="comment-item flagged">
            <div className="comment-header">
              <strong>{comment.username}</strong> on <strong>{comment.movie_title}</strong>
              <span className="flag-reason">{comment.flagged_reason}</span>
            </div>
            <div className="comment-text">
              <strong>Displayed:</strong> {comment.comment_text}
              {comment.original_text && (
                <>
                  <br /><strong>Original:</strong> {comment.original_text}
                </>
              )}
            </div>
            <div className="comment-actions">
              <button onClick={() => handleUnflag(comment.id)} className="btn-unflag">Unflag</button>
              <button onClick={() => handleDelete(comment.id)} className="btn-delete">Delete</button>
            </div>
          </div>
        ))}
      </div>

      <div className="all-comments">
        <h3>All Comments</h3>
        {comments.map((comment) => (
          <div key={comment.id} className={`comment-item ${comment.is_flagged ? "flagged" : ""}`}>
            <div className="comment-header">
              <strong>{comment.username}</strong> on <strong>{comment.movie_title}</strong>
              {comment.is_flagged && <span className="badge badge-flagged">Flagged</span>}
            </div>
            <div className="comment-text">{comment.comment_text}</div>
            <div className="comment-actions">
              <button onClick={() => handleDelete(comment.id)} className="btn-delete">Delete</button>
            </div>
          </div>
        ))}
      </div>

      <div className="ratings-section">
        <h3>Movie Rating Stats</h3>
        <select onChange={(e) => e.target.value && handleViewRatings(parseInt(e.target.value))}>
          <option value="">Select a movie to view ratings</option>
          {movies.map((movie) => (
            <option key={movie.id} value={movie.id}>{movie.title}</option>
          ))}
        </select>

        {selectedMovieRatings && (
          <div className="ratings-stats">
            <h4>Rating Statistics</h4>
            <p>Total Ratings: {selectedMovieRatings.stats.total_ratings}</p>
            <p>Average: {selectedMovieRatings.stats.average_rating ? parseFloat(selectedMovieRatings.stats.average_rating).toFixed(1) : "N/A"}</p>
            <p>5★: {selectedMovieRatings.stats.five_star} | 4★: {selectedMovieRatings.stats.four_star} | 3★: {selectedMovieRatings.stats.three_star} | 2★: {selectedMovieRatings.stats.two_star} | 1★: {selectedMovieRatings.stats.one_star}</p>
            <div className="ratings-list">
              {selectedMovieRatings.ratings.map((rating) => (
                <div key={rating.id}>{rating.username}: {rating.rating} stars</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Popular Movies Overview Component
function PopularMoviesOverview({ popularMovies, currentUser, onRefresh, onSuccess, onError }) {
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedMovieId, setSelectedMovieId] = useState(null);

  const handleRemoveFavourite = async (userId, movieId) => {
    if (!window.confirm("Remove this movie from user's favourites?")) return;
    try {
      await adminRemoveFavourite(userId, movieId, currentUser.id);
      onSuccess("Favourite removed successfully!");
      onRefresh();
    } catch (err) {
      onError(err.message);
    }
  };

  const handleRemoveWatchlist = async (userId, movieId) => {
    if (!window.confirm("Remove this movie from user's watchlist?")) return;
    try {
      await adminRemoveWatchlist(userId, movieId, currentUser.id);
      onSuccess("Watchlist item removed successfully!");
      onRefresh();
    } catch (err) {
      onError(err.message);
    }
  };

  if (!popularMovies) return <div>Loading...</div>;

  return (
    <div className="admin-section">
      <h2>Popular Movies Overview</h2>

      <div className="popular-section">
        <h3>Most Favourited Movies</h3>
        <div className="popular-movies-grid">
          {popularMovies.mostFavourited.map((movie) => (
            <div key={movie.id} className="popular-movie-card">
              {movie.poster_url && <img src={movie.poster_url} alt={movie.title} />}
              <h4>{movie.title}</h4>
              <p>{movie.favourite_count} favourites</p>
            </div>
          ))}
        </div>
      </div>

      <div className="popular-section">
        <h3>Most Watchlisted Movies</h3>
        <div className="popular-movies-grid">
          {popularMovies.mostWatchlisted.map((movie) => (
            <div key={movie.id} className="popular-movie-card">
              {movie.poster_url && <img src={movie.poster_url} alt={movie.title} />}
              <h4>{movie.title}</h4>
              <p>{movie.watchlist_count} in watchlist</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;

