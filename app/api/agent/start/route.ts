import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Mock agent function
async function runMockAgent(sessionId: string) {
  const channel = `ag-ui-stream:${sessionId}`;
  
  await redis.publish(channel, JSON.stringify({ type: 'status', data: 'Agent starting...' }));
  await new Promise(res => setTimeout(res, 1000));
  
  await redis.publish(channel, JSON.stringify({ type: 'status', data: 'Thinking...' }));
  await new Promise(res => setTimeout(res, 2000));
  
  await redis.publish(channel, JSON.stringify({ type: 'result', data: 'This is the final result from the agent.' }));
  await new Promise(res => setTimeout(res, 500));

  await redis.publish(channel, JSON.stringify({ type: 'status', data: 'Done' }));
}

export async function POST(req: NextRequest) {
  const sessionId = nanoid();

  // Run the agent logic in the background without awaiting it
  runMockAgent(sessionId).catch(console.error);

  return NextResponse.json({ sessionId });
}
