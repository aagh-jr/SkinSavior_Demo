"""
Curated list of popular skincare products to seed the catalog with.

Two lookup keys per product:

  BRAND_DOMAINS[brand]  -> the brand's Shopify domain. The fetcher queries
                           /search/suggest.json there to get the STUDIO product
                           photo + price without needing a per-product URL.
                           This is the main source of good photography.

  item["url"]           -> optional exact product page. Used when the brand
                           isn't on Shopify but does publish schema.org JSON-LD.

Neither is required: with both absent the fetcher falls back to INCIDecoder's
photo. The INCI list always comes from INCIDecoder regardless.

`search` overrides the INCIDecoder query when "brand + name" doesn't find it.
"""

# Verified Shopify storefronts (probed for /search/suggest.json support).
# One entry per brand covers every product from that brand.
BRAND_DOMAINS = {
    "COSRX": "cosrx.com",
    "Beauty of Joseon": "beautyofjoseon.com",
    "Anua": "anua.us",
    "SKIN1004": "skin1004.com",
    "Torriden": "torriden.us",
    "Axis-Y": "axis-y.com",
    "mixsoon": "mixsoon.us",
    "medicube": "medicube.us",
    "TIRTIR": "tirtir.us",
    "Innisfree": "us.innisfree.com",
    "Glow Recipe": "www.glowrecipe.com",
    "Summer Fridays": "summerfridays.com",
    "Farmacy": "www.farmacybeauty.com",
    "Tatcha": "www.tatcha.com",
    "Sunday Riley": "sundayriley.com",
    "Versed": "versedskin.com",
    "Bubble": "bubbleskincare.com",
    "Naturium": "naturium.com",
    "BYOMA": "byoma.com",
    "The INKEY List": "theinkeylist.com",
    "Dieux": "dieuxskin.com",
    "Kosas": "kosas.com",
}

