/**
 * Demo catalog for the frontend-only demo mode (VITE_DEMO_MODE=true).
 * Copied from backend/src/db/seed-data.ts so the demo shows the same doctors, clinics and photos.
 */
import type { Weekday } from '../api/contract';

export interface SeedSpecialty { name: string; slug: string; iconName: string; description: string; popular: boolean }
export interface SeedClinic { name: string; address: string; city: string; timezone: string; phone: string; email: string; openHours: string; rating: number; reviewCount: number; imageUrl: string; services: string[]; establishedYear: number }
export interface SeedDoctor { name: string; email: string; phone: string; specialtySlug: string; clinicName: string; qualifications: string[]; experienceYears: number; rating: number; reviewCount: number; consultationFee: number; languages: string[]; about: string; services: string[]; availableDays: Weekday[]; timeSlots: string[]; profileImageUrl: string }

export const SEED_SPECIALTIES: SeedSpecialty[] = [
  {
    "name": "Cardiology",
    "slug": "cardiology",
    "iconName": "HeartPulse",
    "description": "Expert care for your heart, cardiovascular diseases, hypertension, and arrhythmias.",
    "popular": true
  },
  {
    "name": "Dermatology",
    "slug": "dermatology",
    "iconName": "Sparkles",
    "description": "Specialized diagnosis and clinical treatments for skin, hair, and nail health.",
    "popular": true
  },
  {
    "name": "Pediatrics",
    "slug": "pediatrics",
    "iconName": "Baby",
    "description": "Compassionate pediatric healthcare from infancy through adolescence.",
    "popular": true
  },
  {
    "name": "Orthopedics",
    "slug": "orthopedics",
    "iconName": "Bone",
    "description": "Advanced solutions for joint pain, sports injuries, spine disorders, and bone health.",
    "popular": true
  },
  {
    "name": "General Medicine",
    "slug": "general-medicine",
    "iconName": "Stethoscope",
    "description": "Comprehensive primary care, preventive screenings, and chronic illness management.",
    "popular": true
  },
  {
    "name": "Neurology",
    "slug": "neurology",
    "iconName": "Brain",
    "description": "Leading specialists in migraines, stroke prevention, epilepsy, and neurological disorders.",
    "popular": true
  },
  {
    "name": "Gynecology & Obstetrics",
    "slug": "gynecology",
    "iconName": "Activity",
    "description": "Dedicated women’s health, prenatal guidance, fertility consultation, and wellness.",
    "popular": false
  },
  {
    "name": "Ophthalmology",
    "slug": "ophthalmology",
    "iconName": "Eye",
    "description": "Precision vision care, cataract management, retina screenings, and eye surgery.",
    "popular": false
  },
  {
    "name": "Dental Care",
    "slug": "dental-care",
    "iconName": "Smile",
    "description": "Cosmetic dentistry, orthodontics, oral hygiene, and restorative treatments.",
    "popular": false
  },
  {
    "name": "Psychiatry",
    "slug": "psychiatry",
    "iconName": "UserCheck",
    "description": "Evidence-based mental healthcare, behavioral therapy, and stress management.",
    "popular": false
  }
];

