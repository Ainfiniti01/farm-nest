-- Create Animals Table
CREATE TABLE IF NOT EXISTS animals (
  id TEXT PRIMARY KEY,
  animal_code TEXT NOT NULL UNIQUE,
  name TEXT,
  species TEXT NOT NULL,
  breed TEXT NOT NULL,
  sex TEXT NOT NULL,
  dob TEXT,
  purchase_date TEXT,
  source TEXT NOT NULL,
  status TEXT NOT NULL,
  health_status TEXT NOT NULL,
  primary_photo TEXT,
  photos TEXT[] DEFAULT '{}',
  mother_id TEXT,
  father_id TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Health Records Table
CREATE TABLE IF NOT EXISTS health_records (
  id TEXT PRIMARY KEY,
  animal_id TEXT REFERENCES animals(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  date TEXT NOT NULL,
  details TEXT NOT NULL,
  medication TEXT,
  recorded_by TEXT NOT NULL
);

-- Create Treatments Table
CREATE TABLE IF NOT EXISTS treatments (
  id TEXT PRIMARY KEY,
  animal_id TEXT REFERENCES animals(id) ON DELETE CASCADE,
  condition TEXT NOT NULL,
  medication TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  status TEXT NOT NULL,
  notes TEXT,
  follow_up_date TEXT
);

-- Create Weight Records Table
CREATE TABLE IF NOT EXISTS weight_records (
  id TEXT PRIMARY KEY,
  animal_id TEXT REFERENCES animals(id) ON DELETE CASCADE,
  weight NUMERIC NOT NULL,
  date TEXT NOT NULL,
  notes TEXT
);

-- Create Breeding Records Table
CREATE TABLE IF NOT EXISTS breeding_records (
  id TEXT PRIMARY KEY,
  female_id TEXT REFERENCES animals(id) ON DELETE CASCADE,
  male_id TEXT REFERENCES animals(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  status TEXT NOT NULL,
  notes TEXT
);

-- Create Inventory Table
CREATE TABLE IF NOT EXISTS inventory (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  min_stock NUMERIC NOT NULL,
  expiry_date TEXT,
  notes TEXT
);

-- Create Contacts Table
CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp TEXT,
  email TEXT,
  address TEXT,
  notes TEXT
);

-- Create Reminders Table
CREATE TABLE IF NOT EXISTS reminders (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  due_date TEXT NOT NULL,
  animal_id TEXT REFERENCES animals(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT FALSE,
  notes TEXT
);

-- Create Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  actor TEXT NOT NULL,
  target_id TEXT
);