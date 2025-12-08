const { query } = require("./db");

/**
 * Get or create today's movie battle from database
 * All battle data comes from database only
 */
async function getOrCreateDailyBattle() {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Check if battle exists for today in movie_battles (current battle table)
    const existingBattle = await query(
      `SELECT 
        mb.id,
        mb.movie1_id,
        mb.movie2_id,
        mb.movie1_votes,
        mb.movie2_votes,
        mb.winner_id,
        mb.battle_date,
        m1.id as m1_id, m1.title as m1_title, m1.year as m1_year, 
        m1.genre as m1_genre, m1.poster_url as m1_poster, m1.imdb_rating as m1_rating,
        m2.id as m2_id, m2.title as m2_title, m2.year as m2_year,
        m2.genre as m2_genre, m2.poster_url as m2_poster, m2.imdb_rating as m2_rating
       FROM movie_battles mb
       JOIN movies m1 ON mb.movie1_id = m1.id
       JOIN movies m2 ON mb.movie2_id = m2.id
       WHERE mb.battle_date = $1`,
      [today]
    );

    if (existingBattle.rows.length > 0) {
      const battle = existingBattle.rows[0];
      return {
        id: battle.id,
        battleDate: battle.battle_date,
        movie1: {
          id: battle.m1_id,
          title: battle.m1_title,
          year: battle.m1_year,
          genre: battle.m1_genre,
          poster_url: battle.m1_poster,
          imdb_rating: battle.m1_rating ? parseFloat(battle.m1_rating) : null,
        },
        movie2: {
          id: battle.m2_id,
          title: battle.m2_title,
          year: battle.m2_year,
          genre: battle.m2_genre,
          poster_url: battle.m2_poster,
          imdb_rating: battle.m2_rating ? parseFloat(battle.m2_rating) : null,
        },
        movie1Votes: parseInt(battle.movie1_votes) || 0,
        movie2Votes: parseInt(battle.movie2_votes) || 0,
        winnerId: battle.winner_id,
      };
    }

    // Create new battle for today - select 2 random movies from database
    const moviesResult = await query(
      `SELECT id, title, year, genre, poster_url, imdb_rating
       FROM movies 
       ORDER BY RANDOM() 
       LIMIT 2`
    );

    if (moviesResult.rows.length < 2) {
      throw new Error("Not enough movies in database to create a battle");
    }

    const movie1 = moviesResult.rows[0];
    const movie2 = moviesResult.rows[1];

    const newBattle = await query(
      `INSERT INTO movie_battles (movie1_id, movie2_id, battle_date, movie1_votes, movie2_votes)
       VALUES ($1, $2, $3, 0, 0)
       RETURNING id`,
      [movie1.id, movie2.id, today]
    );

    return {
      id: newBattle.rows[0].id,
      battleDate: today,
      movie1: {
        id: movie1.id,
        title: movie1.title,
        year: movie1.year,
        genre: movie1.genre,
        poster_url: movie1.poster_url,
        imdb_rating: movie1.imdb_rating ? parseFloat(movie1.imdb_rating) : null,
      },
      movie2: {
        id: movie2.id,
        title: movie2.title,
        year: movie2.year,
        genre: movie2.genre,
        poster_url: movie2.poster_url,
        imdb_rating: movie2.imdb_rating ? parseFloat(movie2.imdb_rating) : null,
      },
      movie1Votes: 0,
      movie2Votes: 0,
      winnerId: null,
    };
  } catch (error) {
    console.error("Error getting/creating daily battle:", error);
    throw error;
  }
}

/**
 * Submit a vote for a movie in a battle
 * All vote data stored in database
 */
