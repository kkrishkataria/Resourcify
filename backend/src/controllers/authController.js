import { userRepository } from '../repositories/userRepository.js';

export class AuthController {
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

  async mockLogin(req, res, next) {
    try {
      const { email, role } = req.body;
      let user = null;

      if (email) {
        user = await userRepository.getByEmail(email);
      }

      if (!user) {
        const targetRole = (role || 'STUDENT').toUpperCase();
        user = {
          id: `demo-${targetRole.toLowerCase()}-01`,
          email: email || `${targetRole.toLowerCase()}@campusslot.edu`,
          name: `${targetRole.charAt(0) + targetRole.slice(1).toLowerCase()} User`,
          role: targetRole,
          department: targetRole === 'FACULTY' ? 'Computer Science & Engineering' : 'Engineering',
          createdAt: new Date().toISOString(),
        };
        await userRepository.save(user);
      }

      res.json({
        success: true,
        data: {
          user,
          token: `mock-jwt-${user.role.toLowerCase()}-${user.id}`,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async getAllUsers(req, res, next) {
    try {
      const users = await userRepository.getAll();
      res.json({ success: true, count: users.length, data: users });
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
