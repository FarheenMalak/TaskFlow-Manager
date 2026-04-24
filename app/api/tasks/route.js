import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { connectToDatabase } from '@/lib/mongodb';
import Task from '@/lib/models/Task';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = { userId: session.user.id };
    if (status && status !== 'all') {
      query.status = status;
    }

    const tasks = await Task.find(query).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: tasks });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const body = await request.json();
    const { title, description } = body;

    if (!title || !description) {
      return NextResponse.json(
        { success: false, error: 'Title and description are required' },
        { status: 400 }
      );
    }

    let priority = 'Medium';
    try {
      const { generatePriority } = await import('@/lib/gemini');
      priority = await generatePriority(title, description);
    } catch (geminiError) {
      console.error('Priority generation failed, using default:', geminiError);
    }

    const task = await Task.create({
      title,
      description,
      status: 'pending',
      priority,
      userId: session.user.id
    });

    return NextResponse.json({ success: true, data: task }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}