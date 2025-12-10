// // supabase/functions/video-callback/index.ts

// import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || ""
// const SERVICE_ROLE_KEY =
//   Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
//   Deno.env.get("SERVICE_ROLE_KEY") ||
//   ""

// const corsHeaders = {
//   "Access-Control-Allow-Origin": "*",
//   "Access-Control-Allow-Headers":
//     "authorization, x-client-info, apikey, content-type",
//   "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
// }

// serve(async (req) => {
//   if (req.method === "OPTIONS") {
//     return new Response(null, { status: 204, headers: corsHeaders })
//   }

//   if (req.method !== "POST") {
//     return new Response("Method not allowed", {
//       status: 405,
//       headers: corsHeaders,
//     })
//   }

//   try {
//     const payload = await req.json()
//     console.log("[video-callback] payload:", JSON.stringify(payload))

//     // Ark 回调体结构 = 查询返回体
//     // 必有字段：id, status, content, error?, created_at, updated_at, ...
//     const externalTaskId = payload?.id
//     if (!externalTaskId || typeof externalTaskId !== "string") {
//       console.error("[video-callback] missing id in payload")
//       return new Response("Bad payload: missing id", {
//         status: 400,
//         headers: corsHeaders,
//       })
//     }

//     const status: string =
//       typeof payload?.status === "string" ? payload.status : "unknown"

//     const content = payload?.content ?? {}
//     const videoUrl =
//       typeof content?.video_url === "string" ? content.video_url : null
//     const lastFrameUrl =
//       typeof content?.last_frame_url === "string" ? content.last_frame_url : null

//     const errorObj = payload?.error ?? null
//     const errorMessage =
//       status === "failed" && errorObj != null
//         ? JSON.stringify(errorObj)
//         : null

//     const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

//     const { data, error } = await supabase
//       .from("video_generation_tasks")
//       .update({
//         status,
//         video_url: videoUrl,
//         last_frame_url: lastFrameUrl,
//         error_message: errorMessage,
//       })
//       .eq("external_task_id", externalTaskId)
//       .select("id")
//       .maybeSingle()

//     if (error) {
//       console.error("[video-callback] update task error:", error)
//       return new Response("Failed to update task", {
//         status: 500,
//         headers: corsHeaders,
//       })
//     }

//     if (!data) {
//       console.warn(
//         "[video-callback] no task row matched external_task_id:",
//         externalTaskId,
//       )
//       // 返回 200，让 Ark 不要一直重试，但我们自己记录日志
//     }

//     return new Response(
//       JSON.stringify({ ok: true }),
//       { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
//     )
//   } catch (err) {
//     console.error("[video-callback] Error:", err)
//     return new Response(
//       JSON.stringify({ error: (err as Error).message }),
//       { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
//     )
//   }
// })
// // 