async function submitVote(battleId, userId, votedForMovieId) {
  try {
    // Get battle to verify it exists and get movie IDs
    const battleResult = await query(
      `SELECT movie1_id, movie2_id FROM movie_battles WHERE id = $1`,
      [battleId]
    );

    if (battleResult.rows.length === 0) {
      throw new Error("Battle not found");
    }

    const battle = battleResult.rows[0];
    if (votedForMovieId !== battle.movie1_id && votedForMovieId !== battle.movie2_id) {
      throw new Error("Invalid movie ID for this battle");
    }

    // Check if user already voted (if logged in)
    if (userId) {
      const existingVote = await query(
        `SELECT id FROM battle_votes WHERE battle_id = $1 AND user_id = $2`,
        [battleId, userId]
      );

      if (existingVote.rows.length > 0) {
        throw new Error("You have already voted in this battle");
      }
    }

    // Insert vote into database
    await query(
      `INSERT INTO battle_votes (battle_id, user_id, voted_for_movie_id)
       VALUES ($1, $2, $3)`,
      [battleId, userId || null, votedForMovieId]
    );

    // Update vote counts in database
    const isMovie1 = votedForMovieId === battle.movie1_id;
    await query(
      `UPDATE movie_battles 
       SET ${isMovie1 ? 'movie1_votes' : 'movie2_votes'} = ${isMovie1 ? 'movie1_votes' : 'movie2_votes'} + 1
       WHERE id = $1`,
      [battleId]
    );

    // Update movie stats in database
    await query(
      `INSERT INTO movie_battle_stats (movie_id, total_votes_received)
       VALUES ($1, 1)
       ON CONFLICT (movie_id) 
       DO UPDATE SET total_votes_received = movie_battle_stats.total_votes_received + 1`,
      [votedForMovieId]
    );

    // Get updated battle data from database
    const updatedBattle = await query(
      `SELECT movie1_votes, movie2_votes FROM movie_battles WHERE id = $1`,
      [battleId]
    );

    const movie1Votes = parseInt(updatedBattle.rows[0].movie1_votes) || 0;
    const movie2Votes = parseInt(updatedBattle.rows[0].movie2_votes) || 0;

    // Determine winner and update in database
    let winnerId = null;
    if (movie1Votes > movie2Votes) {
      winnerId = battle.movie1_id;
    } else if (movie2Votes > movie1Votes) {
      winnerId = battle.movie2_id;
    }

    // Update winner in database
    if (winnerId) {
      await query(
        `UPDATE movie_battles SET winner_id = $1 WHERE id = $2`,
        [winnerId, battleId]
      );

      // Update battle stats for winner in database
      await query(
        `INSERT INTO movie_battle_stats (movie_id, battles_won)
         VALUES ($1, 1)
         ON CONFLICT (movie_id) 
         DO UPDATE SET battles_won = movie_battle_stats.battles_won + 1`,
        [winnerId]
      );

      // Update battle stats for loser in database
      const loserId = winnerId === battle.movie1_id ? battle.movie2_id : battle.movie1_id;
      await query(
        `INSERT INTO movie_battle_stats (movie_id, battles_lost)
         VALUES ($1, 1)
         ON CONFLICT (movie_id) 
         DO UPDATE SET battles_lost = movie_battle_stats.battles_lost + 1`,
        [loserId]
      );
    }

    return {
      movie1Votes,
      movie2Votes,
      totalVotes: movie1Votes + movie2Votes,
    };
  } catch (error) {
    console.error("Error submitting vote:", error);
    throw error;
  }
}

/**
 * Check if user has voted in today's battle
 */
