// // delete-storage-files

// import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

// serve(async (req) => {
//   try {
//     const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
//     const SUPABASE_URL = Deno.env.get('SUPABASE_URL')

//     if (!SERVICE_ROLE_KEY || !SUPABASE_URL) {
//       return new Response('Missing Supabase Service Role Key or URL', { status: 500 })
//     }

//     const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

//     const data = await req.json()
//     const { video_path, cover_path } = data.record

//     if (!video_path && !cover_path) {
//       return new Response('No file paths provided.', { status: 400 })
//     }

//     const pathsToDelete: string[] = []
//     if (video_path) pathsToDelete.push(video_path)
//     if (cover_path) pathsToDelete.push(cover_path)

//     console.log('Files to delete:', pathsToDelete)

//     const { error: deleteError } = await supabaseAdmin.storage
//       .from('IdeaUploads') // 这里依然用你现在的 Bucket 名
//       .remove(pathsToDelete)

//     if (deleteError) {
//       console.error('Storage deletion failed:', deleteError)
//       return new Response(JSON.stringify({ error: deleteError.message }), { status: 500 })
//     }

//     return new Response('Storage files successfully deleted.', { status: 200 })
//   } catch (error) {
//     console.error('Handler error:', error)
//     return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 })
//   }
// })