export const SEED_CLINICS: SeedClinic[] = [
  {
    "name": "Hridaya Heart & Vascular Centre",
    "address": "12 Linking Road, Bandra West, Mumbai 400050",
    "city": "Mumbai",
    "timezone": "Asia/Kolkata",
    "phone": "+91 90000 10001",
    "email": "care@hridayaheart.in",
    "openHours": "Mon - Sat: 8:00 AM - 8:00 PM",
    "rating": 4.9,
    "reviewCount": 342,
    "imageUrl": "https://images.unsplash.com/photo-1778151270902-cb0ca572f2ee?auto=format&fit=crop&q=80&w=800",
    "services": [
      "2D Echo & Doppler",
      "TMT (Stress Test)",
      "Holter Monitoring",
      "Diagnostic Lab"
    ],
    "establishedYear": 2011
  },
  {
    "name": "Twacha Skin & Laser Clinic",
    "address": "80 Feet Road, Indiranagar, Bengaluru 560038",
    "city": "Bengaluru",
    "timezone": "Asia/Kolkata",
    "phone": "+91 90000 10002",
    "email": "hello@twachaskin.in",
    "openHours": "Mon - Sat: 10:00 AM - 7:00 PM",
    "rating": 4.8,
    "reviewCount": 278,
    "imageUrl": "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=800",
    "services": [
      "Laser Hair Reduction",
      "Acne & Scar Treatment",
      "Chemical Peels",
      "Hair Loss Clinic"
    ],
    "establishedYear": 2016
  },
  {
    "name": "Nanhe Kadam Children’s Hospital",
    "address": "Survey No. 45, Baner Road, Pune 411045",
    "city": "Pune",
    "timezone": "Asia/Kolkata",
    "phone": "+91 90000 10003",
    "email": "care@nanhekadam.in",
    "openHours": "Mon - Sun: 8:00 AM - 9:00 PM",
    "rating": 4.9,
    "reviewCount": 410,
    "imageUrl": "https://images.unsplash.com/photo-1710074213374-e68503a1b795?auto=format&fit=crop&q=80&w=800",
    "services": [
      "Vaccinations",
      "Newborn Care",
      "Growth & Development Checks",
      "Paediatric Emergency"
    ],
    "establishedYear": 2013
  },
  {
    "name": "Asthi Orthopaedic & Spine Institute",
    "address": "Road No. 12, Banjara Hills, Hyderabad 500034",
    "city": "Hyderabad",
    "timezone": "Asia/Kolkata",
    "phone": "+91 90000 10004",
    "email": "info@asthiortho.in",
    "openHours": "Mon - Sat: 9:00 AM - 7:00 PM",
    "rating": 4.8,
    "reviewCount": 215,
    "imageUrl": "https://images.unsplash.com/photo-1778151270757-f3793f65e2de?auto=format&fit=crop&q=80&w=800",
    "services": [
      "Knee & Hip Replacement",
      "Physiotherapy",
      "Digital X-Ray",
      "Sports Injury Clinic"
    ],
    "establishedYear": 2009
  },
  {
    "name": "Swasthya Family Health Centre",
    "address": "B-14, Greater Kailash II, New Delhi 110048",
    "city": "New Delhi",
    "timezone": "Asia/Kolkata",
    "phone": "+91 90000 10005",
    "email": "contact@swasthyafamily.in",
    "openHours": "Mon - Sun: 7:30 AM - 9:00 PM",
    "rating": 4.7,
    "reviewCount": 520,
    "imageUrl": "https://images.unsplash.com/photo-1512678080530-7760d81faba6?auto=format&fit=crop&q=80&w=800",
    "services": [
      "Full Body Health Check-ups",
      "Diabetes Care",
      "Blood Tests",
      "Teleconsultation"
    ],
    "establishedYear": 2014
  },
  {
    "name": "Manas Neuro & Brain Care",
    "address": "45 Cathedral Road, Gopalapuram, Chennai 600086",
    "city": "Chennai",
    "timezone": "Asia/Kolkata",
    "phone": "+91 90000 10006",
    "email": "care@manasneuro.in",
    "openHours": "Mon - Sat: 9:00 AM - 6:00 PM",
    "rating": 4.9,
    "reviewCount": 198,
    "imageUrl": "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800",
    "services": [
      "EEG & EMG",
      "Headache & Migraine Clinic",
      "Stroke Care",
      "Sleep Studies"
    ],
    "establishedYear": 2012
  },
  {
    "name": "Janani Women’s Health Clinic",
    "address": "22 Park Street, Kolkata 700016",
    "city": "Kolkata",
    "timezone": "Asia/Kolkata",
    "phone": "+91 90000 10007",
    "email": "care@jananiwomens.in",
    "openHours": "Mon - Sat: 9:00 AM - 7:00 PM",
    "rating": 4.9,
    "reviewCount": 312,
    "imageUrl": "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&q=80&w=800",
    "services": [
      "Antenatal Care",
      "Pregnancy Ultrasound",
      "PCOS Clinic",
      "Family Planning"
    ],
    "establishedYear": 2015
  },
  {
    "name": "Nayan Eye & Smile Dental Centre",
    "address": "C. G. Road, Navrangpura, Ahmedabad 380009",
    "city": "Ahmedabad",
    "timezone": "Asia/Kolkata",
    "phone": "+91 90000 10008",
    "email": "hello@nayansmile.in",
    "openHours": "Mon - Sat: 9:30 AM - 7:30 PM",
    "rating": 4.8,
    "reviewCount": 260,
    "imageUrl": "https://images.unsplash.com/photo-1733817336090-04082ff6ab4f?auto=format&fit=crop&q=80&w=800",
    "services": [
      "Cataract Evaluation",
      "Retina Check-up",
      "Root Canal Treatment",
      "Braces & Aligners"
    ],
    "establishedYear": 2017
  }
];

