const rateLimitMap = new Map<string, { count: number, timestamp: number }>();

export function rateLimit(ip: string, limit: number = 5, windowMs: number = 60000): boolean {
  const now = Date.now();
  const userRecord = rateLimitMap.get(ip);
  
  if (!userRecord) {
    rateLimitMap.set(ip, { count: 1, timestamp: now });
    return true;
  }
  
  if (now - userRecord.timestamp > windowMs) {
    rateLimitMap.set(ip, { count: 1, timestamp: now });
    return true;
  }
  
  if (userRecord.count >= limit) {
    return false;
  }
  
  userRecord.count += 1;
  return true;
}
