
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  let body: { certificate_id?: unknown };

  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid request body" }, 400);
  }

  const id = body.certificate_id;

  if (
    typeof id !== "string" ||
    !/^[A-Za-z0-9_-]{1,80}$/.test(id)
  ) {
    return jsonResponse({ error: "Invalid certificate ID" }, 400);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceKey) {
    return jsonResponse(
      { error: "Server configuration error" },
      500
    );
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data, error } = await supabase
    .from("certificates")
    .select(
      "certificate_id, participant_name, event_name, department, academic_year, issue_date, status"
    )
    .eq("certificate_id", id)
    .maybeSingle();

  if (error) {
    console.error("Certificate lookup failed:", error.message);
    return jsonResponse(
      { error: "Verification service unavailable" },
      500
    );
  }

  if (!data) {
    return jsonResponse({
      found: false,
      message: "No matching certificate was found.",
    });
  }

  return jsonResponse({
    found: true,
    verified: data.status === "valid",
    certificate: {
      certificate_id: data.certificate_id,
      participant_name: data.participant_name,
      event_name: data.event_name,
      department: data.department,
      academic_year: data.academic_year,
      issue_date: data.issue_date,
      status: data.status,
    },
  });
});
