import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET() {
  try {
    const fcraFilePath = path.join(process.cwd(), "public", "legal", "Host Fair Credit Reporting Act Compliance Addendum FORM 10-09-25.html");
    const content = await fs.readFile(fcraFilePath, "utf-8");

    return NextResponse.json({ content });
  } catch (error) {
    console.error("Failed to load FCRA content:", error);
    return NextResponse.json(
      { error: "Failed to load FCRA content" },
      { status: 500 }
    );
  }
}
