-- AFC Player Management: apply once in Supabase SQL Editor.
-- Does not expose the players table directly to public/anonymous users.

CREATE UNIQUE INDEX IF NOT EXISTS players_player_code_unique
ON public.players (UPPER(player_code))
WHERE player_code IS NOT NULL;

CREATE OR REPLACE FUNCTION public.afc_admin_list_players()
RETURNS TABLE (
  id uuid,
  player_code text,
  full_name text,
  phone text,
  attendance_count integer,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT pl.id, pl.player_code, pl.full_name, pl.phone,
         pl.attendance_count, pl.created_at
  FROM public.players pl
  ORDER BY pl.created_at DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.afc_admin_assign_player_code(
  p_player_id uuid,
  p_player_code text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_code text := upper(trim(p_player_code));
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501';
  END IF;

  IF v_code IS NULL OR v_code !~ '^[A-Z0-9]{5,20}$' THEN
    RAISE EXCEPTION 'Player ID must contain 5 to 20 letters or numbers';
  END IF;

  UPDATE public.players
  SET player_code = v_code
  WHERE id = p_player_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Player not found';
  END IF;

  RETURN v_code;
END;
$function$;

REVOKE ALL ON FUNCTION public.afc_admin_list_players() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.afc_admin_assign_player_code(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.afc_admin_list_players() TO authenticated;
GRANT EXECUTE ON FUNCTION public.afc_admin_assign_player_code(uuid, text) TO authenticated;
