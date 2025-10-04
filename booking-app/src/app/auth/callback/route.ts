import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Get user data to create/update profile
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Check if user profile exists
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        // Create profile if it doesn't exist
        if (!profile) {
          await supabase.from('users').insert([
            {
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || user.user_metadata?.name,
              avatar_url: user.user_metadata?.avatar_url,
              company_name: user.user_metadata?.company_name,
              role: 'agent', // Default role
            },
          ]);
        }
      }

      return NextResponse.redirect(`${origin}/`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/login?error=Could not authenticate user`);
}