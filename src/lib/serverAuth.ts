import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * securely fetches and validates the current user's session from Next.js cookies.
 * This is meant to be used in Route Handlers (API routes) to prevent IDOR.
 */
export async function getValidatedUser() {
  try {
    const cookieStore = await cookies();
    
    // We only need read access to the cookies to validate the JWT
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
        },
      }
    );

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return user;
  } catch (error) {
    console.error("serverAuth Error:", error);
    return null;
  }
}
