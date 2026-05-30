-- 1. SERIES MASTER: Stores the brand/type (e.g., "Domal 27mm", "Gulf 29mm")
CREATE TABLE series_master (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL, -- e.g., "Domal 27mm", "Regular 3/4 inch"
    system_type VARCHAR(50) NOT NULL, -- "Sliding", "Casement/Openable", "Partition"
    track_type VARCHAR(50) -- "2-Track", "3-Track", "Null" (for partitions)
);

-- 2. PROFILE MASTER: This is where your PDF data lives
CREATE TABLE profile_master (
    id SERIAL PRIMARY KEY,
    series_id INT REFERENCES series_master(id),
    die_no VARCHAR(50), -- e.g., "2904", "SRE 001"
    item_name VARCHAR(255) NOT NULL, -- e.g., "3/4 SINGLE TRACK TOP"
    profile_type VARCHAR(50), -- "Outer_Frame", "Shutter", "Interlock", "Mesh", "Mullion"
    
    -- We convert your PDF weights to kg/meter for calculation
    kg_per_meter DECIMAL(10, 4), 
    
    -- Standard lengths available (e.g., 12ft, 15ft) useful for optimization
    std_length_ft DECIMAL(5, 2) DEFAULT 12.0, 
    
    price_per_kg DECIMAL(10, 2) DEFAULT 0.00, -- You can update this daily
    image_url VARCHAR(500) -- Path to the cross-section image
);

-- 3. HARDWARE MASTER: Rollers, Locks, Screws
CREATE TABLE hardware_master (
    id SERIAL PRIMARY KEY,
    item_name VARCHAR(200), -- e.g., "Domal Roller", "Touch Lock"
    unit_price DECIMAL(10, 2),
    weight_per_piece DECIMAL(10, 4) -- for shipping calc
);

-- 4. LOGIC MATRIX: The "Brain" that connects Profiles to Calculations
CREATE TABLE deduction_formulas (
    id SERIAL PRIMARY KEY,
    series_id INT REFERENCES series_master(id),
    
    -- Constants for this specific series (The "Minus" values)
    track_deduction_mm DECIMAL(10,2), -- Outer frame deduction
    shutter_deduction_mm DECIMAL(10,2), -- Shutter height deduction
    interlock_overlap_mm DECIMAL(10,2), -- Center overlap
    glass_minus_w_mm DECIMAL(10,2), -- Glass Width deduction
    glass_minus_h_mm DECIMAL(10,2) -- Glass Height deduction
);

-- 5. COMPONENT MAPPING: Tells the software which profile to use for which part
CREATE TABLE component_map (
    id SERIAL PRIMARY KEY,
    series_id INT REFERENCES series_master(id),
    component_role VARCHAR(50), -- "Top_Track", "Bottom_Track", "Shutter_Handle"
    profile_id INT REFERENCES profile_master(id) -- Links to the specific Die No.
);