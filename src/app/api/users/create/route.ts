import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { firstName, lastName, username, password, role, email, phoneNumber, courseId, supervisorId } = await request.json();

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 400 }
      );
    }

    // If role is STUDENT and supervisorId is provided, verify supervisor exists
    if (role === 'STUDENT' && supervisorId) {
      const supervisor = await prisma.user.findUnique({
        where: { 
          id: supervisorId,
          role: 'SUPERVISOR'
        },
      });

      if (!supervisor) {
        return NextResponse.json(
          { error: 'Invalid supervisor selected' },
          { status: 400 }
        );
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user data object
    const userData = {
      firstName,
      lastName,
      username,
      password: hashedPassword,
      role: role || 'STUDENT',
    };

    // Add student-specific fields if role is STUDENT
    if (role === 'STUDENT') {
      Object.assign(userData, {
        email,
        phoneNumber,
        courseId,
        supervisorId, // Add supervisor relationship
      });
    }

    // Create new user
    const user = await prisma.user.create({
      data: userData,
      include: {
        supervisor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      }
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
