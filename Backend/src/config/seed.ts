import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { Category } from '../models/Category';
import { Gig } from '../models/Gig';
import { Rental } from '../models/Rental';
import { Transaction } from '../models/Transaction';
import { Message } from '../models/Message';
import { Notification } from '../models/Notification';
import { Rating } from '../models/Rating';

dotenv.config();

const seed = async () => {
  try {
    const connString = process.env.MONGODB_URI || 'mongodb://localhost:27017/campus_gigs_rentals';
    await mongoose.connect(connString);
    console.log('Seeding: Connected to MongoDB.');

    // Clear existing data
    await User.deleteMany({});
    await Category.deleteMany({});
    await Gig.deleteMany({});
    await Rental.deleteMany({});
    await Transaction.deleteMany({});
    await Message.deleteMany({});
    await Notification.deleteMany({});
    await Rating.deleteMany({});
    console.log('Cleared existing collections.');

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    // Create categories
    const categoriesData = [
      // Gigs
      { name: 'Tutoring', type: 'gig', icon: 'AcademicCapIcon' },
      { name: 'Moving & Lifting', type: 'gig', icon: 'TruckIcon' },
      { name: 'Coding & Web', type: 'gig', icon: 'CodeBracketIcon' },
      { name: 'Photography', type: 'gig', icon: 'CameraIcon' },
      { name: 'Delivery', type: 'gig', icon: 'MapPinIcon' },
      // Rentals
      { name: 'Textbooks', type: 'rental', icon: 'BookOpenIcon' },
      { name: 'Electronics', type: 'rental', icon: 'CpuChipIcon' },
      { name: 'Sports Gear', type: 'rental', icon: 'TrophyIcon' },
      { name: 'Bicycles & Scooters', type: 'rental', icon: 'KeyIcon' },
      { name: 'Calculators', type: 'rental', icon: 'CalculatorIcon' }
    ];
    const categories = await Category.insertMany(categoriesData);
    console.log(`Seeded ${categories.length} categories.`);

    // Create users
    const usersData = [
      {
        name: 'Alice Johnson',
        email: 'alice@college.edu',
        primaryEmail: 'alice@college.edu',
        collegeEmail: 'alice@vitstudent.ac.in',
        isVerified: true,
        passwordHash,
        role: 'student',
        college: 'State University',
        ratingAvg: 4.8,
        ratingCount: 5
      },
      {
        name: 'Bob Smith',
        email: 'bob@college.edu',
        primaryEmail: 'bob@college.edu',
        collegeEmail: 'bob@vitstudent.ac.in',
        isVerified: true,
        passwordHash,
        role: 'student',
        college: 'State University',
        ratingAvg: 4.5,
        ratingCount: 3
      },
      {
        name: 'Charlie Brown',
        email: 'charlie@college.edu',
        primaryEmail: 'charlie@college.edu',
        collegeEmail: 'charlie@vitstudent.ac.in',
        isVerified: true,
        passwordHash,
        role: 'student',
        college: 'State University',
        ratingAvg: 0,
        ratingCount: 0
      },
      {
        name: 'Admin Moderator',
        email: 'admin@college.edu',
        primaryEmail: 'admin@college.edu',
        collegeEmail: 'admin@vit.ac.in',
        isVerified: true,
        passwordHash,
        role: 'admin',
        college: 'State University',
        ratingAvg: 5,
        ratingCount: 1
      }
    ];

    const users = await User.insertMany(usersData);
    console.log(`Seeded ${users.length} users.`);

    const alice = users[0];
    const bob = users[1];
    const charlie = users[2];

    // Seed Gigs
    const gigsData = [
      {
        posterId: alice._id,
        title: 'Math Tutor for Midterm Prep',
        description: 'Need help preparing for Calculus II midterm next week. Focus on integration techniques and infinite series.',
        price: 25,
        category: 'Tutoring',
        status: 'open'
      },
      {
        posterId: bob._id,
        title: 'Need Help Moving Sofa',
        description: 'Moving a two-seater sofa from Dorm A to Dorm B this Saturday afternoon. Should take less than 30 minutes. Easy cash.',
        price: 15,
        category: 'Moving & Lifting',
        status: 'open'
      },
      {
        posterId: alice._id,
        acceptedById: bob._id,
        title: 'React Website Landing Page',
        description: 'Build a single-page react landing page for a student club project. Responsive CSS using Tailwind is required.',
        price: 100,
        category: 'Coding & Web',
        status: 'accepted'
      }
    ];
    const gigs = await Gig.insertMany(gigsData);
    console.log(`Seeded ${gigs.length} gigs.`);

    // Seed Rentals
    const rentalsData = [
      {
        ownerId: bob._id,
        title: 'TI-84 Plus CE Calculator',
        description: 'Perfect for calculus or statistics exams. Fully charged, comes with charging cable.',
        pricePerDay: 3,
        category: 'Calculators',
        status: 'available',
        availabilityCalendar: []
      },
      {
        ownerId: alice._id,
        title: 'Mountain Bike with Lock',
        description: '21-speed mountain bike, medium frame. Includes U-lock and helmet. Perfect for campus commuting.',
        pricePerDay: 5,
        category: 'Bicycles & Scooters',
        status: 'available',
        availabilityCalendar: []
      },
      {
        ownerId: charlie._id,
        title: 'Chemistry Textbook 10th Ed',
        description: 'General Chemistry textbook, physical copy. Good condition, no writing inside.',
        pricePerDay: 2,
        category: 'Textbooks',
        status: 'rented',
        availabilityCalendar: ['2026-06-25', '2026-06-26']
      }
    ];
    const rentals = await Rental.insertMany(rentalsData);
    console.log(`Seeded ${rentals.length} rentals.`);

    // Seed a sample transaction between Bob (owner) and Alice (renter)
    const txData = {
      type: 'rental',
      rentalId: rentals[2]._id,
      buyerId: alice._id,
      sellerId: charlie._id,
      amount: 4, // 2 days * ₹2
      status: 'held_in_escrow',
      rentalStartDate: new Date('2026-06-25'),
      rentalEndDate: new Date('2026-06-27')
    };
    const tx = await Transaction.create(txData);
    console.log('Seeded a sample transaction:', tx._id);

    console.log('Seeding completed successfully.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seed();
