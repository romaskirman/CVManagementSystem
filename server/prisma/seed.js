"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const dotenv_1 = __importDefault(require("dotenv"));
const passport_service_1 = require("../src/modules/auth/passport.service");
dotenv_1.default.config();
const prisma = new client_1.PrismaClient();
async function upsertRoles() {
    const roles = [client_1.RoleCode.CANDIDATE, client_1.RoleCode.RECRUITER, client_1.RoleCode.ADMIN];
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
            category: client_1.AttributeCategory.PERSONAL_INFORMATION,
            name: 'First Name',
            description: 'Candidate first name',
            type: client_1.AttributeType.STRING
        },
        {
            category: client_1.AttributeCategory.PERSONAL_INFORMATION,
            name: 'Last Name',
            description: 'Candidate last name',
            type: client_1.AttributeType.STRING
        },
        {
            category: client_1.AttributeCategory.PERSONAL_INFORMATION,
            name: 'Location',
            description: 'Candidate location',
            type: client_1.AttributeType.STRING
        },
        {
            category: client_1.AttributeCategory.PERSONAL_INFORMATION,
            name: 'Personal Photo',
            description: 'External image URL for candidate photo',
            type: client_1.AttributeType.IMAGE
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
            category: client_1.AttributeCategory.LANGUAGE,
            name: 'English Level',
            description: 'Candidate English language proficiency level',
            type: client_1.AttributeType.ONE_OF_MANY,
            options: ['Beginner', 'Intermediate', 'Upper-Intermediate', 'Advanced', 'Fluent']
        },
        {
            category: client_1.AttributeCategory.CERTIFICATION,
            name: 'IELTS Score',
            description: 'IELTS exam numeric score',
            type: client_1.AttributeType.NUMERIC
        },
        {
            category: client_1.AttributeCategory.SOFT_SKILLS,
            name: 'Presentation Skills',
            description: 'Presentation skills level',
            type: client_1.AttributeType.ONE_OF_MANY,
            options: ['Basic', 'Intermediate', 'Advanced']
        },
        {
            category: client_1.AttributeCategory.OTHER,
            name: 'Remote Work Availability',
            description: 'Whether candidate is available for remote work',
            type: client_1.AttributeType.BOOLEAN
        },
        {
            category: client_1.AttributeCategory.HARD_SKILLS,
            name: 'Primary Tech Stack',
            description: 'Main technology stack summary',
            type: client_1.AttributeType.TEXT
        },
        {
            category: client_1.AttributeCategory.EDUCATION,
            name: 'Graduation Date',
            description: 'Graduation date',
            type: client_1.AttributeType.DATE
        },
        {
            category: client_1.AttributeCategory.EXPERIENCE,
            name: 'Professional Experience Period',
            description: 'Overall professional experience period',
            type: client_1.AttributeType.PERIOD
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
        if (attribute.type === client_1.AttributeType.ONE_OF_MANY && attribute.options?.length) {
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
async function ensureUserPreference(userId) {
    const existingPreference = await prisma.userPreference.findUnique({
        where: { userId }
    });
    if (!existingPreference) {
        await prisma.userPreference.create({
            data: {
                userId,
                theme: client_1.Theme.LIGHT,
                language: client_1.Language.EN
            }
        });
    }
}
async function ensureCandidateProfile(userId) {
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
async function ensureUserRole(userId, roleId) {
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
    const passwordHash = await passport_service_1.PasswordService.hash(adminPassword);
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
    await ensureCandidateProfile(admin.id);
    const [adminRole, recruiterRole, candidateRole] = await Promise.all([
        prisma.role.findUniqueOrThrow({
            where: { code: client_1.RoleCode.ADMIN }
        }),
        prisma.role.findUniqueOrThrow({
            where: { code: client_1.RoleCode.RECRUITER }
        }),
        prisma.role.findUniqueOrThrow({
            where: { code: client_1.RoleCode.CANDIDATE }
        })
    ]);
    await ensureUserRole(admin.id, adminRole.id);
    await ensureUserRole(admin.id, recruiterRole.id);
    await ensureUserRole(admin.id, candidateRole.id);
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
