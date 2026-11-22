import { resourceRepository } from '../repositories/resourceRepository.js';
import { userRepository } from '../repositories/userRepository.js';
import { bookingService } from '../services/bookingService.js';
import { hashPassword } from '../utils/password.js';

export async function seedDatabase() {
  console.log('[Resourcify Seed]: Populating Thapar Institute (TIET) users and campus facilities...');

  // 1. Seed Real Thapar Accounts with secure PBKDF2 hashed passwords
  // Default password for all seed accounts: Thapar@2026
  const defaultPasswordHash = hashPassword('Thapar@2026');

  const users = [
    {
      id: 'tiet-std-01',
      email: 'asharma_be22@thapar.edu',
      passwordHash: defaultPasswordHash,
      name: 'Aarav Sharma',
      role: 'STUDENT',
      department: 'Computer Science & Engineering (CSED)',
      rollNumber: '102203456',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tiet-std-legacy',
      email: 'student@thapar.edu',
      passwordHash: defaultPasswordHash,
      name: 'Aarav Sharma',
      role: 'STUDENT',
      department: 'Computer Science & Engineering (CSED)',
      rollNumber: '102103456',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tiet-std-02',
      email: 'rkapoor_be21@thapar.edu',
      passwordHash: defaultPasswordHash,
      name: 'Riya Kapoor',
      role: 'STUDENT',
      department: 'Electronics & Communication Engineering (ECED)',
      rollNumber: '102116089',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tiet-fac-01',
      email: 'rbawa@thapar.edu',
      passwordHash: defaultPasswordHash,
      name: 'Dr. Rajesh K. Bawa',
      role: 'FACULTY',
      department: 'Computer Science & Engineering (CSED)',
      rollNumber: 'TIET-FAC-1042',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tiet-fac-legacy',
      email: 'faculty@thapar.edu',
      passwordHash: defaultPasswordHash,
      name: 'Dr. Rajesh K. Bawa',
      role: 'FACULTY',
      department: 'Computer Science & Engineering (CSED)',
      rollNumber: 'FAC-CSED-402',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tiet-adm-01',
      email: 'estate.admin@thapar.edu',
      passwordHash: defaultPasswordHash,
      name: 'Er. Vikramaditya Singh (Chief Estate Officer)',
      role: 'ADMIN',
      department: 'Central Estate & Facilities Directorate',
      rollNumber: 'TIET-EST-001',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tiet-adm-legacy',
      email: 'admin@thapar.edu',
      passwordHash: defaultPasswordHash,
      name: 'TIET Central Facilities & Estate Office',
      role: 'ADMIN',
      department: 'Administration & Infrastructure Directorate',
      rollNumber: 'ADM-EST-01',
      createdAt: new Date().toISOString(),
    },
  ];

  for (const u of users) {
    await userRepository.save(u);
  }

  // 2. Seed Realistic Thapar Campus Venues
  const resources = [
    {
      id: 'res-tiet-lab-01',
      name: 'TIET NVIDIA Supercomputing & Deep Learning Lab',
      category: 'COMPUTER_LAB',
      building: 'Computer Operating System (COS) Complex',
      floor: 2,
      roomNumber: 'COS-C201',
      capacity: 40,
      equipment: ['NVIDIA RTX A6000 GPUs (40)', 'Dual 4K Projectors', 'Gigabit Fiber LAN', 'Central AC'],
      status: 'ACTIVE',
      operatingHours: { start: '08:00', end: '22:00' },
      minBookingDuration: 30,
      maxBookingDuration: 240,
      description: 'Advanced machine learning laboratory at CSED Thapar Institute, tailored for deep neural network research, computer vision practicals, and capstone AI projects.',
      imageUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=800&q=80',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'res-tiet-lab-02',
      name: 'COS General Systems Programming Lab 3',
      category: 'COMPUTER_LAB',
      building: 'Computer Operating System (COS) Complex',
      floor: 1,
      roomNumber: 'COS-104',
      capacity: 60,
      equipment: ['Intel Core i7 Workstations (60)', 'Overhead HD Projector', 'Laser Printers', 'Whiteboard'],
      status: 'ACTIVE',
      operatingHours: { start: '08:00', end: '21:00' },
      minBookingDuration: 30,
      maxBookingDuration: 180,
      description: 'Spacious undergraduate computer science laboratory with dual-boot Linux/Windows environment for Data Structures, OS, and DBMS lab sessions.',
      imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'res-tiet-audi-01',
      name: 'Thapar Main Campus Auditorium',
      category: 'SEMINAR_ROOM',
      building: 'Central Auditorium Block',
      floor: 1,
      roomNumber: 'Main Audi',
      capacity: 650,
      equipment: ['Bose Line-Array Sound System', 'Stage Lighting Truss', 'Motorized 4K Projection', 'Acoustic Wall Panels'],
      status: 'ACTIVE',
      operatingHours: { start: '08:30', end: '22:00' },
      minBookingDuration: 60,
      maxBookingDuration: 360,
      description: 'The premier cultural and academic auditorium of Thapar Institute, hosting annual convocations, national symposiums, hackathons, and guest lectures.',
      imageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'res-tiet-seminar-01',
      name: 'LP-108 Smart Interactive Lecture Theatre',
      category: 'SEMINAR_ROOM',
      building: 'Lecture Pedagogy (LP) Building',
      floor: 1,
      roomNumber: 'LP-108',
      capacity: 90,
      equipment: ['Interactive Smart Board', 'Lapel Wireless Microphones', 'Video Conferencing Cameras', 'Tiered Seating'],
      status: 'ACTIVE',
      operatingHours: { start: '08:00', end: '20:30' },
      minBookingDuration: 30,
      maxBookingDuration: 240,
      description: 'Modern stepped lecture theatre located in the iconic Thapar LP block, designed for collaborative workshops, research colloquiums, and committee meets.',
      imageUrl: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=800&q=80',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'res-tiet-study-01',
      name: 'Nava Nalanda Central Library - Discussion Pod Alpha',
      category: 'STUDY_ROOM',
      building: 'Nava Nalanda Central Library (NNCL)',
      floor: 2,
      roomNumber: 'NNCL Pod 2A',
      capacity: 6,
      equipment: ['Acoustic Soundproofing', 'Wall Mounted 4K Display (HDMI/AirPlay)', 'Power Strips with USB-C', 'Dry-Erase Board'],
      status: 'ACTIVE',
      operatingHours: { start: '08:00', end: '23:30' },
      minBookingDuration: 30,
      maxBookingDuration: 180,
      description: 'Sound-isolated group collaboration pod on the 2nd floor of Thapar Central Library, ideal for research team reviews and quiet study groups.',
      imageUrl: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=800&q=80',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'res-tiet-study-02',
      name: 'Nava Nalanda Central Library - Collaborative Suite 3B',
      category: 'STUDY_ROOM',
      building: 'Nava Nalanda Central Library (NNCL)',
      floor: 3,
      roomNumber: 'NNCL Room 304',
      capacity: 12,
      equipment: ['Smart Presentation Display', 'Magnetic Glass Whiteboard', 'Conference Speakerphone', 'Ergonomic Seating'],
      status: 'ACTIVE',
      operatingHours: { start: '08:00', end: '23:30' },
      minBookingDuration: 30,
      maxBookingDuration: 180,
      description: 'Spacious discussion room in NNCL for departmental student chapters, ACM/IEEE core team meetings, and hackathon project sprints.',
      imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'res-tiet-sports-01',
      name: 'Thapar Sports Complex - Indoor Badminton Court 1',
      category: 'SPORTS_COURT',
      building: 'Campus Sports & Recreation Complex (Near Hostel J)',
      floor: 1,
      roomNumber: 'Court B1',
      capacity: 6,
      equipment: ['Synthetic BWF Standard Matting', 'Anti-Glare High-Lumen Lights', 'Net Posts', 'Shuttle Caddy'],
      status: 'ACTIVE',
      operatingHours: { start: '06:00', end: '22:00' },
      minBookingDuration: 30,
      maxBookingDuration: 90,
      description: 'Indoor badminton facility at Thapar Sports Complex maintained under climate control for intramural and recreation matches.',
      imageUrl: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'res-tiet-sports-02',
      name: 'Thapar Sports Complex - North Basketball Arena',
      category: 'SPORTS_COURT',
      building: 'Campus Sports & Recreation Complex',
      floor: 1,
      roomNumber: 'Arena 1',
      capacity: 25,
      equipment: ['Regulation Wooden Court', 'Electronic Scoreboard', 'Bleachers', 'Floodlights'],
      status: 'ACTIVE',
      operatingHours: { start: '06:30', end: '22:00' },
      minBookingDuration: 60,
      maxBookingDuration: 120,
      description: 'Full regulation indoor basketball facility hosting inter-hostel URJA tournaments, team practice, and evening student scrimmages.',
      imageUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'res-tiet-conf-01',
      name: 'STEP Venture Lab Executive Conference Boardroom',
      category: 'CONFERENCE_HALL',
      building: 'Science and Technology Entrepreneurs Park (STEP)',
      floor: 1,
      roomNumber: 'STEP Boardroom',
      capacity: 24,
      equipment: ['Polycom 4K Video Telepresence', 'Ceiling Microphone Array', 'Motorized Projection Screen', 'Executive Coffee Lounge'],
      status: 'ACTIVE',
      operatingHours: { start: '09:00', end: '19:00' },
      minBookingDuration: 60,
      maxBookingDuration: 240,
      description: 'Executive conference boardroom at Thapar STEP incubator for startup pitch reviews, faculty entrepreneurship meets, and investor demos.',
      imageUrl: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=800&q=80',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  for (const r of resources) {
    await resourceRepository.save(r);
  }

  // 3. Seed Initial Sample Bookings
  const todayStr = new Date().toISOString().split('T')[0];

  try {
    // Booking 1: NVIDIA GPU Lab booked 10:00 - 11:30 by Dr. Rajesh Bawa
    await bookingService.createBooking(
      {
        resourceId: 'res-tiet-lab-01',
        date: todayStr,
        startTime: '10:00',
        endTime: '11:30',
        purpose: 'Deep Learning & Natural Language Processing Lab Practical',
        attendeesCount: 36,
      },
      users[2]
    );

    // Booking 2: Nava Nalanda Pod Alpha booked 14:00 - 15:30 by Aarav Sharma
    await bookingService.createBooking(
      {
        resourceId: 'res-tiet-study-01',
        date: todayStr,
        startTime: '14:00',
        endTime: '15:30',
        purpose: 'Capstone Project Sprint: Distributed Resource Booking on AWS',
        attendeesCount: 5,
      },
      users[0]
    );

    // Booking 3: Badminton Court booked 17:00 - 18:30 by Riya Kapoor
    await bookingService.createBooking(
      {
        resourceId: 'res-tiet-sports-01',
        date: todayStr,
        startTime: '17:00',
        endTime: '18:30',
        purpose: 'Inter-Hostel Badminton League Practice',
        attendeesCount: 4,
      },
      users[1]
    );
  } catch (err) {
    console.log('[Resourcify Seed Note]:', err.message);
  }

  console.log('[Resourcify Seed]: Seeding completed! Thapar campus venues & default accounts ready.');
}

if (process.argv[1]?.endsWith('seed.js')) {
  seedDatabase().then(() => process.exit(0));
}
