# Supabase setup

The project is already configured to use the Supabase URL and anon key in `.env`.

1. Open the Supabase project dashboard.
2. Go to **SQL Editor**, create a new query, paste the complete contents of [schema.sql](supabase/schema.sql), and run it once.
3. In **Authentication → Users**, create each user with their email and password. If confirmation is enabled, confirm the user’s email or create them with **Auto Confirm User** enabled.
4. Start the app and sign in with that exact Supabase email and password. The app will load and save the shared factory data only after a valid Supabase session is established.

On the first authenticated login, the app also uploads any completely empty remote collection (such as old production-batch or supplier-transaction records) from its local backup. Populated Supabase collections remain authoritative.

Do not put a `service_role` key in `.env` or in the frontend. The public anon key is the correct browser key.

The migration enables Row Level Security and grants complete access to authenticated users of this factory. Before serving more than one factory, replace this shared policy with organisation/user-specific policies...
