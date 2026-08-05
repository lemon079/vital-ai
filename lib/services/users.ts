import { prisma } from "@/lib/db/client";
import { hash } from "bcrypt";

export interface UserRecord {
    id: string;
    email: string;
    password?: string;
    date_of_birth?: Date | null;
    sex?: string | null;
    pregnancy_status?: string | null;
    is_onboarded: boolean;
    created_at: Date;
}

export async function getUserByEmail(email: string): Promise<UserRecord | null> {
    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (user) {
        return {
            ...user,
            is_onboarded: user.is_onboarded,
            created_at: user.created_at,
        };
    }
    return null;
}

export async function createUser(email: string, password: string): Promise<UserRecord> {
    const hashedPassword = await hash(password, 10);

    // Check if user already exists
    const existing = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
    });

    if (existing) {
        throw new Error('User already exists');
    }

    const newUser = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
        },
    });

    return {
        ...newUser,
        is_onboarded: newUser.is_onboarded,
        created_at: newUser.created_at,
    };
}
