-- Ensure identity sequence follows imported ids after migration upserts.
create or replace function public.sync_user_profiles_id_sequence()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_sequence text;
  max_id bigint;
begin
  target_sequence := pg_get_serial_sequence('public.user_profiles', 'id');

  if target_sequence is null then
    raise exception 'Could not determine sequence for public.user_profiles.id';
  end if;

  select coalesce(max(id), 0) into max_id from public.user_profiles;

  perform setval(target_sequence, max_id, true);
end;
$$;
