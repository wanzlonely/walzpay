import { NextRequest, NextResponse } from "next/server";
import { getUserFromToken, updateWebhookUrl, regenerateApiKey, toPublicUser } from "@/lib/auth";
import { getRedis, keys } from "@/lib/redis";
import type { User } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization") || "";
    const token = auth.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ success: true, data: user });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization") || "";
    const token = auth.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    if (typeof body.webhookUrl === "string") {
      await updateWebhookUrl(user.id, body.webhookUrl);
    }

    if (body.regenerateApiKey) {
      const newKey = await regenerateApiKey(user.id);
      const redis = getRedis();
      const full = await redis.get<User>(keys.user(user.id));
      return NextResponse.json({
        success: true,
        data: full ? toPublicUser(full) : { ...user, apiKey: newKey },
      });
    }

    const redis = getRedis();
    const full = await redis.get<User>(keys.user(user.id));
    return NextResponse.json({
      success: true,
      data: full ? toPublicUser(full) : user,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
