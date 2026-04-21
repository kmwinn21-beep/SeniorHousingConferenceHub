import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db, dbReady } from '@/lib/db';
import { extractRawRows } from '@/lib/parsers';
import type { UserResolutionEntry } from '@/lib/columnMapping';

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await dbReady;
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const column = formData.get('column') as string | null;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    if (!column) {
      return NextResponse.json({ error: 'column is required' }, { status: 400 });
    }

    // Parse the file and collect unique non-blank values for the given column
    const buffer = Buffer.from(await file.arrayBuffer());
    const rows = extractRawRows(buffer, file.name);

    const uniqueValues = new Set<string>();
    for (const row of rows) {
      const val = String(row[column] ?? '').trim();
      if (val) uniqueValues.add(val);
    }

    // Fetch user options and display names for resolution
    const [userRows, usersWithConfig] = await Promise.all([
      db.execute({ sql: 'SELECT id, value FROM config_options WHERE category = ? ORDER BY sort_order, value', args: ['user'] }),
      db.execute({ sql: 'SELECT config_id, display_name, email FROM users WHERE config_id IS NOT NULL', args: [] }),
    ]);

    const userOptions: Array<{ id: number; value: string }> = userRows.rows.map((r: Record<string, unknown>) => ({
      id: Number(r.id),
      value: String(r.value),
    }));

    // Map: lowercase display name or email → { config_options.id, display label }
    const displayMap = new Map<string, { id: number; display: string }>();
    for (const r of usersWithConfig.rows) {
      const configId = Number(r.config_id);
      const opt = userOptions.find(u => u.id === configId);
      const display = opt?.value ?? String(r.email ?? '');
      if (r.display_name && String(r.display_name).trim()) {
        displayMap.set(String(r.display_name).trim().toLowerCase(), { id: configId, display });
      }
      if (r.email && String(r.email).trim()) {
        displayMap.set(String(r.email).trim().toLowerCase(), { id: configId, display });
      }
    }

    // Auto-resolve each unique raw value
    const entries: UserResolutionEntry[] = Array.from(uniqueValues).map(raw => {
      const trimmed = raw.trim();
      const lower = trimmed.toLowerCase();

      // Direct numeric ID match
      const num = parseInt(trimmed, 10);
      if (!isNaN(num) && String(num) === trimmed) {
        const opt = userOptions.find(u => u.id === num);
        if (opt) return { raw, resolved_id: num, resolved_display: opt.value };
      }

      // Case-insensitive match against config_options.value (stores email addresses)
      const emailMatch = userOptions.find(u => u.value.toLowerCase() === lower);
      if (emailMatch) return { raw, resolved_id: emailMatch.id, resolved_display: emailMatch.value };

      // Match against users.display_name or users.email
      const nameMatch = displayMap.get(lower);
      if (nameMatch) return { raw, resolved_id: nameMatch.id, resolved_display: nameMatch.display };

      return { raw, resolved_id: null, resolved_display: null };
    });

    return NextResponse.json({ entries, userOptions });
  } catch (error) {
    console.error('POST /api/upload-preview/unique-values error:', error);
    return NextResponse.json({ error: 'Failed to resolve user values' }, { status: 500 });
  }
}
