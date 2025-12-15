import mongoose from 'mongoose';
import * as readline from 'readline';
import { connectToDb } from '../db';
import { SystemConfigModel, UserProfileModel } from '../models/userTier';
import { UserTier } from '../types/userTier';

async function addAdmin() {
  try {
    // Connect to database
    await connectToDb();
    console.log('✓ Connected to MongoDB');

    // Prompt for email
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('Enter your email address: ', async (email: string) => {
      try {
        const normalizedEmail = email.toLowerCase().trim();

        // Get or create system config
        let config = await SystemConfigModel.findOne({ configKey: 'main' });

        if (!config) {
          config = new SystemConfigModel({
            configKey: 'main',
            defaultCardLimit: 30,
            emailWhitelist: [],
            adminEmails: []
          });
        }

        // Add to admin emails
        if (!config.adminEmails.includes(normalizedEmail)) {
          config.adminEmails.push(normalizedEmail);
          console.log(`✓ Added ${normalizedEmail} to admin list`);
        } else {
          console.log(`- ${normalizedEmail} already in admin list`);
        }

        // Add to whitelist (for unlimited cards)
        if (!config.emailWhitelist.includes(normalizedEmail)) {
          config.emailWhitelist.push(normalizedEmail);
          console.log(`✓ Added ${normalizedEmail} to whitelist (unlimited cards)`);
        } else {
          console.log(`- ${normalizedEmail} already in whitelist`);
        }

        await config.save();
        console.log('✓ System config updated');

        // Update user profile if exists
        const profile = await UserProfileModel.findOne({ email: normalizedEmail });
        if (profile) {
          profile.tier = UserTier.UNLIMITED;
          profile.cardLimit = -1;
          profile.whitelisted = true;
          profile.updatedAt = new Date().toISOString();
          await profile.save();
          console.log(`✓ Updated user profile for ${normalizedEmail}`);
          console.log(`  - Tier: ${profile.tier}`);
          console.log(`  - Card Limit: Unlimited`);
        } else {
          console.log(`- No existing user profile found (will be created on next login with unlimited access)`);
        }

        console.log('\n✓ Done! You now have:');
        console.log('  - Unlimited cards');
        console.log('  - Admin panel access');
        console.log('  - Ability to manage other users\n');

        rl.close();
        await mongoose.connection.close();
        process.exit(0);
      } catch (error) {
        console.error('Error:', error);
        rl.close();
        process.exit(1);
      }
    });
  } catch (error) {
    console.error('Connection error:', error);
    process.exit(1);
  }
}

addAdmin();
