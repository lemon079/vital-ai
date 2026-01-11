import { prisma } from "@/lib/db/client";
import { hash } from "bcrypt";

export interface User {
    id: string;
    email: string;
    password?: string;
    name?: string;
    created_at: Date;
}

export async function getUserByEmail(email: string): Promise<User | null> {
    const user = await prisma.users.findUnique({
        where: { email },
    });

    if (user) {
        return {
            ...user,
            created_at: user.created_at || new Date(),
        };
    }
    return null;
}

export async function createUser(email: string, password: string): Promise<User> {
    const hashedPassword = await hash(password, 10);

    // Check if user already exists
    const existing = await prisma.users.findUnique({
        where: { email },
        select: { id: true },
    });

    if (existing) {
        throw new Error('User already exists');
    }

    const newUser = await prisma.users.create({
        data: {
            email,
            password: hashedPassword,
        },
        select: {
            id: true,
            email: true,
            created_at: true,
        }
    });

    return {
        ...newUser,
        created_at: newUser.created_at || new Date(),
    };
}
