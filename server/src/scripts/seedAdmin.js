import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../config/db.js';
import { env } from '../config/env.js';
import { User } from '../models/User.js';

async function seedAdmin() {
  const email = (env.ADMIN_EMAIL || process.env.ADMIN_EMAIL || 'admin@nexai.local').toLowerCase().trim();
  const password = env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'Admin@123456';

  console.log(`\n🌱 Seeding Admin User: ${email}...`);

  await connectDB();

  try {
    let user = await User.findOne({ email });

    if (user) {
      user.role = 'admin';
      const salt = await bcrypt.genSalt(12);
      user.passwordHash = await bcrypt.hash(password, salt);
      await user.save();
      console.log(`✅ Existing user '${email}' promoted to admin with updated password.`);
    } else {
      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(password, salt);

      user = await User.create({
        email,
        passwordHash,
        role: 'admin',
        wallet: {
          creditsRemaining: env.STARTER_CREDITS !== undefined ? Number(env.STARTER_CREDITS) : 100,
          tier: 'pro_monthly',
          totalTokensConsumed: 0,
        },
        settings: {
          theme: 'dark',
          defaultModel: 'flash',
          webSearchDefaultOn: false,
        },
      });
      console.log(`✅ Admin user '${email}' created successfully.`);
    }
  } catch (error) {
    console.error('❌ Failed to seed admin user:', error);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
    console.log('🌱 Seeding process complete.\n');
  }
}

seedAdmin();
