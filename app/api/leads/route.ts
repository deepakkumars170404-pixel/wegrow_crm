import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { initialLeads, initialFollowUps } from "@/data/dummy-data";

const DATA_DIR = path.join(process.cwd(), "data");
const STORAGE_FILE = path.join(DATA_DIR, "crm_storage.json");

function ensureStorage() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(STORAGE_FILE)) {
    const initialData = {
      leads: initialLeads,
      followUps: initialFollowUps,
      savedAt: new Date().toISOString(),
    };
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(initialData, null, 2), "utf8");
  }
}

export async function GET() {
  try {
    ensureStorage();
    const raw = fs.readFileSync(STORAGE_FILE, "utf8");
    const data = JSON.parse(raw);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { leads: initialLeads, followUps: initialFollowUps, error: error.message },
      { status: 200 }
    );
  }
}

export async function POST(request: Request) {
  try {
    ensureStorage();
    const body = await request.json();
    const { leads, followUps } = body;

    let existingData: any = { leads: initialLeads, followUps: initialFollowUps };
    try {
      existingData = JSON.parse(fs.readFileSync(STORAGE_FILE, "utf8"));
    } catch {}

    const updatedData = {
      ...existingData,
      ...(leads ? { leads } : {}),
      ...(followUps ? { followUps } : {}),
      savedAt: new Date().toISOString(),
    };

    fs.writeFileSync(STORAGE_FILE, JSON.stringify(updatedData, null, 2), "utf8");
    return NextResponse.json({ success: true, count: updatedData.leads.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
