import { userRepository } from '../repositories/userRepository.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { generateToken } from '../utils/jwt.js';
import { v4 as uuidv4 } from 'uuid';

export class AuthController {
  /**
   * Real user registration for Thapar students, faculty, and admins.
   */
  async register(req, res, next) {
    try {
      const { name, email, password, role, department, rollNumber } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Name, email, and password are required',
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'Password must be at least 6 characters long',
        });
      }

      const normalizedEmail = email.toLowerCase().trim();
      const existingUser = await userRepository.getByEmail(normalizedEmail);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'An account with this email already exists. Please sign in.',
        });
      }

      // Check if rollNumber / employeeId is already taken
      if (rollNumber) {
        const cleanRoll = rollNumber.trim().toLowerCase();
        const existingId = await userRepository.getByIdentifier(cleanRoll);
        if (existingId) {
          return res.status(400).json({
            success: false,
            error: `An account with ID '${rollNumber}' already exists. Please sign in.`,
          });
        }
      }

      const userId = `tiet-${uuidv4().slice(0, 8)}`;
      const targetRole = (role || 'STUDENT').toUpperCase();

      const newUser = {
        id: userId,
        name: name.trim(),
        email: normalizedEmail,
        passwordHash: hashPassword(password),
        role: targetRole,
        department: department || 'Computer Science & Engineering (CSED)',
        rollNumber: rollNumber ? rollNumber.trim() : '',
        createdAt: new Date().toISOString(),
      };

      await userRepository.save(newUser);

      // Generate real signed JWT token
      const token = generateToken(newUser);

      // Return sanitized user object without passwordHash
      const { passwordHash: _, ...userProfile } = newUser;

      res.status(201).json({
        success: true,
        message: 'Account registered successfully',
        data: {
          user: userProfile,
          token,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Real credential-based login verifying email or rollNumber / employeeId and hashed password.
   */
  async login(req, res, next) {
    try {
      const { email, identifier, password } = req.body;
      const loginId = (identifier || email || '').trim();

      if (!loginId || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email or Roll No / Employee ID and password are required',
        });
      }

      const user = await userRepository.getByIdentifier(loginId);

      if (!user) {
        return res.status(401).json({
          success: false,
          error: `Invalid credentials. No Thapar account found for '${loginId}'.`,
        });
      }

      // Verify password
      const isMatch = verifyPassword(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials. Incorrect password.',
        });
      }

      const token = generateToken(user);
      const { passwordHash: _, ...userProfile } = user;

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: userProfile,
          token,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async getCurrentUser(req, res, next) {
    try {
      res.json({
        success: true,
        data: req.user,
      });
    } catch (err) {
      next(err);
    }
  }

  async getAllUsers(req, res, next) {
    try {
      const users = await userRepository.getAll();
      const sanitized = users.map(({ passwordHash, ...rest }) => rest);
      res.json({ success: true, count: sanitized.length, data: sanitized });
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