CATALOG = [
    # ---------------- K-beauty: COSRX ----------------
    {"brand": "COSRX", "name": "Advanced Snail 96 Mucin Power Essence", "category": "Essence"},
    {"brand": "COSRX", "name": "Low pH Good Morning Gel Cleanser", "category": "Cleanser"},
    {"brand": "COSRX", "name": "Advanced Snail 92 All In One Cream", "category": "Moisturizer"},
    {"brand": "COSRX", "name": "BHA Blackhead Power Liquid", "category": "Exfoliant"},
    {"brand": "COSRX", "name": "AHA/BHA Clarifying Treatment Toner", "category": "Toner"},
    {"brand": "COSRX", "name": "The Vitamin C 23 Serum", "category": "Serum"},
    {"brand": "COSRX", "name": "Acne Pimple Master Patch", "category": "Treatment"},
    {"brand": "COSRX", "name": "Snail Mucin 92 Gel Cream", "category": "Moisturizer"},

    # ---------------- K-beauty: Beauty of Joseon ----------------
    {"brand": "Beauty of Joseon", "name": "Relief Sun Rice + Probiotics SPF50+", "category": "Sunscreen"},
    {"brand": "Beauty of Joseon", "name": "Glow Serum Propolis + Niacinamide", "category": "Serum"},
    {"brand": "Beauty of Joseon", "name": "Revive Eye Serum Ginseng + Retinal", "category": "Eye Cream"},
    {"brand": "Beauty of Joseon", "name": "Glow Deep Serum Rice + Alpha Arbutin", "category": "Serum"},
    {"brand": "Beauty of Joseon", "name": "Dynasty Cream", "category": "Moisturizer"},
    {"brand": "Beauty of Joseon", "name": "Green Plum Refreshing Toner", "category": "Toner"},
    {"brand": "Beauty of Joseon", "name": "Ginseng Cleansing Oil", "category": "Cleanser"},
    {"brand": "Beauty of Joseon", "name": "Radiance Cleansing Balm", "category": "Cleanser"},

    # ---------------- K-beauty: trending brands ----------------
    {"brand": "Anua", "name": "Heartleaf 77% Soothing Toner", "category": "Toner"},
    {"brand": "Anua", "name": "Heartleaf Pore Control Cleansing Oil", "category": "Cleanser"},
    {"brand": "Anua", "name": "Peach 77 Niacin Conditioning Toner", "category": "Toner"},
    {"brand": "SKIN1004", "name": "Madagascar Centella Ampoule", "category": "Ampoule"},
    {"brand": "SKIN1004", "name": "Madagascar Centella Light Cleansing Oil", "category": "Cleanser"},
    {"brand": "SKIN1004", "name": "Madagascar Centella Hyalu-Cica Water-Fit Sun Serum", "category": "Sunscreen"},
    {"brand": "Torriden", "name": "DIVE-IN Low Molecular Hyaluronic Acid Serum", "category": "Serum"},
    {"brand": "Torriden", "name": "DIVE-IN Low Molecular Hyaluronic Acid Soothing Cream", "category": "Moisturizer"},
    {"brand": "Axis-Y", "name": "Dark Spot Correcting Glow Serum", "category": "Serum"},
    {"brand": "mixsoon", "name": "Bean Essence", "category": "Essence"},
    {"brand": "medicube", "name": "Zero Pore Pad 2.0", "category": "Exfoliant"},
    {"brand": "TIRTIR", "name": "Milk Skin Toner", "category": "Toner"},
    {"brand": "Innisfree", "name": "Green Tea Seed Hyaluronic Serum", "category": "Serum"},
    {"brand": "Innisfree", "name": "Volcanic Pore Clay Mask", "category": "Mask"},
    {"brand": "Round Lab", "name": "1025 Dokdo Toner", "category": "Toner"},
    {"brand": "Round Lab", "name": "Birch Juice Moisturizing Sunscreen", "category": "Sunscreen"},
    {"brand": "Laneige", "name": "Water Sleeping Mask", "category": "Mask"},
    {"brand": "Laneige", "name": "Lip Sleeping Mask", "category": "Balm"},
    {"brand": "Some By Mi", "name": "AHA BHA PHA 30 Days Miracle Toner", "category": "Toner"},
    {"brand": "Purito", "name": "Centella Green Level Unscented Sun SPF50+", "category": "Sunscreen"},
    {"brand": "Etude House", "name": "SoonJung 2x Barrier Intensive Cream", "category": "Moisturizer"},
    {"brand": "Dr. Jart+", "name": "Cicapair Tiger Grass Color Correcting Treatment", "category": "Treatment"},
    {"brand": "Isntree", "name": "Hyaluronic Acid Toner", "category": "Toner"},
    {"brand": "Klairs", "name": "Supple Preparation Unscented Toner", "category": "Toner"},

    # ---------------- US drugstore ----------------
    {"brand": "CeraVe", "name": "Moisturizing Cream", "category": "Moisturizer"},
    {"brand": "CeraVe", "name": "Foaming Facial Cleanser", "category": "Cleanser"},
    {"brand": "CeraVe", "name": "Hydrating Facial Cleanser", "category": "Cleanser"},
    {"brand": "CeraVe", "name": "PM Facial Moisturizing Lotion", "category": "Moisturizer"},
    {"brand": "CeraVe", "name": "AM Facial Moisturizing Lotion SPF 30", "category": "Moisturizer"},
    {"brand": "CeraVe", "name": "SA Smoothing Cleanser", "category": "Cleanser"},
    {"brand": "CeraVe", "name": "Renewing SA Cleanser", "category": "Cleanser"},
    {"brand": "La Roche-Posay", "name": "Toleriane Double Repair Face Moisturizer", "category": "Moisturizer"},
    {"brand": "La Roche-Posay", "name": "Anthelios Melt-In Milk Sunscreen SPF 60", "category": "Sunscreen"},
    {"brand": "La Roche-Posay", "name": "Effaclar Duo", "category": "Treatment"},
    {"brand": "La Roche-Posay", "name": "Toleriane Purifying Foaming Cleanser", "category": "Cleanser"},
    {"brand": "La Roche-Posay", "name": "Cicaplast Baume B5", "category": "Balm"},
    {"brand": "Neutrogena", "name": "Hydro Boost Water Gel", "category": "Moisturizer"},
    {"brand": "Neutrogena", "name": "Ultra Sheer Dry-Touch Sunscreen SPF 55", "category": "Sunscreen"},
    {"brand": "Vanicream", "name": "Moisturizing Cream", "category": "Moisturizer"},
    {"brand": "Vanicream", "name": "Gentle Facial Cleanser", "category": "Cleanser"},
    {"brand": "Cetaphil", "name": "Gentle Skin Cleanser", "category": "Cleanser"},
    {"brand": "Cetaphil", "name": "Daily Facial Moisturizer SPF 35", "category": "Moisturizer"},
    {"brand": "Aveeno", "name": "Calm + Restore Oat Gel Moisturizer", "category": "Moisturizer"},
    {"brand": "Eucerin", "name": "Advanced Repair Cream", "category": "Moisturizer"},
    {"brand": "Differin", "name": "Adapalene Gel 0.1%", "category": "Treatment"},
    {"brand": "Aquaphor", "name": "Healing Ointment", "category": "Balm"},
    {"brand": "Olay", "name": "Regenerist Micro-Sculpting Cream", "category": "Moisturizer"},
    {"brand": "Nivea", "name": "Creme", "category": "Moisturizer"},
    {"brand": "Bioderma", "name": "Sensibio H2O Micellar Water", "category": "Cleanser"},
    {"brand": "Avene", "name": "Thermal Spring Water", "category": "Mist"},
    {"brand": "Weleda", "name": "Skin Food", "category": "Moisturizer"},

    # ---------------- The Ordinary / budget actives ----------------
    {"brand": "The Ordinary", "name": "Niacinamide 10% + Zinc 1%", "category": "Serum",
     "url": "https://theordinary.com/en-us/niacinamide-10-zinc-1-serum-100436.html"},
    {"brand": "The Ordinary", "name": "Hyaluronic Acid 2% + B5", "category": "Serum"},
    {"brand": "The Ordinary", "name": "Glycolic Acid 7% Exfoliating Toner", "category": "Exfoliant"},
    {"brand": "The Ordinary", "name": "Retinol 0.5% in Squalane", "category": "Serum"},
    {"brand": "The Ordinary", "name": "AHA 30% + BHA 2% Peeling Solution", "category": "Exfoliant"},
    {"brand": "The Ordinary", "name": "Natural Moisturizing Factors + HA", "category": "Moisturizer"},
    {"brand": "The Ordinary", "name": "Squalane Cleanser", "category": "Cleanser"},
    {"brand": "The Ordinary", "name": "Azelaic Acid Suspension 10%", "category": "Treatment"},
    {"brand": "The Ordinary", "name": "Salicylic Acid 2% Solution", "category": "Exfoliant"},
    {"brand": "The Ordinary", "name": "Caffeine Solution 5% + EGCG", "category": "Eye Cream"},
    {"brand": "The INKEY List", "name": "Niacinamide Serum", "category": "Serum"},
    {"brand": "The INKEY List", "name": "Hyaluronic Acid Serum", "category": "Serum"},
    {"brand": "The INKEY List", "name": "Oat Cleansing Balm", "category": "Cleanser"},
    {"brand": "Good Molecules", "name": "Discoloration Correcting Serum", "category": "Serum"},

    # ---------------- Newer / trending US indie ----------------
    {"brand": "Naturium", "name": "Niacinamide Serum 12% Plus Zinc 2%", "category": "Serum"},
    {"brand": "Naturium", "name": "Vitamin C Complex Serum", "category": "Serum"},
    {"brand": "Naturium", "name": "Azelaic Topical Acid 10%", "category": "Treatment"},
    {"brand": "BYOMA", "name": "Moisturizing Rich Cream", "category": "Moisturizer"},
    {"brand": "BYOMA", "name": "Hydrating Milky Toner", "category": "Toner"},
    {"brand": "BYOMA", "name": "Creamy Jelly Cleanser", "category": "Cleanser"},
    {"brand": "Bubble", "name": "Slam Dunk Hydrating Moisturizer", "category": "Moisturizer"},
    {"brand": "Bubble", "name": "Fresh Start Gel Cleanser", "category": "Cleanser"},
    {"brand": "Versed", "name": "Dew Point Moisturizing Gel-Cream", "category": "Moisturizer"},
    {"brand": "Versed", "name": "Just Breathe Clarifying Serum", "category": "Serum"},
    {"brand": "Topicals", "name": "Faded Serum", "category": "Serum"},
    {"brand": "Dieux", "name": "Instant Angel Moisturizer", "category": "Moisturizer"},
    {"brand": "Glow Recipe", "name": "Watermelon Glow Niacinamide Dew Drops", "category": "Serum"},
    {"brand": "Glow Recipe", "name": "Watermelon Glow PHA + BHA Pore-Tight Toner", "category": "Toner"},
    {"brand": "Glow Recipe", "name": "Plum Plump Hyaluronic Acid Serum", "category": "Serum"},
    {"brand": "Glow Recipe", "name": "Avocado Melt Retinol Sleeping Mask", "category": "Mask"},

    # ---------------- Prestige ----------------
    {"brand": "Paula's Choice", "name": "Skin Perfecting 2% BHA Liquid Exfoliant", "category": "Exfoliant",
     "url": "https://www.paulaschoice.com/skin-perfecting-2pct-bha-liquid-exfoliant/201.html"},
    {"brand": "Paula's Choice", "name": "Skin Perfecting 8% AHA Gel Exfoliant", "category": "Exfoliant"},
    {"brand": "Paula's Choice", "name": "10% Niacinamide Booster", "category": "Serum"},
    {"brand": "SkinCeuticals", "name": "C E Ferulic", "category": "Serum"},
    {"brand": "SkinCeuticals", "name": "Triple Lipid Restore 2:4:2", "category": "Moisturizer"},
    {"brand": "Drunk Elephant", "name": "Protini Polypeptide Cream", "category": "Moisturizer"},
    {"brand": "Drunk Elephant", "name": "T.L.C. Framboos Glycolic Night Serum", "category": "Serum"},
    {"brand": "Drunk Elephant", "name": "Beste No. 9 Jelly Cleanser", "category": "Cleanser"},
    {"brand": "Tatcha", "name": "The Water Cream", "category": "Moisturizer"},
    {"brand": "Tatcha", "name": "The Dewy Skin Cream", "category": "Moisturizer"},
    {"brand": "Tatcha", "name": "The Rice Wash", "category": "Cleanser"},
    {"brand": "Sunday Riley", "name": "Good Genes All-In-One Lactic Acid Treatment", "category": "Treatment"},
    {"brand": "Sunday Riley", "name": "A+ High-Dose Retinoid Serum", "category": "Serum"},
    {"brand": "Sunday Riley", "name": "C.E.O. 15% Vitamin C Brightening Serum", "category": "Serum"},
    {"brand": "Youth To The People", "name": "Superfood Cleanser", "category": "Cleanser"},
    {"brand": "Youth To The People", "name": "Adaptogen Deep Moisture Cream", "category": "Moisturizer"},
    {"brand": "First Aid Beauty", "name": "Ultra Repair Cream", "category": "Moisturizer"},
    {"brand": "Summer Fridays", "name": "Jet Lag Mask", "category": "Mask"},
    {"brand": "Summer Fridays", "name": "Cloud Dew Oil-Free Gel Cream", "category": "Moisturizer"},
    {"brand": "Kiehl's", "name": "Ultra Facial Cream", "category": "Moisturizer"},
    {"brand": "Kiehl's", "name": "Midnight Recovery Concentrate", "category": "Oil"},
    {"brand": "Clinique", "name": "Moisture Surge 100H Auto-Replenishing Hydrator", "category": "Moisturizer"},
    {"brand": "Farmacy", "name": "Green Clean Makeup Meltaway Cleansing Balm", "category": "Cleanser"},
    {"brand": "Farmacy", "name": "Honey Halo Ceramide Moisturizer", "category": "Moisturizer"},
    {"brand": "Kosas", "name": "Revealer Super Creamy Concealer", "category": "Makeup"},
    {"brand": "Supergoop", "name": "Unseen Sunscreen SPF 40", "category": "Sunscreen"},
    {"brand": "EltaMD", "name": "UV Clear Broad-Spectrum SPF 46", "category": "Sunscreen"},
    {"brand": "Biossance", "name": "Squalane + Omega Repair Cream", "category": "Moisturizer"},
]
