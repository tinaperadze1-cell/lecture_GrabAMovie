const { query } = require("./db");

/**
 * Generate quiz questions automatically from movie data
 */
async function generateQuizQuestions(movieId) {
  try {
    // Get movie details (check for director column existence)
    let movieResult;
    try {
      movieResult = await query(
        `SELECT 
          id, 
          title, 
          year, 
          genre,
          COALESCE(imdb_rating, NULL) as imdb_rating,
          COALESCE(director, NULL) as director
        FROM movies 
        WHERE id = $1`,
        [movieId]
      );
    } catch (error) {
      // If director column doesn't exist, query without it
      if (error.message && error.message.includes("column") && error.message.includes("director")) {
        movieResult = await query(
          `SELECT 
            id, 
            title, 
            year, 
            genre,
            COALESCE(imdb_rating, NULL) as imdb_rating
          FROM movies 
          WHERE id = $1`,
          [movieId]
        );
      } else {
        throw error;
      }
    }

    if (movieResult.rows.length === 0) {
      throw new Error("Movie not found");
    }

    const movie = movieResult.rows[0];

    // Get actors for the movie (handle case where table might not exist or no actors)
    let actors = [];
    try {
      const actorsResult = await query(
        `SELECT actor_name FROM movie_actors WHERE movie_id = $1 LIMIT 5`,
        [movieId]
      );
      actors = actorsResult.rows.map(row => row.actor_name);
    } catch (error) {
      // If movie_actors table doesn't exist, continue without actor questions
      console.warn(`Could not fetch actors for movie ${movieId}:`, error.message);
      actors = [];
    }

    const questions = [];

    // Question 1: Release year
    if (movie.year) {
      const wrongYears = [
        movie.year - 1,
        movie.year + 1,
        movie.year - 2,
        movie.year + 2,
      ].filter(y => y > 1900 && y <= new Date().getFullYear());
      const options = [movie.year, ...wrongYears].sort(() => Math.random() - 0.5).slice(0, 4);
      questions.push({
        question: `What year was "${movie.title}" released?`,
        options: options,
        correctAnswer: movie.year.toString(),
      });
    }

    // Question 2: Genre
    if (movie.genre) {
      const genres = ["Action", "Comedy", "Drama", "Thriller", "Horror", "Sci-Fi", "Romance", "Fantasy", "Adventure", "Mystery"];
      const wrongGenres = genres.filter(g => g.toLowerCase() !== movie.genre.toLowerCase()).slice(0, 3);
      const options = [movie.genre, ...wrongGenres].sort(() => Math.random() - 0.5);
      questions.push({
        question: `What is the genre of "${movie.title}"?`,
        options: options,
        correctAnswer: movie.genre,
      });
    }

    // Question 3: IMDB Rating
    if (movie.imdb_rating) {
      const rating = parseFloat(movie.imdb_rating);
      if (!isNaN(rating) && rating >= 0 && rating <= 10) {
        const roundedRating = Math.round(rating * 10) / 10;
        // Format consistently: use whole number format if it's a whole number (e.g., "9" instead of "9.0")
        const correctRatingStr = roundedRating % 1 === 0 ? roundedRating.toString() : roundedRating.toFixed(1);
        const wrongRatings = [
          roundedRating - 0.5,
          roundedRating + 0.5,
          roundedRating - 1.0,
          roundedRating + 1.0,
        ]
          .filter(r => r >= 0 && r <= 10)
          .map(r => r % 1 === 0 ? r.toString() : r.toFixed(1));
        
        const allOptions = [correctRatingStr, ...wrongRatings].sort(() => Math.random() - 0.5).slice(0, 4);
        // Ensure correct answer is in options
        if (!allOptions.includes(correctRatingStr)) {
          allOptions[0] = correctRatingStr;
        }
        const options = allOptions.map(r => `${r}/10`);
        
        questions.push({
          question: `What is the IMDB rating of "${movie.title}"?`,
          options: options,
          correctAnswer: `${correctRatingStr}/10`,
        });
      }
    }

    // Question 4: Actor (if available)
    if (actors.length > 0) {
      try {
        const mainActor = actors[0];
        // Get some random actors from other movies as wrong answers
        const wrongActorsResult = await query(
          `SELECT DISTINCT actor_name FROM movie_actors WHERE movie_id != $1 AND actor_name != $2 ORDER BY RANDOM() LIMIT 3`,
          [movieId, mainActor]
        );
        const wrongActors = wrongActorsResult.rows.map(row => row.actor_name);
        // If we don't have enough wrong actors, pad with generic names
        while (wrongActors.length < 3) {
          wrongActors.push(`Actor ${wrongActors.length + 1}`);
        }
        const options = [mainActor, ...wrongActors].sort(() => Math.random() - 0.5).slice(0, 4);
        questions.push({
          question: `Which actor stars in "${movie.title}"?`,
          options: options,
          correctAnswer: mainActor,
        });
      } catch (error) {
        // Skip actor question if query fails
        console.warn(`Could not generate actor question for movie ${movieId}:`, error.message);
      }
    }

    // Question 5: Title recognition
    if (movie.title) {
      try {
        const similarTitlesResult = await query(
          `SELECT title FROM movies WHERE id != $1 ORDER BY RANDOM() LIMIT 3`,
          [movieId]
        );
        let wrongTitles = similarTitlesResult.rows.map(row => row.title);
        // Pad with generic titles if needed
        const genericTitles = ["The Movie", "Untitled Film", "Classic Film"];
        while (wrongTitles.length < 3) {
          wrongTitles.push(genericTitles[wrongTitles.length] || `Movie ${wrongTitles.length + 1}`);
        }
        const options = [movie.title, ...wrongTitles].sort(() => Math.random() - 0.5);
        questions.push({
          question: `What is the title of this movie?`,
          options: options.slice(0, 4), // Ensure exactly 4 options
          correctAnswer: movie.title,
        });
      } catch (error) {
        // Skip title question if query fails, we'll pad later
        console.warn(`Could not generate title question for movie ${movieId}:`, error.message);
      }
    }

    // Ensure we have at least 5 questions (pad with generic questions if needed)
    while (questions.length < 5) {
      questions.push({
        question: `What year was "${movie.title}" released?`,
        options: [movie.year || "Unknown", "2000", "2010", "2020"],
        correctAnswer: (movie.year || "Unknown").toString(),
      });
    }

    // Save generated questions to database
    if (questions.length > 0) {
      await createOrUpdateQuiz(movieId, questions);
    }

    return questions;
  } catch (error) {
    console.error("Error generating quiz questions:", error);
    // Provide more specific error messages
    if (error.message && error.message.includes("Movie not found")) {
      throw new Error("Movie not found in database");
    }
    throw new Error(`Failed to generate quiz questions: ${error.message}`);
  }
}

