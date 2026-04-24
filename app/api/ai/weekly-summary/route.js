import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Task from '@/lib/models/Task';
import { generateWeeklySummary } from '@/lib/gemini';

export async function GET(request) {
  try {
    await connectToDatabase();

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const tasks = await Task.find({
      status: 'completed',
      updatedAt: { $gte: sevenDaysAgo }
    }).sort({ updatedAt: -1 });

    if (tasks.length === 0) {
      return NextResponse.json({
        success: true,
        data: '',
        message: 'No completed tasks found in the last 7 days'
      });
    }

    const summary = await generateWeeklySummary(tasks);

    return NextResponse.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Weekly summary error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate weekly summary'
      },
      { status: 500 }
    );
  }
}