async function hasUserVoted(battleId, userId) {
  if (!userId) return false;
  
  try {
    const result = await query(
      `SELECT id FROM battle_votes WHERE battle_id = $1 AND user_id = $2`,
      [battleId, userId]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error("Error checking user vote:", error);
    return false;
  }
}

/**
 * Get yesterday's winner from database
 */
async function getYesterdayWinner() {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const result = await query(
      `SELECT 
        mb.winner_id,
        mb.movie1_id,
        mb.movie2_id,
        m.id, m.title, m.year, m.genre, m.poster_url, m.imdb_rating,
        mb.movie1_votes, mb.movie2_votes
       FROM movie_battles mb
       JOIN movies m ON mb.winner_id = m.id
       WHERE mb.battle_date = $1 AND mb.winner_id IS NOT NULL
       ORDER BY mb.id DESC
       LIMIT 1`,
      [yesterdayStr]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    const votesReceived = row.winner_id === row.movie1_id 
      ? parseInt(row.movie1_votes) || 0
      : parseInt(row.movie2_votes) || 0;
    const totalVotes = (parseInt(row.movie1_votes) || 0) + (parseInt(row.movie2_votes) || 0);
    
    return {
      id: row.id,
      title: row.title,
      year: row.year,
      genre: row.genre,
      poster_url: row.poster_url,
      imdb_rating: row.imdb_rating ? parseFloat(row.imdb_rating) : null,
      votesReceived,
      totalVotes,
    };
  } catch (error) {
    console.error("Error getting yesterday's winner:", error);
    return null;
  }
}

/**
 * Get current monthly leader from database
 */
async function getMonthlyLeader() {
  try {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

    const result = await query(
      `SELECT 
        mb.winner_id,
        m.id, m.title, m.year, m.genre, m.poster_url, m.imdb_rating,
        COUNT(*) as wins_this_month
       FROM movie_battles mb
       JOIN movies m ON mb.winner_id = m.id
       WHERE mb.battle_date >= $1 AND mb.winner_id IS NOT NULL
       GROUP BY mb.winner_id, m.id, m.title, m.year, m.genre, m.poster_url, m.imdb_rating
       ORDER BY wins_this_month DESC
       LIMIT 1`,
      [firstDayOfMonth]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      title: row.title,
      year: row.year,
      genre: row.genre,
      poster_url: row.poster_url,
      imdb_rating: row.imdb_rating ? parseFloat(row.imdb_rating) : null,
      winsThisMonth: parseInt(row.wins_this_month),
    };
  } catch (error) {
    console.error("Error getting monthly leader:", error);
    return null;
  }
}

/**
 * Get battle statistics for a movie from database
 */
async function getMovieBattleStats(movieId) {
  try {
    const result = await query(
      `SELECT 
        battles_won, 
        battles_lost, 
        total_votes_received,
        CASE 
          WHEN battles_won + battles_lost > 0 
          THEN ROUND((battles_won::DECIMAL / (battles_won + battles_lost)) * 100, 1)
          ELSE 0
        END as win_percentage
       FROM movie_battle_stats
       WHERE movie_id = $1`,
      [movieId]
    );

    if (result.rows.length === 0) {
      return {
        battlesWon: 0,
        battlesLost: 0,
        totalVotesReceived: 0,
        winPercentage: 0,
      };
    }

    const row = result.rows[0];
    return {
      battlesWon: parseInt(row.battles_won) || 0,
      battlesLost: parseInt(row.battles_lost) || 0,
      totalVotesReceived: parseInt(row.total_votes_received) || 0,
      winPercentage: parseFloat(row.win_percentage) || 0,
    };
  } catch (error) {
    console.error("Error getting movie battle stats:", error);
    return {
      battlesWon: 0,
      battlesLost: 0,
      totalVotesReceived: 0,
      winPercentage: 0,
    };
  }
}

/**
 * Archive completed battle to history table
 */
async function archiveBattleToHistory(battleId) {
  try {
    const battle = await query(
      `SELECT movie1_id, movie2_id, winner_id, battle_date, movie1_votes, movie2_votes
       FROM movie_battles 
       WHERE id = $1`,
      [battleId]
    );

    if (battle.rows.length === 0) {
      return null;
    }

    const b = battle.rows[0];
    await query(
      `INSERT INTO movie_battle_history (movie_a_id, movie_b_id, winner_id, date, votes_a, votes_b)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        b.movie1_id,
        b.movie2_id,
        b.winner_id,
        b.battle_date,
        b.movie1_votes,
        b.movie2_votes
      ]
    );

    return true;
  } catch (error) {
    console.error("Error archiving battle to history:", error);
    return false;
  }
}

/**
 * Get battle leaderboard from database
 */
async function getBattleLeaderboard(limit = 10) {
  try {
    const result = await query(
      `SELECT 
        mbs.movie_id,
        m.title,
        m.poster_url,
        mbs.battles_won,
        mbs.battles_lost,
        mbs.total_votes_received,
        CASE 
          WHEN mbs.battles_won + mbs.battles_lost > 0 
          THEN ROUND((mbs.battles_won::DECIMAL / (mbs.battles_won + mbs.battles_lost)) * 100, 1)
          ELSE 0
        END as win_percentage
       FROM movie_battle_stats mbs
       JOIN movies m ON mbs.movie_id = m.id
       WHERE mbs.battles_won > 0
       ORDER BY mbs.battles_won DESC, win_percentage DESC
       LIMIT $1`,
      [limit]
    );

    return result.rows.map(row => ({
      movieId: row.movie_id,
      title: row.title,
      poster_url: row.poster_url,
      battlesWon: parseInt(row.battles_won) || 0,
      battlesLost: parseInt(row.battles_lost) || 0,
      totalVotesReceived: parseInt(row.total_votes_received) || 0,
      winPercentage: parseFloat(row.win_percentage) || 0,
    }));
  } catch (error) {
    console.error("Error getting battle leaderboard:", error);
    return [];
  }
}

module.exports = {
  getOrCreateDailyBattle,
  submitVote,
  hasUserVoted,
  getYesterdayWinner,
  getMonthlyLeader,
  getMovieBattleStats,
  archiveBattleToHistory,
  getBattleLeaderboard,
};
