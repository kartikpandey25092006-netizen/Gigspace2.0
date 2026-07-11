import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app';
import { User } from '../src/models/User';
import { Gig } from '../src/models/Gig';
import { Transaction } from '../src/models/Transaction';
import { Category } from '../src/models/Category';

const TEST_MONGO_URI = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/campus_gigs_rentals_test';

beforeAll(async () => {
  await mongoose.connect(TEST_MONGO_URI);
});

afterAll(async () => {
  await User.deleteMany({});
  await Gig.deleteMany({});
  await Transaction.deleteMany({});
  await Category.deleteMany({});
  await mongoose.connection.close();
});

beforeEach(async () => {
  await User.deleteMany({});
  await Gig.deleteMany({});
  await Transaction.deleteMany({});
  await Category.deleteMany({});
});

describe('Gigs API Endpoints', () => {
  let user1Token: string;
  let user2Token: string;
  let user1Id: string;
  let user2Id: string;

  beforeEach(async () => {
    // Register poster
    const signup1 = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        name: 'Poster Student',
        email: 'poster@college.edu',
        password: 'password123',
        college: 'State University'
      });
    user1Token = signup1.body.accessToken;
    user1Id = signup1.body.user.id;

    // Register accepter
    const signup2 = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        name: 'Accepter Student',
        email: 'accepter@college.edu',
        password: 'password123',
        college: 'State University'
      });
    user2Token = signup2.body.accessToken;
    user2Id = signup2.body.user.id;
  });

  describe('POST /api/v1/gigs', () => {
    it('should create a gig successfully when authenticated', async () => {
      const gigData = {
        title: 'Need tutoring for calculus',
        description: 'Need help with integrals. 2 hours.',
        price: 30,
        category: 'Tutoring'
      };

      const res = await request(app)
        .post('/api/v1/gigs')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(gigData);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('title', gigData.title);
      expect(res.body).toHaveProperty('status', 'open');
      expect(res.body.posterId.toString()).toBe(user1Id);
    });
  });

  describe('POST /api/v1/gigs/:id/accept', () => {
    it('should allow another student to accept an open gig and establish an escrow transaction', async () => {
      // Create gig
      const newGig = await Gig.create({
        posterId: new mongoose.Types.ObjectId(user1Id),
        title: 'Walk my dog',
        description: 'Need dog walking for 1 hour.',
        price: 15,
        category: 'Delivery',
        status: 'open'
      });

      const res = await request(app)
        .post(`/api/v1/gigs/${newGig._id}/accept`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.status).toBe(200);
      expect(res.body.gig).toHaveProperty('status', 'accepted');
      expect(res.body.gig.acceptedById.toString()).toBe(user2Id);
      expect(res.body.transaction).toHaveProperty('status', 'held_in_escrow');
      expect(res.body.transaction.amount).toBe(15);
    });

    it('should reject accepting own gig', async () => {
      const newGig = await Gig.create({
        posterId: new mongoose.Types.ObjectId(user1Id),
        title: 'Tutoring Calc',
        description: 'Calculus helper.',
        price: 20,
        category: 'Tutoring',
        status: 'open'
      });

      const res = await request(app)
        .post(`/api/v1/gigs/${newGig._id}/accept`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(400);
    });
  });
});
