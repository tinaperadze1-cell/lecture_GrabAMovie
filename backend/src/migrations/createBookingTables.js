const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const { query } = require("../db");

/**
 * Create all tables needed for the booking system
 */
async function createBookingTables() {
    try {
        console.log("🔄 Creating booking system tables...");

        // Add release_date column to movies table if it doesn't exist
        try {
            await query(`ALTER TABLE movies ADD COLUMN IF NOT EXISTS release_date DATE`);
            await query(`ALTER TABLE movies ADD COLUMN IF NOT EXISTS tmdb_id INTEGER`);
            console.log("✅ Movies table updated with release_date and tmdb_id");
        } catch (error) {
            console.log("ℹ️  Movies table columns check completed");
        }

        // Create snacks table (snack catalog)
        await query(`
      CREATE TABLE IF NOT EXISTS snacks (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        image_url VARCHAR(500),
        category VARCHAR(100),
        available BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        console.log("✅ Snacks table created");

        // Create showings table (movie showtimes)
        await query(`
      CREATE TABLE IF NOT EXISTS showings (
        id SERIAL PRIMARY KEY,
        movie_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
        showtime TIMESTAMP NOT NULL,
        theater_name VARCHAR(255) DEFAULT 'Main Theater',
        total_seats INTEGER DEFAULT 80,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        console.log("✅ Showings table created");

        // Create seats table (theater seat layout)
        await query(`
      CREATE TABLE IF NOT EXISTS seats (
        id SERIAL PRIMARY KEY,
        showing_id INTEGER NOT NULL REFERENCES showings(id) ON DELETE CASCADE,
        row_label VARCHAR(10) NOT NULL,
        seat_number INTEGER NOT NULL,
        seat_type VARCHAR(50) DEFAULT 'standard',
        price DECIMAL(10, 2) DEFAULT 12.00,
        is_reserved BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(showing_id, row_label, seat_number)
      )
    `);
        console.log("✅ Seats table created");

        // Create bookings table (completed bookings)
        await query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        movie_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
        showing_id INTEGER NOT NULL REFERENCES showings(id) ON DELETE CASCADE,
        total_amount DECIMAL(10, 2) NOT NULL,
        booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50) DEFAULT 'confirmed',
        booking_reference VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        console.log("✅ Bookings table created");

        // Create booking_seats table (seats in bookings)
        await query(`
      CREATE TABLE IF NOT EXISTS booking_seats (
        id SERIAL PRIMARY KEY,
        booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
        seat_id INTEGER NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(booking_id, seat_id)
      )
    `);
        console.log("✅ Booking_seats table created");

        // Create booking_snacks table (snacks in bookings)
        await query(`
      CREATE TABLE IF NOT EXISTS booking_snacks (
        id SERIAL PRIMARY KEY,
        booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
        snack_id INTEGER NOT NULL REFERENCES snacks(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL DEFAULT 1,
        price_at_purchase DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        console.log("✅ Booking_snacks table created");

        // Create indexes for better performance
        await query(`CREATE INDEX IF NOT EXISTS idx_showings_movie_id ON showings(movie_id)`);
        await query(`CREATE INDEX IF NOT EXISTS idx_showings_showtime ON showings(showtime)`);
        await query(`CREATE INDEX IF NOT EXISTS idx_seats_showing_id ON seats(showing_id)`);
        await query(`CREATE INDEX IF NOT EXISTS idx_seats_reserved ON seats(is_reserved)`);
        await query(`CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id)`);
        await query(`CREATE INDEX IF NOT EXISTS idx_bookings_movie_id ON bookings(movie_id)`);
        await query(`CREATE INDEX IF NOT EXISTS idx_bookings_showing_id ON bookings(showing_id)`);
        await query(`CREATE INDEX IF NOT EXISTS idx_booking_seats_booking_id ON booking_seats(booking_id)`);
        await query(`CREATE INDEX IF NOT EXISTS idx_booking_seats_seat_id ON booking_seats(seat_id)`);
        await query(`CREATE INDEX IF NOT EXISTS idx_booking_snacks_booking_id ON booking_snacks(booking_id)`);
        console.log("✅ Indexes created");

        console.log("🎉 All booking tables created successfully!");
    } catch (error) {
        console.error("❌ Error creating booking tables:", error);
        throw error;
    }
}

if (require.main === module) {
    createBookingTables()
        .then(() => {
            console.log("🎉 Migration complete!");
            process.exit(0);
        })
        .catch((err) => {
            console.error("❌ Migration failed:", err);
            process.exit(1);
        });
}

module.exports = { createBookingTables };

