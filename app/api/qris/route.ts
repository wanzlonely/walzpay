/**
 * GET  /api/qris     → list QRIS user
 * POST /api/qris     → upload QRIS baru
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { saveUserQris, getUserQrisList, deleteUserQris, setDefaultQris } from "@/lib/storage";
import { isValidQris } from "@/lib/qris";

async function getAuthUser(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.replace("Bearer ", "");
  if (!token) return null;
  return getUserFromToken(token);
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const list = await getUserQrisList(user.id);
  return NextResponse.json({ success: true, data: list });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { qrisString, label, isDefault } = body;

    if (!qrisString || !isValidQris(qrisString)) {
      return NextResponse.json(
        { success: false, error: "String QRIS tidak valid" },
        { status: 400 }
      );
    }

    const saved = await saveUserQris({
      userId: user.id,
      label: label || "",
      qrisString,
      isDefault: isDefault ?? false,
    });

    return NextResponse.json({ success: true, data: saved });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "ID wajib" }, { status: 400 });

    await deleteUserQris(user.id, id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    if (body.action === "setDefault" && body.id) {
      await setDefaultQris(user.id, body.id);
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ success: false, error: "Action tidak valid" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
