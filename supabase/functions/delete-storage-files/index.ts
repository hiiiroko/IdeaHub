// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
// index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

serve(async (req) => {
    try {
        // 1. 获取 Service Role Key 和 URL
        const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
        const SUPABASE_URL = Deno.env.get('SUPABASE_URL')

        if (!SERVICE_ROLE_KEY || !SUPABASE_URL) {
            return new Response('Missing Supabase Service Role Key or URL', { status: 500 })
        }

        // 2. 使用 Service Role 权限创建 Supabase 客户端
        const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

        // 3. 解析请求体，获取被删除的路径
        // 请求体是 POSTGRES 触发器发送的 JSON 
        const data = await req.json()
        const { video_path, cover_path } = data.record // 假设 Trigger 传递了这些字段

        if (!video_path && !cover_path) {
            return new Response('No file paths provided.', { status: 400 })
        }

        const pathsToDelete = [];
        if (video_path) pathsToDelete.push(video_path);
        if (cover_path) pathsToDelete.push(cover_path);

        console.log("Files to delete:", pathsToDelete);

        // 4. 执行文件批量删除
        const { error: deleteError } = await supabaseAdmin.storage
            .from('IdeaUploads') // 替换为你实际的 Bucket 名称
            .remove(pathsToDelete)

        if (deleteError) {
            console.error("Storage deletion failed:", deleteError);
            return new Response(JSON.stringify({ error: deleteError.message }), { status: 500 })
        }

        return new Response('Storage files successfully deleted.', { status: 200 })
    } catch (error) {
        console.error("Handler error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/delete-storage-files' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
