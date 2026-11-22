import { resourceRepository } from '../repositories/resourceRepository.js';
import { userRepository } from '../repositories/userRepository.js';
import { bookingService } from '../services/bookingService.js';

export async function seedDatabase() {
  console.log('[Seed]: Populating campus users and realistic resources...');

  // 1. Seed Users
  const users = [
    {
      id: 'demo-student-01',
      email: 'alex.student@campusslot.edu',
      name: 'Alex Johnson',
      role: 'STUDENT',
      department: 'Computer Science & Engineering',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'demo-student-02',
      email: 'sarah.lee@campusslot.edu',
      name: 'Sarah Lee',
      role: 'STUDENT',
      department: 'Biomedical Informatics',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'demo-faculty-01',
      email: 'prof.roberts@campusslot.edu',
      name: 'Dr. Marcus Roberts',
      role: 'FACULTY',
      department: 'Electrical Engineering & AI',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'demo-admin-01',
      email: 'admin@campusslot.edu',
      name: 'Campus Operations Admin',
      role: 'ADMIN',
      department: 'Facilities & Campus Administration',
      createdAt: new Date().toISOString(),
    },
  ];

  for (const u of users) {
    await userRepository.save(u);
  }

  // 2. Seed Realistic Campus Resources
  const resources = [
    {
      id: 'res-lab-01',
      name: 'Turing Advanced AI & GPU Computing Lab',
      category: 'COMPUTER_LAB',
      building: 'Alan Turing Engineering Complex',
      floor: 3,
      roomNumber: '302',
      capacity: 35,
      equipment: ['NVIDIA RTX A6000 GPUs (35)', 'Dual 4K Projectors', 'Gigabit Ethernet', 'Whiteboard'],
      status: 'ACTIVE',
      operatingHours: { start: '08:00', end: '22:00' },
      minBookingDuration: 30,
      maxBookingDuration: 240,
      description: 'High-performance computing laboratory configured for machine learning model training, deep neural network research, and computer vision coursework.',
      imageUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=800&q=80',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'res-lab-02',
      name: 'Ada Lovelace General Computing Lab',
      category: 'COMPUTER_LAB',
      building: 'Alan Turing Engineering Complex',
      floor: 2,
      roomNumber: '215',
      capacity: 50,
      equipment: ['Workstations (50)', 'Laser Printer', 'Overhead Projector', 'Air Conditioning'],
      status: 'ACTIVE',
      operatingHours: { start: '08:00', end: '21:00' },
      minBookingDuration: 30,
      maxBookingDuration: 180,
      description: 'Spacious undergraduate computing facility equipped with standard dual-boot Linux/Windows developer machines for general coursework and lab tests.',
      imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'res-seminar-01',
      name: 'Newton Grand Lecture Auditorium',
      category: 'SEMINAR_ROOM',
      building: 'Science & Humanities Center',
      floor: 1,
      roomNumber: 'Auditorium A',
      capacity: 120,
      equipment: ['Wireless Lapel Mics', 'Tiered Amphitheater Seating', 'Surround Sound Audio', 'Triple Projection Displays'],
      status: 'ACTIVE',
      operatingHours: { start: '08:30', end: '21:30' },
      minBookingDuration: 60,
      maxBookingDuration: 300,
      description: 'Main campus auditorium for symposiums, distinguished guest lectures, inter-college seminars, and academic defenses.',
      imageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'res-seminar-02',
      name: 'Curie Interactive Seminar Hall',
      category: 'SEMINAR_ROOM',
      building: 'Science & Humanities Center',
      floor: 2,
      roomNumber: '204',
      capacity: 45,
      equipment: ['Interactive Smart Board', 'Video Conferencing Suite', 'Modular Rolling Desks', 'Sound System'],
      status: 'ACTIVE',
      operatingHours: { start: '08:00', end: '20:00' },
      minBookingDuration: 30,
      maxBookingDuration: 240,
      description: 'Flexible seminar space tailored for interactive workshops, colloquiums, and collaborative committee presentations.',
      imageUrl: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=800&q=80',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'res-study-01',
      name: 'Quantum Quiet Study Pod Alpha',
      category: 'STUDY_ROOM',
      building: 'University Central Library',
      floor: 3,
      roomNumber: 'Pod 3A',
      capacity: 4,
      equipment: ['Acoustic Soundproofing', 'Wall Mounted Display (HDMI)', 'Power Strips with USB-C', 'Dry-Erase Board'],
      status: 'ACTIVE',
      operatingHours: { start: '08:00', end: '23:00' },
      minBookingDuration: 30,
      maxBookingDuration: 180,
      description: 'Sound-isolated group study pod ideal for capstone project discussions, peer tutoring, and quiet problem-solving.',
      imageUrl: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=800&q=80',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'res-study-02',
      name: 'Galileo Collaborative Study Suite 2B',
      category: 'STUDY_ROOM',
      building: 'University Central Library',
      floor: 2,
      roomNumber: '208',
      capacity: 8,
      equipment: ['Smart TV with AirPlay/Miracast', 'Magnetic Glass Whiteboard', 'Conference Speakerphone', 'Ergonomic Seating'],
      status: 'ACTIVE',
      operatingHours: { start: '08:00', end: '23:00' },
      minBookingDuration: 30,
      maxBookingDuration: 180,
      description: 'Mid-sized group discussion room equipped with presentation casting and extensive glass writing surfaces.',
      imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'res-sports-01',
      name: 'North Arena Indoor Basketball Court',
      category: 'SPORTS_COURT',
      building: 'Campus Recreation & Wellness Complex',
      floor: 1,
      roomNumber: 'Court 1',
      capacity: 20,
      equipment: ['Regulation Hardwood Flooring', 'Electronic Scoreboard', 'Bleachers', 'Locker Room Access'],
      status: 'ACTIVE',
      operatingHours: { start: '07:00', end: '22:00' },
      minBookingDuration: 60,
      maxBookingDuration: 120,
      description: 'NCAA regulation indoor wooden basketball court suitable for intramural matches, team practices, and leisure scrimmage.',
      imageUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'res-sports-02',
      name: 'South Campus Indoor Badminton Hall',
      category: 'SPORTS_COURT',
      building: 'Campus Recreation & Wellness Complex',
      floor: 1,
      roomNumber: 'Court B2',
      capacity: 6,
      equipment: ['Synthetic Court Matting', 'High-Lumen Anti-Glare Lights', 'Net Posts', 'Shuttlecock Machine'],
      status: 'ACTIVE',
      operatingHours: { start: '07:00', end: '22:00' },
      minBookingDuration: 30,
      maxBookingDuration: 90,
      description: 'Dedicated professional synthetic badminton court maintained under strict climate control for competitive and recreation singles/doubles.',
      imageUrl: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'res-conf-01',
      name: 'Chancellor Executive Conference Boardroom',
      category: 'CONFERENCE_HALL',
      building: 'University Administration Hall',
      floor: 4,
      roomNumber: 'Boardroom 401',
      capacity: 24,
      equipment: ['Polycom 4K Video Telepresence', 'Ceiling Microphone Array', 'Motorized Window Blinds', 'Executive Beverage Station'],
      status: 'ACTIVE',
      operatingHours: { start: '08:30', end: '19:00' },
      minBookingDuration: 60,
      maxBookingDuration: 240,
      description: 'High-level executive board chamber reserved for faculty council meets, department heads, tenure reviews, and administrative delegates.',
      imageUrl: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=800&q=80',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  for (const r of resources) {
    await resourceRepository.save(r);
  }

  // 3. Seed Initial Realistic Bookings for demonstration
  const todayStr = new Date().toISOString().split('T')[0];

  try {
    // Booking 1: Turing Lab booked 10:00 - 11:30
    await bookingService.createBooking(
      {
        resourceId: 'res-lab-01',
        date: todayStr,
        startTime: '10:00',
        endTime: '11:30',
        purpose: 'Machine Learning Deep Vision Lab Practical',
        attendeesCount: 28,
      },
      users[2] // Dr. Marcus Roberts (Faculty)
    );

    // Booking 2: Study Pod Alpha booked 14:00 - 15:30
    await bookingService.createBooking(
      {
        resourceId: 'res-study-01',
        date: todayStr,
        startTime: '14:00',
        endTime: '15:30',
        purpose: 'Algorithms Capstone Sprint Planning',
        attendeesCount: 4,
      },
      users[0] // Alex Johnson (Student)
    );

    // Booking 3: Basketball Court booked 17:00 - 18:30
    await bookingService.createBooking(
      {
        resourceId: 'res-sports-01',
        date: todayStr,
        startTime: '17:00',
        endTime: '18:30',
        purpose: 'Engineering Faculty vs Graduate Basketball League',
        attendeesCount: 12,
      },
      users[1] // Sarah Lee (Student)
    );
  } catch (err) {
    console.log('[Seed]: Notice on initial sample bookings:', err.message);
  }

  console.log('[Seed]: Seeding finished successfully. Resources & sample bookings ready.');
}

if (process.argv[1]?.endsWith('seed.js')) {
  seedDatabase().then(() => process.exit(0));
}
