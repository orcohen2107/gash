-- אימייל לפרופיל (התחברות נשארת SMS+OTP)
alter table public.users add column if not exists email text;

create unique index if not exists users_email_unique_lower
  on public.users (lower(trim(email)))
  where email is not null and length(trim(email)) > 0;

-- בדיקה לפני הרשמה: לא לאפשר אימייל תפוס על ידי חשבון אחר
create or replace function public.fn_registration_precheck(p_phone text, p_email text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  mail text := nullif(lower(trim(coalesce(p_email, ''))), '');
  p_uid uuid;
  e_auth uuid;
  e_public uuid;
begin
  select id into p_uid from auth.users where phone = p_phone limit 1;

  if mail is not null and length(mail) > 0 then
    select id into e_auth from auth.users where lower(trim(coalesce(email, ''))) = mail limit 1;
    select id into e_public from public.users where lower(trim(coalesce(email, ''))) = mail limit 1;
  end if;

  -- אימייל שייך למשתמש אחר (לא לאותו מספר שמנסים עכשיו)
  if mail is not null and length(mail) > 0 then
    if e_public is not null and (p_uid is null or e_public is distinct from p_uid) then
      return jsonb_build_object(
        'ok', false,
        'code', 'EMAIL_TAKEN',
        'message', 'האימייל כבר רשום לחשבון קיים. התחבר דרך «התחברות» עם אותו מספר, או נסה אימייל אחר.'
      );
    end if;
    if e_auth is not null and (p_uid is null or e_auth is distinct from p_uid) then
      return jsonb_build_object(
        'ok', false,
        'code', 'EMAIL_TAKEN',
        'message', 'האימייל כבר רשום לחשבון קיים. התחבר דרך הטלפון או נסה אימייל אחר.'
      );
    end if;
  end if;

  if p_uid is not null then
    return jsonb_build_object(
      'ok', true,
      'code', 'PHONE_EXISTS',
      'message', 'המספר כבר רשום — נשלח קוד SMS. אם כבר יש לך חשבון, זו התחברות (לא יוצרים כפילות).'
    );
  end if;

  return jsonb_build_object('ok', true, 'code', 'NEW', 'message', '');
end;
$$;

revoke all on function public.fn_registration_precheck(text, text) from public;
grant execute on function public.fn_registration_precheck(text, text) to service_role;
