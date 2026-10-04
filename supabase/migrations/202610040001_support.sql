begin;
create schema if not exists untangle_private;
revoke all on schema untangle_private from public;
grant usage on schema untangle_private to authenticated;
create table untangle_private.admins (user_id uuid primary key references auth.users(id) on delete cascade);
create table public.volunteer_applications (
 user_id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null check (length(display_name) between 2 and 60),
 expertise text not null check (length(expertise) between 10 and 500),
 languages text not null check (languages in ('en','pl','en,pl')),
 experience text not null check (length(experience) between 30 and 1500),
 status text not null default 'pending' check (status in ('pending','approved','declined','revoked')),
 created_at timestamptz not null default now(), reviewed_at timestamptz
);
create table untangle_private.verification_log (
 id bigint generated always as identity primary key, volunteer_id uuid not null,
 reviewer_id uuid not null, decision text not null, note text not null, created_at timestamptz not null default now()
);
create table public.support_requests (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
 volunteer_id uuid not null references public.volunteer_applications(user_id),
 summary text not null check (length(summary) between 10 and 1000),
 status text not null default 'open' check (status in ('open','closed','reported')),
 report_reason text, created_at timestamptz not null default now()
);
create table public.support_messages (
 id uuid primary key default gen_random_uuid(), request_id uuid not null references public.support_requests(id) on delete cascade,
 author_id uuid not null references auth.users(id), body text not null check (length(body) between 1 and 1000),
 created_at timestamptz not null default now()
);
create index support_owner_idx on public.support_requests(owner_id);
create index support_volunteer_idx on public.support_requests(volunteer_id);
create index support_messages_request_idx on public.support_messages(request_id,created_at);
create table untangle_private.ai_usage (subject text not null, day date not null default current_date, count integer not null default 0, primary key(subject,day));

create function untangle_private.is_admin() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from untangle_private.admins where user_id=auth.uid());
$$;
create function untangle_private.approved(person uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.volunteer_applications where user_id=person and status='approved');
$$;
create function untangle_private.can_read_request(request uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.support_requests r where r.id=request and (r.owner_id=auth.uid() or (r.volunteer_id=auth.uid() and r.status<>'reported' and untangle_private.approved(auth.uid()))));
$$;
alter table public.volunteer_applications enable row level security;
alter table public.support_requests enable row level security;
alter table public.support_messages enable row level security;
revoke all on public.volunteer_applications,public.support_requests,public.support_messages from anon,authenticated;
grant select on public.volunteer_applications,public.support_requests,public.support_messages to authenticated;
create policy application_read on public.volunteer_applications for select to authenticated using (user_id=auth.uid() or untangle_private.is_admin());
create policy request_read on public.support_requests for select to authenticated using (untangle_private.can_read_request(id));
create policy message_read on public.support_messages for select to authenticated using (untangle_private.can_read_request(request_id));

create function public.community_snapshot() returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Sign in first'; end if;
 return jsonb_build_object(
 'admin',untangle_private.is_admin(),
 'application',(select to_jsonb(v) from public.volunteer_applications v where v.user_id=auth.uid()),
 'directory',coalesce((select jsonb_agg(jsonb_build_object('id',v.user_id,'name',v.display_name,'expertise',v.expertise,'languages',v.languages,'verifiedAt',v.reviewed_at) order by v.display_name) from public.volunteer_applications v where v.status='approved' and v.user_id<>auth.uid()),'[]'::jsonb),
 'requests',coalesce((select jsonb_agg(to_jsonb(r)||jsonb_build_object('volunteerName',v.display_name) order by r.created_at desc) from public.support_requests r join public.volunteer_applications v on v.user_id=r.volunteer_id where untangle_private.can_read_request(r.id)),'[]'::jsonb),
 'applications',case when untangle_private.is_admin() then coalesce((select jsonb_agg(to_jsonb(v) order by v.created_at) from public.volunteer_applications v),'[]'::jsonb) else '[]'::jsonb end,
 'reports',case when untangle_private.is_admin() then coalesce((select jsonb_agg(jsonb_build_object('id',r.id,'volunteer_id',r.volunteer_id,'report_reason',r.report_reason,'created_at',r.created_at)) from public.support_requests r where r.status='reported'),'[]'::jsonb) else '[]'::jsonb end);
end; $$;
create function public.apply_volunteer(name text, specialty text, languages text, experience text, adult boolean, conduct boolean) returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or adult is distinct from true or conduct is distinct from true then raise exception 'Confirm eligibility and sign in'; end if;
 insert into public.volunteer_applications(user_id,display_name,expertise,languages,experience) values(auth.uid(),btrim(name),btrim(specialty),languages,btrim(experience));
