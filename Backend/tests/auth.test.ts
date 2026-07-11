import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app';
import { User } from '../src/models/User';

const TEST_MONGO_URI = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/campus_gigs_rentals_test';

beforeAll(async () => {
  await mongoose.connect(TEST_MONGO_URI);
});

afterAll(async () => {
  await User.deleteMany({});
  await mongoose.connection.close();
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe('Authentication API Endpoints', () => {
  const mockStudent = {
    name: 'Test Student',
    email: 'test@college.edu',
    password: 'password123',
    college: 'Test College'
  };

  describe('POST /api/v1/auth/signup', () => {
    it('should register a new student with a valid .edu email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/signup')
        .send(mockStudent);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body.user).toHaveProperty('email', 'test@college.edu');
      expect(res.body.user.role).toBe('student');
    });

    it('should reject registration if email is not a college domain (.edu)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          ...mockStudent,
          email: 'test@gmail.com'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('valid college email');
    });

    it('should reject registration if fields are missing', async () => {
      const res = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          name: 'No Email'
        });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login an existing user and return tokens', async () => {
      // Register first
      await request(app)
        .post('/api/v1/auth/signup')
        .send(mockStudent);

      // Attempt Login
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: mockStudent.email,
          password: mockStudent.password
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body.user).toHaveProperty('email', mockStudent.email);
    });

    it('should reject login with wrong password', async () => {
      await request(app)
        .post('/api/v1/auth/signup')
        .send(mockStudent);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: mockStudent.email,
          password: 'wrongpassword'
        });

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('Invalid email or password');
    });
  });
});