export const SEED_DOCTORS: SeedDoctor[] = [
  {
    "name": "Dr. Arjun Mehta",
    "email": "arjun.mehta@hridayaheart.in",
    "phone": "+91 90000 20001",
    "specialtySlug": "cardiology",
    "clinicName": "Hridaya Heart & Vascular Centre",
    "qualifications": [
      "MBBS - Grant Medical College, Mumbai",
      "MD (Medicine), DM (Cardiology) - KEM Hospital, Mumbai"
    ],
    "experienceYears": 16,
    "rating": 4.9,
    "reviewCount": 148,
    "consultationFee": 1000,
    "languages": [
      "English",
      "Hindi",
      "Marathi"
    ],
    "about": "Dr. Arjun Mehta is an interventional cardiologist focused on preventive cardiology, high blood pressure, coronary artery disease and heart failure.",
    "services": [
      "Cardiac Consultation",
      "ECG Review",
      "2D Echo",
      "Hypertension Management"
    ],
    "availableDays": [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday"
    ],
    "timeSlots": [
      "09:00 AM",
      "09:30 AM",
      "10:00 AM",
      "10:30 AM",
      "11:30 AM",
      "02:00 PM",
      "02:30 PM",
      "03:30 PM",
      "04:00 PM"
    ],
    "profileImageUrl": "https://images.unsplash.com/photo-1712215544003-af10130f8eb3?auto=format&fit=crop&q=80&w=600"
  },
  {
    "name": "Dr. Kavita Iyer",
    "email": "kavita.iyer@hridayaheart.in",
    "phone": "+91 90000 20002",
    "specialtySlug": "cardiology",
    "clinicName": "Hridaya Heart & Vascular Centre",
    "qualifications": [
      "MBBS - Madras Medical College",
      "MD (Medicine), DM (Cardiology) - AIIMS, New Delhi"
    ],
    "experienceYears": 12,
    "rating": 4.8,
    "reviewCount": 112,
    "consultationFee": 900,
    "languages": [
      "English",
      "Hindi",
      "Tamil"
    ],
    "about": "Dr. Kavita Iyer treats heart rhythm disorders and women’s heart health, with a focus on prevention and long-term follow-up.",
    "services": [
      "Arrhythmia Clinic",
      "Lipid Management",
      "Cardiac Risk Assessment",
      "Post-Angioplasty Care"
    ],
    "availableDays": [
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Saturday"
    ],
    "timeSlots": [
      "10:00 AM",
      "10:30 AM",
      "11:00 AM",
      "01:30 PM",
      "02:00 PM",
      "03:00 PM",
      "04:00 PM"
    ],
    "profileImageUrl": "https://images.unsplash.com/photo-1757125736482-328a3cdd9743?auto=format&fit=crop&q=80&w=600"
  },
  {
    "name": "Dr. Sneha Reddy",
    "email": "sneha.reddy@twachaskin.in",
    "phone": "+91 90000 20003",
    "specialtySlug": "dermatology",
    "clinicName": "Twacha Skin & Laser Clinic",
    "qualifications": [
      "MBBS - Osmania Medical College, Hyderabad",
      "MD (Dermatology, Venereology & Leprosy)"
    ],
    "experienceYears": 14,
    "rating": 4.9,
    "reviewCount": 220,
    "consultationFee": 800,
    "languages": [
      "English",
      "Telugu",
      "Kannada"
    ],
    "about": "Dr. Sneha Reddy has wide experience in medical and cosmetic dermatology, including acne scars, pigmentation, eczema and hair loss.",
    "services": [
      "Acne & Scar Treatment",
      "Pigmentation Care",
      "Hair Loss Treatment",
      "Skin Allergy Testing"
    ],
    "availableDays": [
      "Monday",
      "Wednesday",
      "Thursday",
      "Friday"
    ],
    "timeSlots": [
      "09:30 AM",
      "10:00 AM",
      "11:00 AM",
      "11:30 AM",
      "02:00 PM",
      "03:00 PM",
      "04:30 PM"
    ],
    "profileImageUrl": "https://images.unsplash.com/photo-1683348758606-860c720fda9a?auto=format&fit=crop&q=80&w=600"
  },
  {
    "name": "Dr. Rohan Kapoor",
    "email": "rohan.kapoor@twachaskin.in",
    "phone": "+91 90000 20004",
    "specialtySlug": "dermatology",
    "clinicName": "Twacha Skin & Laser Clinic",
    "qualifications": [
      "MBBS - Maulana Azad Medical College, New Delhi",
      "DNB (Dermatology)"
    ],
    "experienceYears": 9,
    "rating": 4.7,
    "reviewCount": 89,
    "consultationFee": 700,
    "languages": [
      "English",
      "Hindi",
      "Punjabi"
    ],
    "about": "Dr. Rohan Kapoor specialises in procedural dermatology, laser treatments and chronic skin conditions such as psoriasis.",
    "services": [
      "Laser Treatments",
      "Psoriasis Care",
      "Mole & Wart Removal",
      "Chemical Peels"
    ],
    "availableDays": [
      "Monday",
      "Tuesday",
      "Thursday",
      "Friday"
    ],
    "timeSlots": [
      "09:00 AM",
      "10:00 AM",
      "10:30 AM",
      "01:00 PM",
      "02:30 PM",
      "03:30 PM"
    ],
    "profileImageUrl": "https://images.unsplash.com/photo-1612531386530-97286d97c2d2?auto=format&fit=crop&q=80&w=600"
  },
  {
    "name": "Dr. Priya Kulkarni",
    "email": "priya.kulkarni@nanhekadam.in",
    "phone": "+91 90000 20005",
    "specialtySlug": "pediatrics",
    "clinicName": "Nanhe Kadam Children’s Hospital",
    "qualifications": [
      "MBBS - B. J. Medical College, Pune",
      "MD (Paediatrics)",
      "Fellowship in Neonatology"
    ],
    "experienceYears": 15,
    "rating": 5,
    "reviewCount": 310,
    "consultationFee": 600,
    "languages": [
      "English",
      "Marathi",
      "Hindi"
    ],
    "about": "Dr. Priya Kulkarni cares for newborns, infants and children, with a special interest in vaccinations, nutrition and growth.",
    "services": [
      "Well-Baby Check-ups",
      "Vaccinations",
      "Newborn Care",
      "Child Nutrition"
    ],
    "availableDays": [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Friday",
      "Saturday"
    ],
    "timeSlots": [
      "08:30 AM",
      "09:00 AM",
      "10:00 AM",
      "11:00 AM",
      "01:30 PM",
      "02:30 PM",
      "03:30 PM"
    ],
    "profileImageUrl": "https://images.unsplash.com/photo-1758691462651-611d730c5272?auto=format&fit=crop&q=80&w=600"
  },
  {
    "name": "Dr. Aditya Joshi",
    "email": "aditya.joshi@nanhekadam.in",
    "phone": "+91 90000 20006",
    "specialtySlug": "pediatrics",
    "clinicName": "Nanhe Kadam Children’s Hospital",
    "qualifications": [
      "MBBS - Armed Forces Medical College, Pune",
      "DCH, DNB (Paediatrics)"
    ],
    "experienceYears": 10,
    "rating": 4.8,
    "reviewCount": 135,
    "consultationFee": 650,
    "languages": [
      "English",
      "Hindi",
      "Marathi"
    ],
    "about": "Dr. Aditya Joshi treats childhood fevers, asthma and allergies, and handles paediatric emergencies.",
    "services": [
      "Childhood Asthma Care",
      "Fever & Infection Care",
      "Allergy Management",
      "Paediatric Emergency"
    ],
    "availableDays": [
      "Monday",
      "Wednesday",
      "Thursday",
      "Saturday"
    ],
    "timeSlots": [
      "09:30 AM",
      "10:30 AM",
      "11:30 AM",
      "02:00 PM",
      "03:00 PM",
      "04:00 PM"
    ],
    "profileImageUrl": "https://images.unsplash.com/photo-1659353885824-1199aeeebfc6?auto=format&fit=crop&q=80&w=600"
  },
  {
    "name": "Dr. Vikram Rao",
    "email": "vikram.rao@asthiortho.in",
    "phone": "+91 90000 20007",
    "specialtySlug": "orthopedics",
    "clinicName": "Asthi Orthopaedic & Spine Institute",
    "qualifications": [
      "MBBS - Gandhi Medical College, Hyderabad",
      "MS (Orthopaedics)",
      "Fellowship in Joint Replacement"
    ],
    "experienceYears": 26,
    "rating": 4.9,
    "reviewCount": 195,
    "consultationFee": 1000,
    "languages": [
      "English",
      "Telugu",
      "Hindi"
    ],
    "about": "Dr. Vikram Rao is a senior orthopaedic surgeon known for knee and hip replacement and the care of arthritis.",
    "services": [
      "Knee Replacement",
      "Hip Replacement",
      "Arthritis Care",
      "Fracture Management"
    ],
    "availableDays": [
      "Monday",
      "Tuesday",
      "Thursday"
    ],
    "timeSlots": [
      "09:00 AM",
      "10:00 AM",
      "11:00 AM",
      "02:00 PM",
      "03:00 PM",
      "04:00 PM"
    ],
    "profileImageUrl": "https://images.unsplash.com/photo-1678940805950-73f2127f9d4e?auto=format&fit=crop&q=80&w=600"
  },
  {
    "name": "Dr. Meera Nair",
    "email": "meera.nair@asthiortho.in",
    "phone": "+91 90000 20008",
    "specialtySlug": "orthopedics",
    "clinicName": "Asthi Orthopaedic & Spine Institute",
    "qualifications": [
      "MBBS - Government Medical College, Thiruvananthapuram",
      "MS (Orthopaedics)",
      "Fellowship in Spine Surgery"
    ],
    "experienceYears": 11,
    "rating": 4.8,
    "reviewCount": 142,
    "consultationFee": 900,
    "languages": [
      "English",
      "Malayalam",
      "Telugu"
    ],
    "about": "Dr. Meera Nair treats back and neck pain, slipped discs and sports injuries, with physiotherapy-first care plans.",
    "services": [
      "Back & Neck Pain",
      "Sports Injuries",
      "Spine Care",
      "Physiotherapy Plans"
    ],
    "availableDays": [
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday"
    ],
    "timeSlots": [
      "08:30 AM",
      "09:30 AM",
      "10:30 AM",
      "01:30 PM",
      "02:30 PM",
      "03:30 PM"
    ],
    "profileImageUrl": "https://images.unsplash.com/photo-1741707039536-113e200f9e0d?auto=format&fit=crop&q=80&w=600"
  },
  {
    "name": "Dr. Rajesh Sharma",
    "email": "rajesh.sharma@swasthyafamily.in",
    "phone": "+91 90000 20009",
    "specialtySlug": "general-medicine",
    "clinicName": "Swasthya Family Health Centre",
    "qualifications": [
      "MBBS - Lady Hardinge Medical College, New Delhi",
      "MD (General Medicine)"
    ],
    "experienceYears": 20,
    "rating": 4.9,
    "reviewCount": 380,
    "consultationFee": 500,
    "languages": [
      "English",
      "Hindi",
      "Punjabi"
    ],
    "about": "Dr. Rajesh Sharma is an experienced physician managing diabetes, thyroid problems, infections and preventive health check-ups.",
    "services": [
      "Diabetes Care",
      "Thyroid Management",
      "Fever & Infections",
      "Preventive Health Check-ups"
    ],
    "availableDays": [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday"
    ],
    "timeSlots": [
      "08:00 AM",
      "09:00 AM",
      "10:00 AM",
      "11:00 AM",
      "01:00 PM",
      "02:00 PM",
      "03:00 PM",
      "04:00 PM"
    ],
    "profileImageUrl": "https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&q=80&w=600"
  },
  {
    "name": "Dr. Ananya Gupta",
    "email": "ananya.gupta@swasthyafamily.in",
    "phone": "+91 90000 20010",
    "specialtySlug": "general-medicine",
    "clinicName": "Swasthya Family Health Centre",
    "qualifications": [
      "MBBS - University College of Medical Sciences, Delhi",
      "DNB (Family Medicine)"
    ],
    "experienceYears": 13,
    "rating": 4.8,
    "reviewCount": 165,
    "consultationFee": 500,
    "languages": [
      "English",
      "Hindi",
      "Bengali"
    ],
    "about": "Dr. Ananya Gupta is a family physician caring for all ages, from routine illnesses to long-term conditions and lifestyle advice.",
    "services": [
      "Family Medicine",
      "Blood Pressure Care",
      "Women’s Health Check-ups",
      "Lifestyle Counselling"
    ],
    "availableDays": [
      "Monday",
      "Wednesday",
      "Thursday",
      "Saturday"
    ],
    "timeSlots": [
      "09:00 AM",
      "10:00 AM",
      "11:30 AM",
      "01:30 PM",
      "02:30 PM",
      "03:30 PM"
    ],
    "profileImageUrl": "https://images.unsplash.com/photo-1623854767648-e7bb8009f0db?auto=format&fit=crop&q=80&w=600"
  },
  {
    "name": "Dr. Karthik Subramanian",
    "email": "karthik.subramanian@manasneuro.in",
    "phone": "+91 90000 20011",
    "specialtySlug": "neurology",
    "clinicName": "Manas Neuro & Brain Care",
    "qualifications": [
      "MBBS - Stanley Medical College, Chennai",
      "MD (Medicine), DM (Neurology) - NIMHANS, Bengaluru"
    ],
    "experienceYears": 17,
    "rating": 4.9,
    "reviewCount": 174,
    "consultationFee": 1000,
    "languages": [
      "English",
      "Tamil"
    ],
    "about": "Dr. Karthik Subramanian treats migraines, epilepsy, stroke and nerve disorders, and runs the headache clinic.",
    "services": [
      "Migraine Treatment",
      "Epilepsy Care",
      "Stroke Prevention",
      "Nerve Conduction Studies"
    ],
    "availableDays": [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Friday"
    ],
    "timeSlots": [
      "09:00 AM",
      "10:30 AM",
      "11:30 AM",
      "02:00 PM",
      "03:30 PM"
    ],
    "profileImageUrl": "https://images.unsplash.com/photo-1637059824899-a441006a6875?auto=format&fit=crop&q=80&w=600"
  },
  {
    "name": "Dr. Divya Menon",
    "email": "divya.menon@manasneuro.in",
    "phone": "+91 90000 20012",
    "specialtySlug": "neurology",
    "clinicName": "Manas Neuro & Brain Care",
    "qualifications": [
      "MBBS - Kasturba Medical College, Manipal",
      "DM (Neurology)"
    ],
    "experienceYears": 8,
    "rating": 4.7,
    "reviewCount": 92,
    "consultationFee": 950,
    "languages": [
      "English",
      "Malayalam",
      "Tamil"
    ],
    "about": "Dr. Divya Menon focuses on epilepsy, sleep disorders and memory problems in adults.",
    "services": [
      "Epilepsy Clinic",
      "Sleep Disorders",
      "Memory Assessment",
      "EEG Review"
    ],
    "availableDays": [
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Saturday"
    ],
    "timeSlots": [
      "09:30 AM",
      "11:00 AM",
      "01:30 PM",
      "02:30 PM",
      "04:00 PM"
    ],
    "profileImageUrl": "https://images.unsplash.com/photo-1659353888906-adb3e0041693?auto=format&fit=crop&q=80&w=600"
  },
  {
    "name": "Dr. Anjali Banerjee",
    "email": "anjali.banerjee@jananiwomens.in",
    "phone": "+91 90000 20013",
    "specialtySlug": "gynecology",
    "clinicName": "Janani Women’s Health Clinic",
    "qualifications": [
      "MBBS - Medical College, Kolkata",
      "MS (Obstetrics & Gynaecology)"
    ],
    "experienceYears": 16,
    "rating": 4.9,
    "reviewCount": 245,
    "consultationFee": 800,
    "languages": [
      "English",
      "Bengali",
      "Hindi"
    ],
    "about": "Dr. Anjali Banerjee provides pregnancy care, PCOS treatment and women’s wellness care through every stage of life.",
    "services": [
      "Antenatal Care",
      "PCOS Treatment",
      "Menstrual Health",
      "Menopause Care"
    ],
    "availableDays": [
      "Monday",
      "Wednesday",
      "Thursday",
      "Friday"
    ],
    "timeSlots": [
      "09:00 AM",
      "10:00 AM",
      "11:00 AM",
      "01:30 PM",
      "02:30 PM",
      "03:30 PM"
    ],
    "profileImageUrl": "https://images.unsplash.com/photo-1659353888818-0e41520d086a?auto=format&fit=crop&q=80&w=600"
  },
  {
    "name": "Dr. Sameer Bose",
    "email": "sameer.bose@jananiwomens.in",
    "phone": "+91 90000 20014",
    "specialtySlug": "gynecology",
    "clinicName": "Janani Women’s Health Clinic",
    "qualifications": [
      "MBBS - R. G. Kar Medical College, Kolkata",
      "DNB (Obstetrics & Gynaecology)"
    ],
    "experienceYears": 10,
    "rating": 4.8,
    "reviewCount": 118,
    "consultationFee": 750,
    "languages": [
      "English",
      "Bengali",
      "Hindi"
    ],
    "about": "Dr. Sameer Bose cares for high-risk pregnancies and offers fertility consultations and family planning advice.",
    "services": [
      "High-Risk Pregnancy",
      "Fertility Consultation",
      "Family Planning",
      "Pregnancy Scans"
    ],
    "availableDays": [
      "Tuesday",
      "Thursday",
      "Friday",
      "Saturday"
    ],
    "timeSlots": [
      "10:00 AM",
      "11:00 AM",
      "01:00 PM",
      "02:00 PM",
      "04:00 PM"
    ],
    "profileImageUrl": "https://images.unsplash.com/photo-1730597842283-943c7986ee2c?auto=format&fit=crop&q=80&w=600"
  },
  {
    "name": "Dr. Harish Patel",
    "email": "harish.patel@nayansmile.in",
    "phone": "+91 90000 20015",
    "specialtySlug": "ophthalmology",
    "clinicName": "Nayan Eye & Smile Dental Centre",
    "qualifications": [
      "MBBS - B. J. Medical College, Ahmedabad",
      "MS (Ophthalmology)"
    ],
    "experienceYears": 19,
    "rating": 4.9,
    "reviewCount": 188,
    "consultationFee": 700,
    "languages": [
      "English",
      "Gujarati",
      "Hindi"
    ],
    "about": "Dr. Harish Patel is an eye surgeon experienced in cataract care, glaucoma and diabetic eye check-ups.",
    "services": [
      "Cataract Evaluation",
      "Glaucoma Care",
      "Diabetic Eye Check-up",
      "Vision Testing"
    ],
    "availableDays": [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday"
    ],
    "timeSlots": [
      "08:30 AM",
      "09:30 AM",
      "10:30 AM",
      "01:30 PM",
      "02:30 PM",
      "03:30 PM"
    ],
    "profileImageUrl": "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=600"
  },
  {
    "name": "Dr. Nisha Shah",
    "email": "nisha.shah@nayansmile.in",
    "phone": "+91 90000 20016",
    "specialtySlug": "dental-care",
    "clinicName": "Nayan Eye & Smile Dental Centre",
    "qualifications": [
      "BDS - Government Dental College, Ahmedabad",
      "MDS (Conservative Dentistry & Endodontics)"
    ],
    "experienceYears": 11,
    "rating": 4.9,
    "reviewCount": 230,
    "consultationFee": 500,
    "languages": [
      "English",
      "Gujarati",
      "Hindi"
    ],
    "about": "Dr. Nisha Shah provides painless root canal treatment, fillings, braces and cosmetic dental care.",
    "services": [
      "Root Canal Treatment",
      "Dental Fillings",
      "Braces & Aligners",
      "Teeth Cleaning"
    ],
    "availableDays": [
      "Monday",
      "Tuesday",
      "Thursday",
      "Friday"
    ],
    "timeSlots": [
      "09:00 AM",
      "10:00 AM",
      "11:00 AM",
      "02:00 PM",
      "03:00 PM",
      "04:00 PM"
    ],
    "profileImageUrl": "https://images.unsplash.com/photo-1565090567208-c8038cfcf6cd?auto=format&fit=crop&q=80&w=600"
  }
];