/**
 * Get quiz questions for a movie from the database
 * If quiz doesn't exist, automatically generates questions from movie data
 */
async function getQuizQuestions(movieId) {
  try {
    const result = await query(
      `SELECT questions, updated_at
       FROM movie_quizzes 
       WHERE movie_id = $1`,
      [movieId]
    );

    if (result.rows.length === 0) {
      // Auto-generate questions if they don't exist
      console.log(`Auto-generating quiz questions for movie ID ${movieId}`);
      return await generateQuizQuestions(movieId);
    }

    // Parse questions if stored as string, otherwise return as-is (JSONB is auto-parsed)
    let questions = result.rows[0].questions;
    if (typeof questions === 'string') {
      try {
        questions = JSON.parse(questions);
      } catch (parseError) {
        console.error("Error parsing quiz questions JSON:", parseError);
        // If parsing fails, try to regenerate
        console.log(`Regenerating quiz questions for movie ID ${movieId} due to parse error`);
        return await generateQuizQuestions(movieId);
      }
    }

    return questions;
  } catch (error) {
    console.error("Error fetching quiz questions:", error);
    throw error;
  }
}

/**
 * Create or update quiz questions for a movie
 * Admin function to populate quiz database
 */
async function createOrUpdateQuiz(movieId, questions) {
  try {
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error("Questions must be a non-empty array");
    }

    // Validate questions structure
    for (const q of questions) {
      if (!q.question || !q.options || !Array.isArray(q.options) || q.options.length < 2) {
        throw new Error("Each question must have 'question', 'options' (array with at least 2 items)");
      }
      if (q.correctAnswer === undefined && q.correctIndex === undefined) {
        throw new Error("Each question must have 'correctAnswer' or 'correctIndex'");
      }
    }

    const result = await query(
      `INSERT INTO movie_quizzes (movie_id, questions, updated_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (movie_id) 
       DO UPDATE SET 
         questions = $2,
         updated_at = CURRENT_TIMESTAMP
       RETURNING id, movie_id, updated_at`,
      [movieId, JSON.stringify(questions)]
    );

    return result.rows[0];
  } catch (error) {
    console.error("Error creating/updating quiz:", error);
    throw error;
  }
}

