import {
  PrismaClient,
  RoleCode,
  AttributeCategory,
  AttributeType,
  Theme,
  Language
} from '@prisma/client';
import dotenv from 'dotenv';
import { PasswordService } from '../src/modules/auth/passport.service';

dotenv.config();

const prisma = new PrismaClient();

async function upsertRoles() {
  const roles = [RoleCode.CANDIDATE, RoleCode.RECRUITER, RoleCode.ADMIN];

  for (const code of roles) {
    await prisma.role.upsert({
      where: { code },
      update: {},
      create: { code }
    });
  }
}

async function upsertBuiltInAttributes() {
  const builtInAttributes = [
    {
      category: AttributeCategory.PERSONAL_INFORMATION,
      name: 'First Name',
      description: 'Candidate first name',
      type: AttributeType.STRING
    },
    {
      category: AttributeCategory.PERSONAL_INFORMATION,
      name: 'Last Name',
      description: 'Candidate last name',
      type: AttributeType.STRING
    },
    {
      category: AttributeCategory.PERSONAL_INFORMATION,
      name: 'Location',
      description: 'Candidate location',
      type: AttributeType.STRING
    },
    {
      category: AttributeCategory.PERSONAL_INFORMATION,
      name: 'Personal Photo',
      description: 'External image URL for candidate photo',
      type: AttributeType.IMAGE
    }
  ];

  for (const attribute of builtInAttributes) {
    await prisma.attributeDefinition.upsert({
      where: { name: attribute.name },
      update: {
        category: attribute.category,
        description: attribute.description,
        type: attribute.type,
        isBuiltIn: true,
        isDeletable: false
      },
      create: {
        ...attribute,
        isBuiltIn: true,
        isDeletable: false
      }
    });
  }
}

async function upsertSampleLibraryAttributes() {
  const attributes = [
    {
      category: AttributeCategory.LANGUAGE,
      name: 'English Level',
      description: 'Candidate English language proficiency level',
      type: AttributeType.ONE_OF_MANY,
      options: ['Beginner', 'Intermediate', 'Upper-Intermediate', 'Advanced', 'Fluent']
    },
    {
      category: AttributeCategory.CERTIFICATION,
      name: 'IELTS Score',
      description: 'IELTS exam numeric score',
      type: AttributeType.NUMERIC
    },
    {
      category: AttributeCategory.SOFT_SKILLS,
      name: 'Presentation Skills',
      description: 'Presentation skills level',
      type: AttributeType.ONE_OF_MANY,
      options: ['Basic', 'Intermediate', 'Advanced']
    },
    {
      category: AttributeCategory.OTHER,
      name: 'Remote Work Availability',
      description: 'Whether candidate is available for remote work',
      type: AttributeType.BOOLEAN
    },
    {
      category: AttributeCategory.HARD_SKILLS,
      name: 'Primary Tech Stack',
      description: 'Main technology stack summary',
      type: AttributeType.TEXT
    },
    {
      category: AttributeCategory.EDUCATION,
      name: 'Graduation Date',
      description: 'Graduation date',
      type: AttributeType.DATE
    },
    {
      category: AttributeCategory.EXPERIENCE,
      name: 'Professional Experience Period',
      description: 'Overall professional experience period',
      type: AttributeType.PERIOD
    }
  ];

  for (const attribute of attributes) {
    const existing = await prisma.attributeDefinition.upsert({
      where: { name: attribute.name },
      update: {
        category: attribute.category,
        description: attribute.description,
        type: attribute.type
      },
      create: {
        category: attribute.category,
        name: attribute.name,
        description: attribute.description,
        type: attribute.type,
        isBuiltIn: false,
        isDeletable: true
      }
    });

    if (attribute.type === AttributeType.ONE_OF_MANY && attribute.options?.length) {
      for (const [index, label] of attribute.options.entries()) {
        await prisma.attributeOption.upsert({
          where: {
            attributeId_label: {
              attributeId: existing.id,
              label
            }
          },
          update: {
            sortOrder: index
          },
          create: {
            attributeId: existing.id,
            label,
            sortOrder: index
          }
        });
      }
    }
  }
}

async function ensureUserPreference(userId: string) {
  const existingPreference = await prisma.userPreference.findUnique({
    where: { userId }
  });

  if (!existingPreference) {
    await prisma.userPreference.create({
      data: {
        userId,
        theme: Theme.LIGHT,
        language: Language.EN
      }
    });
  }
}

async function ensureCandidateProfile(userId: string) {
  const existingCandidateProfile = await prisma.candidateProfile.findUnique({
    where: { userId }
  });

  if (!existingCandidateProfile) {
    await prisma.candidateProfile.create({
      data: {
        userId
      }
    });
  }
}

async function ensureUserRole(userId: string, roleId: string) {
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId,
        roleId
      }
    },
    update: {},
    create: {
      userId,
      roleId
    }
  });
}

async function upsertAdminUser() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.warn('ADMIN_EMAIL or ADMIN_PASSWORD is not set. Skipping admin seed.');
    return;
  }

  const passwordHash = await PasswordService.hash(adminPassword);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash,
      isBlocked: false
    },
    create: {
      email: adminEmail,
      passwordHash,
      isBlocked: false
    }
  });

  await ensureUserPreference(admin.id);

  const adminRole = await prisma.role.findUniqueOrThrow({
    where: { code: RoleCode.ADMIN }
  });

  await prisma.userRole.deleteMany({
    where: { userId: admin.id }
  });

  await ensureUserRole(admin.id, adminRole.id);

  await prisma.candidateProfile.deleteMany({
    where: { userId: admin.id }
  });

  console.log(`Admin user is ready: ${adminEmail}`);
}

async function main() {
  await upsertRoles();
  await upsertBuiltInAttributes();
  await upsertSampleLibraryAttributes();
  await upsertAdminUser();
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log('Seed completed successfully.');
  })
  .catch(async (error) => {
    console.error('Seed failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
