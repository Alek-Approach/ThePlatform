import { saveCompanyProfile } from "@/lib/profile-service";

// PUT /api/profile — saves the company profile sent by the profile form.
export async function PUT(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, message: "The form data could not be read." }, { status: 400 });
  }

  const result = await saveCompanyProfile(body);
  return Response.json(result, { status: result.ok ? 200 : 400 });
}
