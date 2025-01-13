import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      include: {
        subjects: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, subjects } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Course name is required' },
        { status: 400 }
      );
    }

    // Log the request data for debugging
    console.log('Creating course with data:', {
      name,
      description,
      subjects
    });

    const course = await prisma.course.create({
      data: {
        name,
        description: description || null,
        subjects: {
          create: Array.isArray(subjects) ? subjects.map(subject => ({
            name: subject
          })) : []
        }
      },
      include: {
        subjects: true
      }
    });

    return NextResponse.json(course);
  } catch (error: any) {
    // Log the detailed error
    console.error('Detailed error creating course:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to create course' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, description, subjects } = body;

    if (!id || !name) {
      return NextResponse.json(
        { error: 'Course ID and name are required' },
        { status: 400 }
      );
    }

    // Log the request data for debugging
    console.log('Updating course with data:', {
      id,
      name,
      description,
      subjects
    });

    const course = await prisma.course.update({
      where: { id },
      data: {
        name,
        description: description || null,
        subjects: {
          deleteMany: {},  // Delete all existing subjects
          create: Array.isArray(subjects) ? subjects.map(subject => ({
            name: subject
          })) : []
        }
      },
      include: {
        subjects: true
      }
    });

    return NextResponse.json(course);
  } catch (error: any) {
    // Log the detailed error
    console.error('Detailed error updating course:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to update course' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!id) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }

    // Log the request data for debugging
    console.log('Deleting course with ID:', id);

    await prisma.course.delete({
      where: { id }
    });

    // Log the deleted course for debugging
    console.log('Deleted course with ID:', id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    // Log the detailed error
    console.error('Detailed error deleting course:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to delete course' },
      { status: 500 }
    );
  }
}
