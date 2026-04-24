import { NextResponse } from 'next/server';
import { generateTaskSuggestions } from '@/lib/gemini';

export async function POST(request) {
  try {
    const body = await request.json();
    const { description } = body;

    if (!description) {
      return NextResponse.json(
        { success: false, error: 'Description is required' },
        { status: 400 }
      );
    }

    const tasks = await generateTaskSuggestions(description);

    return NextResponse.json({
      success: true,
      data: tasks
    });
  } catch (error) {
    console.error('AI task suggestions error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate task suggestions'
      },
      { status: 500 }
    );
  }
}