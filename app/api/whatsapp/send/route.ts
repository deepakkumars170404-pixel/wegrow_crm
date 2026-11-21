import { NextResponse } from "next/server";

// WeGrow Official WhatsApp Gateway API (MyDreamsTechnology)
const DEFAULT_LICENSE_NUMBER = "90093749600";
const DEFAULT_API_KEY = "kPHm6t2y5cW78qhKGvZYefQ3E";
const GATEWAY_URL = "https://wa.mydreamstechnology.in/api/sendtemplate.php";

export async function GET(request: Request) {
  return handleWhatsAppRequest(request);
}

export async function POST(request: Request) {
  return handleWhatsAppRequest(request);
}

async function handleWhatsAppRequest(request: Request) {
  try {
    let licenseNumber = DEFAULT_LICENSE_NUMBER;
    let apiKey = DEFAULT_API_KEY;
    let contact = "";
    let template = "";
    let param = "";
    let fileurl = "";
    let urlparam = "";
    let headurl = "";
    let headparam = "";
    let name = "";
    let pdfname = "";

    if (request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      licenseNumber = body.licenseNumber || body.LicenseNumber || DEFAULT_LICENSE_NUMBER;
      apiKey = body.apiKey || body.APIKey || DEFAULT_API_KEY;
      contact = body.contact || body.Contact || body.phone || "";
      template = body.template || body.Template || "";
      param = body.param || body.Param || "";
      fileurl = body.fileurl || body.Fileurl || "";
      urlparam = body.urlparam || body.URLParam || "";
      headurl = body.headurl || body.HeadURL || "";
      headparam = body.headparam || body.HeadParam || "";
      name = body.name || body.Name || "";
      pdfname = body.pdfname || body.PDFName || "";
    } else {
      const { searchParams } = new URL(request.url);
      licenseNumber = searchParams.get("LicenseNumber") || DEFAULT_LICENSE_NUMBER;
      apiKey = searchParams.get("APIKey") || DEFAULT_API_KEY;
      contact = searchParams.get("Contact") || searchParams.get("phone") || "";
      template = searchParams.get("Template") || "";
      param = searchParams.get("Param") || "";
      fileurl = searchParams.get("Fileurl") || "";
      urlparam = searchParams.get("URLParam") || "";
      headurl = searchParams.get("HeadURL") || "";
      headparam = searchParams.get("HeadParam") || "";
      name = searchParams.get("Name") || "";
      pdfname = searchParams.get("PDFName") || "";
    }

    // Clean phone number (must start with 91 for Indian numbers, remove + or spaces)
    let cleanContact = String(contact).replace(/\D/g, "");
    if (cleanContact.length === 10) {
      cleanContact = `91${cleanContact}`;
    }

    if (!cleanContact) {
      return NextResponse.json(
        { success: false, error: "Missing recipient phone number (Contact)" },
        { status: 400 }
      );
    }

    // Build URL query string
    const queryParams = new URLSearchParams({
      LicenseNumber: licenseNumber,
      APIKey: apiKey,
      Contact: cleanContact,
      Template: template || "wegrow_course_info",
    });

    if (param) queryParams.set("Param", param);
    if (fileurl) queryParams.set("Fileurl", fileurl);
    if (urlparam) queryParams.set("URLParam", urlparam);
    if (headurl) queryParams.set("HeadURL", headurl);
    if (headparam) queryParams.set("HeadParam", headparam);
    if (name) queryParams.set("Name", name);
    if (pdfname) queryParams.set("PDFName", pdfname);

    const fullUrl = `${GATEWAY_URL}?${queryParams.toString()}`;

    // Invoke MyDreamsTechnology WhatsApp Gateway
    const response = await fetch(fullUrl, {
      method: "GET",
      headers: {
        "User-Agent": "WeGrowCRM/2.0",
      },
    });

    const responseText = await response.text();

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      gatewayResponse: responseText,
      contact: cleanContact,
      gatewayUrl: GATEWAY_URL,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to trigger WhatsApp Gateway" },
      { status: 500 }
    );
  }
}
