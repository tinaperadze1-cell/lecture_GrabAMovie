const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const { query } = require("../db");

/**
 * Fix poster URLs in database that are missing the https:// protocol
 */
async function fixPosterUrls() {
    try {
        console.log("🔄 Fixing poster URLs...");

        // Find all poster URLs that start with m.media-amazon.com (missing protocol)
        const movies = await query(
            "SELECT id, title, poster_url FROM movies WHERE poster_url LIKE 'm.media-amazon.com%' OR poster_url LIKE '//m.media-amazon.com%'"
        );

        console.log(`Found ${movies.rows.length} movies with malformed IMDB URLs`);

        let fixed = 0;
        for (const movie of movies.rows) {
            let fixedUrl = movie.poster_url;
            
            // Fix URLs missing https://
            if (fixedUrl.startsWith('m.media-amazon.com')) {
                fixedUrl = `https://${fixedUrl}`;
            } else if (fixedUrl.startsWith('//m.media-amazon.com')) {
                fixedUrl = `https:${fixedUrl}`;
            }

            // Also fix via.placeholder.com URLs
            if (fixedUrl.includes('via.placeholder.com')) {
                // Replace with ui-avatars.com
                const shortTitle = movie.title.length > 20 ? movie.title.substring(0, 20) : movie.title;
                fixedUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(shortTitle)}&size=500&background=1a1a2e&color=9ec9ff&bold=true&length=2`;
            }

            if (fixedUrl !== movie.poster_url) {
                await query(
                    "UPDATE movies SET poster_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
                    [fixedUrl, movie.id]
                );
                console.log(`✅ Fixed: ${movie.title}`);
                fixed++;
            }
        }

        console.log(`🎉 Fixed ${fixed} poster URLs!`);
    } catch (error) {
        console.error("❌ Error fixing poster URLs:", error);
        throw error;
    }
}

if (require.main === module) {
    fixPosterUrls()
        .then(() => {
            console.log("🎉 Fix complete!");
            process.exit(0);
        })
        .catch((err) => {
            console.error("❌ Fix failed:", err);
            process.exit(1);
        });
}

module.exports = { fixPosterUrls };

