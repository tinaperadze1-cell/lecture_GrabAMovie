const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const { query } = require("../db");

/**
 * Update snack images from via.placeholder.com to ui-avatars.com
 */
async function updateSnackImages() {
    try {
        console.log("🔄 Updating snack images...");

        // Get all snacks with old placeholder URLs
        const snacks = await query(
            "SELECT id, name, image_url FROM snacks WHERE image_url LIKE '%via.placeholder.com%' OR image_url LIKE '%placeholder.com%'"
        );

        console.log(`Found ${snacks.rows.length} snacks with old placeholder URLs`);

        // Map of snack names to new image URLs
        const imageMap = {
            "Popcorn (Small)": "https://ui-avatars.com/api/?name=Popcorn&size=200&background=ffd700&color=000000&bold=true",
            "Popcorn (Large)": "https://ui-avatars.com/api/?name=Popcorn+Large&size=200&background=ffd700&color=000000&bold=true",
            "Soda": "https://ui-avatars.com/api/?name=Soda&size=200&background=ff0000&color=ffffff&bold=true",
            "Combo Deal": "https://ui-avatars.com/api/?name=Combo&size=200&background=00ff00&color=000000&bold=true",
            "Nachos": "https://ui-avatars.com/api/?name=Nachos&size=200&background=ff8c00&color=ffffff&bold=true",
            "Candy": "https://ui-avatars.com/api/?name=Candy&size=200&background=ff69b4&color=ffffff&bold=true",
        };

        for (const snack of snacks.rows) {
            const newImageUrl = imageMap[snack.name];
            if (newImageUrl) {
                await query(
                    "UPDATE snacks SET image_url = $1 WHERE id = $2",
                    [newImageUrl, snack.id]
                );
                console.log(`✅ Updated ${snack.name}`);
            } else {
                // Generate a generic placeholder for unknown snacks
                const shortName = snack.name.length > 10 ? snack.name.substring(0, 10) : snack.name;
                const genericUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(shortName)}&size=200&background=1a1a2e&color=9ec9ff&bold=true`;
                await query(
                    "UPDATE snacks SET image_url = $1 WHERE id = $2",
                    [genericUrl, snack.id]
                );
                console.log(`✅ Updated ${snack.name} with generic placeholder`);
            }
        }

        console.log("🎉 Snack images update complete!");
    } catch (error) {
        console.error("❌ Error updating snack images:", error);
        throw error;
    }
}

if (require.main === module) {
    updateSnackImages()
        .then(() => {
            console.log("🎉 Update complete!");
            process.exit(0);
        })
        .catch((err) => {
            console.error("❌ Update failed:", err);
            process.exit(1);
        });
}

module.exports = { updateSnackImages };