end; $$;
create function public.review_volunteer(person uuid, decision text, verification_note text, identity_checked boolean, experience_checked boolean, conduct_checked boolean) returns void language plpgsql security definer set search_path='' as $$
begin
 if not untangle_private.is_admin() then raise exception 'Administrator access required'; end if;
 if person=auth.uid() then raise exception 'A different administrator must review this application'; end if;
 if decision not in ('approved','declined','revoked') or length(btrim(verification_note)) not between 20 and 1000 then raise exception 'A review decision and verification record are required'; end if;
 if decision='approved' and (identity_checked is distinct from true or experience_checked is distinct from true or conduct_checked is distinct from true) then raise exception 'Complete every verification check'; end if;
 update public.volunteer_applications set status=decision,reviewed_at=now() where user_id=person;
 if not found then raise exception 'Application not found'; end if;
 insert into untangle_private.verification_log(volunteer_id,reviewer_id,decision,note) values(person,auth.uid(),decision,verification_note);
end; $$;
create function public.request_support(volunteer uuid, message text, adult boolean) returns uuid language plpgsql security definer set search_path='' as $$
declare result uuid;
begin
 if auth.uid() is null or adult is distinct from true or auth.uid()=volunteer then raise exception 'An eligible signed-in account is required'; end if;
 perform 1 from auth.users where id=auth.uid() for update;
 perform 1 from public.volunteer_applications where user_id=volunteer and status='approved' for update;
 if not found then raise exception 'This volunteer is no longer available'; end if;
 if (select count(*) from public.support_requests where owner_id=auth.uid() and status='open')>=5 or (select count(*) from public.support_requests where volunteer_id=volunteer and status='open')>=10 then raise exception 'Please use another support option; the request limit has been reached'; end if;
 insert into public.support_requests(owner_id,volunteer_id,summary) values(auth.uid(),volunteer,btrim(message)) returning id into result;
 return result;
end; $$;
create function public.read_support(request uuid) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if not untangle_private.can_read_request(request) then raise exception 'Request unavailable'; end if;
 return coalesce((select jsonb_agg(to_jsonb(m) order by m.created_at,m.id) from public.support_messages m where m.request_id=request),'[]'::jsonb);
end; $$;
create function public.reply_support(request uuid, message text) returns void language plpgsql security definer set search_path='' as $$
begin
 if not untangle_private.can_read_request(request) then raise exception 'Request unavailable'; end if;
 perform 1 from public.support_requests where id=request and status='open' for update;
 if not found then raise exception 'This conversation is closed'; end if;
 if (select count(*) from public.support_messages where request_id=request)>=100 then raise exception 'Conversation limit reached'; end if;
 insert into public.support_messages(request_id,author_id,body) values(request,auth.uid(),btrim(message));
end; $$;
create function public.manage_support(request uuid, action text, reason text default '') returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not exists(select 1 from public.support_requests where id=request and owner_id=auth.uid()) then raise exception 'Only the person who asked can manage this request'; end if;
 if action='delete' then delete from public.support_requests where id=request;
 elsif action='close' then update public.support_requests set status='closed' where id=request and status='open';
 elsif action='report' and length(btrim(reason)) between 10 and 1000 then update public.support_requests set status='reported',report_reason=reason where id=request;
 else raise exception 'Choose a valid action'; end if;
end; $$;
create function public.consume_ai_budget() returns boolean language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Sign in first'; end if;
 insert into untangle_private.ai_usage(subject,count) values('global',1) on conflict(subject,day) do update set count=untangle_private.ai_usage.count+1 where untangle_private.ai_usage.count<200;
 if not found then raise exception 'Daily service limit reached'; end if;
 insert into untangle_private.ai_usage(subject,count) values(auth.uid()::text,1) on conflict(subject,day) do update set count=untangle_private.ai_usage.count+1 where untangle_private.ai_usage.count<10;
 if not found then raise exception 'Daily account limit reached'; end if;
 return true;
end; $$;
revoke all on all tables in schema untangle_private from public,anon,authenticated;
revoke execute on all functions in schema untangle_private from public,anon,authenticated;
grant execute on function untangle_private.is_admin(),untangle_private.approved(uuid),untangle_private.can_read_request(uuid) to authenticated;
revoke execute on function public.community_snapshot(),public.apply_volunteer(text,text,text,text,boolean,boolean),public.review_volunteer(uuid,text,text,boolean,boolean,boolean),public.request_support(uuid,text,boolean),public.read_support(uuid),public.reply_support(uuid,text),public.manage_support(uuid,text,text),public.consume_ai_budget() from public,anon,authenticated;
grant execute on function public.community_snapshot(),public.apply_volunteer(text,text,text,text,boolean,boolean),public.review_volunteer(uuid,text,text,boolean,boolean,boolean),public.request_support(uuid,text,boolean),public.read_support(uuid),public.reply_support(uuid,text),public.manage_support(uuid,text,text),public.consume_ai_budget() to authenticated;
commit;