/**
 * Submit quiz results and save to database
 */
async function submitQuizResult(userId, movieId, score, totalQuestions, answers) {
  try {
    const result = await query(
      `INSERT INTO quiz_results (user_id, movie_id, score, total_questions, answers, timestamp)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       RETURNING id, score, total_questions, timestamp`,
      [
        userId || null,
        movieId,
        score,
        totalQuestions,
        answers ? JSON.stringify(answers) : null
      ]
    );

    return result.rows[0];
  } catch (error) {
    console.error("Error submitting quiz result:", error);
    throw error;
  }
}

/**
 * Get quiz results for a user
 */
async function getUserQuizResults(userId) {
  try {
    const result = await query(
      `SELECT 
        qr.id,
        qr.movie_id,
        m.title as movie_title,
        qr.score,
        qr.total_questions,
        qr.timestamp
       FROM quiz_results qr
       JOIN movies m ON qr.movie_id = m.id
       WHERE qr.user_id = $1
       ORDER BY qr.timestamp DESC`,
      [userId]
    );

    return result.rows;
  } catch (error) {
    console.error("Error fetching user quiz results:", error);
    throw error;
  }
}

/**
 * Get quiz statistics for a movie
 */
async function getMovieQuizStats(movieId) {
  try {
    const result = await query(
      `SELECT 
        COUNT(*) as total_attempts,
        AVG(score::DECIMAL / total_questions::DECIMAL * 100) as average_score_percentage,
        MAX(score) as highest_score,
        COUNT(DISTINCT user_id) as unique_users
       FROM quiz_results
       WHERE movie_id = $1`,
      [movieId]
    );

    return {
      totalAttempts: parseInt(result.rows[0]?.total_attempts) || 0,
      averageScorePercentage: parseFloat(result.rows[0]?.average_score_percentage) || 0,
      highestScore: parseInt(result.rows[0]?.highest_score) || 0,
      uniqueUsers: parseInt(result.rows[0]?.unique_users) || 0,
    };
  } catch (error) {
    console.error("Error fetching movie quiz stats:", error);
    return {
      totalAttempts: 0,
      averageScorePercentage: 0,
      highestScore: 0,
      uniqueUsers: 0,
    };
  }
}

/**
 * Get all quizzes with movie information (Admin function)
 */
async function getAllQuizzes() {
  try {
    const result = await query(
      `SELECT 
        q.id,
        q.movie_id,
        m.title as movie_title,
        q.questions,
        q.created_at,
        q.updated_at
       FROM movie_quizzes q
       JOIN movies m ON q.movie_id = m.id
       ORDER BY q.updated_at DESC`
    );

    return result.rows.map(row => ({
      id: row.id,
      movieId: row.movie_id,
      movieTitle: row.movie_title,
      questions: typeof row.questions === 'string' ? JSON.parse(row.questions) : row.questions,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      questionCount: Array.isArray(row.questions) ? row.questions.length : (typeof row.questions === 'string' ? JSON.parse(row.questions).length : 0)
    }));
  } catch (error) {
    console.error("Error fetching all quizzes:", error);
    throw error;
  }
}

/**
 * Get a specific quiz by ID (Admin function)
 */
