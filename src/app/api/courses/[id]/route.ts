import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Deleting course with ID:', params.id);

    // First delete all subjects associated with the course
    await prisma.subject.deleteMany({
      where: { courseId: params.id }
    });

    // Then delete the course
    const course = await prisma.course.delete({
      where: { id: params.id }
    });

    console.log('Course deleted successfully:', course);
    return NextResponse.json(course);
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json(
      { error: 'Failed to delete course' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const course = await prisma.course.findUnique({
      where: { id: params.id },
      include: {
        subjects: true,
        students: true
      }
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(course);
  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, description, subjects } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Course name is required' },
        { status: 400 }
      );
    }

    // First delete all existing subjects
    await prisma.subject.deleteMany({
      where: { courseId: params.id }
    });

    // Then update the course with new subjects
    const course = await prisma.course.update({
      where: { id: params.id },
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
  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json(
      { error: 'Failed to update course' },
      { status: 500 }
    );
  }
}
