const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const { query } = require("../db");

/**
 * Seed initial data for booking system (snacks, sample showings, seats)
 */
async function seedBookingData() {
    try {
        console.log("🔄 Seeding booking system data...");

        // Seed snacks - using ui-avatars.com for reliable placeholder images
        const snacks = [
            {
                name: "Popcorn (Small)",
                description: "Freshly popped buttered popcorn",
                price: 5.99,
                category: "snacks",
                image_url: "https://ui-avatars.com/api/?name=Popcorn&size=200&background=ffd700&color=000000&bold=true",
            },
            {
                name: "Popcorn (Large)",
                description: "Large bucket of buttered popcorn",
                price: 8.99,
                category: "snacks",
                image_url: "https://ui-avatars.com/api/?name=Popcorn+Large&size=200&background=ffd700&color=000000&bold=true",
            },
            {
                name: "Soda",
                description: "Refreshing soft drink (Pepsi, Coca-Cola, Sprite)",
                price: 4.99,
                category: "drinks",
                image_url: "https://ui-avatars.com/api/?name=Soda&size=200&background=ff0000&color=ffffff&bold=true",
            },
            {
                name: "Combo Deal",
                description: "Large Popcorn + Large Soda",
                price: 11.99,
                category: "combos",
                image_url: "https://ui-avatars.com/api/?name=Combo&size=200&background=00ff00&color=000000&bold=true",
            },
            {
                name: "Nachos",
                description: "Crispy nachos with cheese sauce",
                price: 6.99,
                category: "snacks",
                image_url: "https://ui-avatars.com/api/?name=Nachos&size=200&background=ff8c00&color=ffffff&bold=true",
            },
            {
                name: "Candy",
                description: "Assorted movie theater candy",
                price: 4.99,
                category: "snacks",
                image_url: "https://ui-avatars.com/api/?name=Candy&size=200&background=ff69b4&color=ffffff&bold=true",
            },
        ];

        for (const snack of snacks) {
            const existing = await query(
                "SELECT id FROM snacks WHERE name = $1",
                [snack.name]
            );

            if (existing.rows.length === 0) {
                await query(
                    `INSERT INTO snacks (name, description, price, category, image_url, available)
           VALUES ($1, $2, $3, $4, $5, $6)`,
                    [
                        snack.name,
                        snack.description,
                        snack.price,
                        snack.category,
                        snack.image_url,
                        true,
                    ]
                );
                console.log(`✅ Inserted snack: ${snack.name}`);
            } else {
                // Update existing snack with new image URL if it's using old placeholder
                const existingSnack = existing.rows[0];
                if (existingSnack.image_url && existingSnack.image_url.includes('via.placeholder.com')) {
                    await query(
                        `UPDATE snacks SET image_url = $1 WHERE id = $2`,
                        [snack.image_url, existingSnack.id]
                    );
                    console.log(`✅ Updated snack image: ${snack.name}`);
                } else {
                    console.log(`ℹ️  Snack already exists: ${snack.name}`);
                }
            }
        }

        console.log("🎉 Booking data seeding complete!");
    } catch (error) {
        console.error("❌ Error seeding booking data:", error);
        throw error;
    }
}

if (require.main === module) {
    seedBookingData()
        .then(() => {
            console.log("🎉 Seeding complete!");
            process.exit(0);
        })
        .catch((err) => {
            console.error("❌ Seeding failed:", err);
            process.exit(1);
        });
}

module.exports = { seedBookingData };