async function getQuizById(quizId) {
  try {
    const result = await query(
      `SELECT 
        q.id,
        q.movie_id,
        m.title as movie_title,
        q.questions,
        q.created_at,
        q.updated_at
       FROM movie_quizzes q
       JOIN movies m ON q.movie_id = m.id
       WHERE q.id = $1`,
      [quizId]
    );

    if (result.rows.length === 0) {
      throw new Error("Quiz not found");
    }

    const row = result.rows[0];
    return {
      id: row.id,
      movieId: row.movie_id,
      movieTitle: row.movie_title,
      questions: typeof row.questions === 'string' ? JSON.parse(row.questions) : row.questions,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  } catch (error) {
    console.error("Error fetching quiz by ID:", error);
    throw error;
  }
}

/**
 * Delete a quiz (Admin function)
 */
async function deleteQuiz(quizId) {
  try {
    const result = await query(
      `DELETE FROM movie_quizzes WHERE id = $1 RETURNING id`,
      [quizId]
    );

    if (result.rows.length === 0) {
      throw new Error("Quiz not found");
    }

    return { success: true, deletedId: result.rows[0].id };
  } catch (error) {
    console.error("Error deleting quiz:", error);
    throw error;
  }
}

/**
 * Delete a specific question from a quiz (Admin function)
 */
async function deleteQuestionFromQuiz(quizId, questionIndex) {
  try {
    // Get the current quiz
    const quizResult = await query(
      `SELECT questions FROM movie_quizzes WHERE id = $1`,
      [quizId]
    );

    if (quizResult.rows.length === 0) {
      throw new Error("Quiz not found");
    }

    let questions = quizResult.rows[0].questions;
    if (typeof questions === 'string') {
      questions = JSON.parse(questions);
    }

    if (!Array.isArray(questions)) {
      throw new Error("Invalid questions format");
    }

    if (questionIndex < 0 || questionIndex >= questions.length) {
      throw new Error("Question index out of range");
    }

    // Remove the question at the specified index
    questions.splice(questionIndex, 1);

    // Update the quiz
    await query(
      `UPDATE movie_quizzes 
       SET questions = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [JSON.stringify(questions), quizId]
    );

    return { success: true, remainingQuestions: questions.length };
  } catch (error) {
    console.error("Error deleting question from quiz:", error);
    throw error;
  }
}

/**
 * Get all quiz results (Admin function - read-only)
 */
async function getAllQuizResults() {
  try {
    const result = await query(
      `SELECT 
        qr.id,
        qr.user_id,
        u.username,
        qr.movie_id,
        m.title as movie_title,
        qr.score,
        qr.total_questions,
        qr.timestamp
       FROM quiz_results qr
       LEFT JOIN users u ON qr.user_id = u.id
       JOIN movies m ON qr.movie_id = m.id
       ORDER BY qr.timestamp DESC
       LIMIT 1000`
    );

    return result.rows;
  } catch (error) {
    console.error("Error fetching all quiz results:", error);
    throw error;
  }
}

/**
 * Get quiz statistics overview (Admin function)
 */
async function getQuizStatisticsOverview() {
  try {
    const result = await query(
      `SELECT 
        COUNT(DISTINCT q.id) as total_quizzes,
        COUNT(DISTINCT qr.movie_id) as movies_with_quizzes,
        COUNT(qr.id) as total_attempts,
        COUNT(DISTINCT qr.user_id) as unique_users,
        AVG(qr.score::DECIMAL / qr.total_questions::DECIMAL * 100) as overall_average_score
       FROM movie_quizzes q
       LEFT JOIN quiz_results qr ON q.movie_id = qr.movie_id`
    );

    return {
      totalQuizzes: parseInt(result.rows[0]?.total_quizzes) || 0,
      moviesWithQuizzes: parseInt(result.rows[0]?.movies_with_quizzes) || 0,
      totalAttempts: parseInt(result.rows[0]?.total_attempts) || 0,
      uniqueUsers: parseInt(result.rows[0]?.unique_users) || 0,
      overallAverageScore: parseFloat(result.rows[0]?.overall_average_score) || 0
    };
  } catch (error) {
    console.error("Error fetching quiz statistics overview:", error);
    throw error;
  }
}

module.exports = {
  getQuizQuestions,
  createOrUpdateQuiz,
  submitQuizResult,
  getUserQuizResults,
  getMovieQuizStats,
  getAllQuizzes,
  getQuizById,
  deleteQuiz,
  deleteQuestionFromQuiz,
  getAllQuizResults,
  getQuizStatisticsOverview,
};
