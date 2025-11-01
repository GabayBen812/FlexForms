import mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

// Import schemas
import { User, UserSchema } from '../nestjs/schemas/user.schema';
import { Organization, OrganizationSchema } from '../nestjs/schemas/organization.schema';
import { FeatureFlag, FeatureFlagSchema } from '../nestjs/schemas/feature-flag.schema';

dotenv.config();

const connectToDB = async () => {
  try {
    const mongoUri = (process.env.MONGODB_URI || '').trim();
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not set in environment variables');
    }
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

async function seedDatabase() {
  try {
    await connectToDB();

    // Get or create models (handle case where models might already be registered)
    let UserModel;
    let OrganizationModel;
    let FeatureFlagModel;
    
    try {
      UserModel = mongoose.model('User');
    } catch {
      UserModel = mongoose.model('User', UserSchema);
    }
    
    try {
      OrganizationModel = mongoose.model('Organization');
    } catch {
      OrganizationModel = mongoose.model('Organization', OrganizationSchema);
    }
    
    try {
      FeatureFlagModel = mongoose.model('FeatureFlag');
    } catch {
      FeatureFlagModel = mongoose.model('FeatureFlag', FeatureFlagSchema);
    }

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🧹 Clearing existing data...');
    await UserModel.deleteMany({});
    await OrganizationModel.deleteMany({});
    await FeatureFlagModel.deleteMany({});

    // Hash password for default user
    const defaultPassword = 'password123'; // You can change this
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // Create a temporary organization ID for initial user creation
    const tempOrgId = new mongoose.Types.ObjectId();

    // 1. Create default user
    console.log('👤 Creating default user...');
    const defaultUser = await UserModel.create({
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Admin User',
      organizationId: tempOrgId, // Temporary, will be updated
      role: 'system_admin',
    });
    console.log(`✅ Created user: ${defaultUser.email} (ID: ${defaultUser._id})`);

    // 2. Create default organization
    console.log('🏢 Creating default organization...');
    const defaultOrg = await OrganizationModel.create({
      owner: defaultUser._id,
      name: 'Default Organization',
      description: 'Default organization for system setup',
      featureFlagIds: [],
      requestDefinitions: {},
    });
    console.log(`✅ Created organization: ${defaultOrg.name} (ID: ${defaultOrg._id})`);

    // 3. Update user with correct organization ID
    console.log('🔄 Updating user with organization ID...');
    await UserModel.findByIdAndUpdate(defaultUser._id, {
      organizationId: defaultOrg._id,
    });
    console.log('✅ Updated user organization reference');

    // 4. Create some feature flags
    console.log('🚩 Creating feature flags...');
    const featureFlags = await FeatureFlagModel.insertMany([
      {
        key: 'advanced_forms',
        name: 'Advanced Forms',
        description: 'Enable advanced form features',
        isEnabled: true,
        tags: ['forms', 'beta'],
        createdBy: defaultUser._id,
      },
      {
        key: 'payment_integration',
        name: 'Payment Integration',
        description: 'Enable payment processing',
        isEnabled: true,
        tags: ['payment', 'production'],
        createdBy: defaultUser._id,
      },
      {
        key: 'club_management',
        name: 'Club Management',
        description: 'Enable club management features',
        isEnabled: true,
        tags: ['clubs', 'management'],
        createdBy: defaultUser._id,
      },
    ]);
    console.log(`✅ Created ${featureFlags.length} feature flags`);

    // 5. Update organization with feature flags (optional)
    if (featureFlags.length > 0) {
      await OrganizationModel.findByIdAndUpdate(defaultOrg._id, {
        $set: {
          featureFlagIds: featureFlags.map(ff => ff._id),
        },
      });
      console.log('✅ Assigned feature flags to organization');
    }

    // 6. Create additional users (optional)
    console.log('👥 Creating additional users...');
    const additionalUsers = [
      {
        email: 'user1@example.com',
        password: await bcrypt.hash('password123', 10),
        name: 'Regular User 1',
        organizationId: defaultOrg._id,
        role: 'editor',
      },
      {
        email: 'user2@example.com',
        password: await bcrypt.hash('password123', 10),
        name: 'Regular User 2',
        organizationId: defaultOrg._id,
        role: 'viewer',
      },
    ];

    const createdUsers = await UserModel.insertMany(additionalUsers);
    console.log(`✅ Created ${createdUsers.length} additional users`);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📋 Default credentials:');
    console.log(`   Email: admin@example.com`);
    console.log(`   Password: ${defaultPassword}`);
    console.log(`\n📋 Additional users:`);
    additionalUsers.forEach((user, idx) => {
      console.log(`   Email: ${user.email}, Password: password123, Role: ${user.role}`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run seed script
seedDatabase();

