\set ON_ERROR_STOP on
grant all on all tables in schema public to authenticated;
grant execute on all functions in schema public to authenticated;
insert into auth.users values ('00000000-0000-0000-0000-00000000000a'),('00000000-0000-0000-0000-00000000000b'),('00000000-0000-0000-0000-00000000000c');
insert into profiles(id,username) values ('00000000-0000-0000-0000-00000000000a','alice'),('00000000-0000-0000-0000-00000000000b','bob'),('00000000-0000-0000-0000-00000000000c','carol');
insert into recipes(id,creator_id,title,price_cents,visibility,status) values
 ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000000a','Free pasta',0,'public','published'),
 ('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-00000000000a','Paid curry',800,'marketplace','published');
insert into recipe_content values ('10000000-0000-0000-0000-000000000001','[1]','[1]'),('10000000-0000-0000-0000-000000000002','[2]','[2]');
insert into purchases(buyer_id,recipe_id,amount_cents,payment_status) values ('00000000-0000-0000-0000-00000000000b','10000000-0000-0000-0000-000000000002',800,'paid');
set role authenticated;
create temp table res(name text, ok boolean);
grant all on res to authenticated;
-- carol (non-buyer) sees free content only
set request.uid='00000000-0000-0000-0000-00000000000c';
insert into res select 'non-buyer sees paid content = 0', count(*)=0 from recipe_content where recipe_id='10000000-0000-0000-0000-000000000002';
insert into res select 'non-buyer sees free content', count(*)=1 from recipe_content where recipe_id='10000000-0000-0000-0000-000000000001';
insert into res select 'public listing visible', count(*)=2 from recipes;
-- bob (buyer) sees paid content
set request.uid='00000000-0000-0000-0000-00000000000b';
insert into res select 'buyer sees paid content', count(*)=1 from recipe_content where recipe_id='10000000-0000-0000-0000-000000000002';
-- client cannot grant themselves a purchase
set request.uid='00000000-0000-0000-0000-00000000000c';
do $$ begin
  begin insert into purchases(buyer_id,recipe_id,amount_cents,payment_status) values (auth.uid(),'10000000-0000-0000-0000-000000000002',0,'paid');
    insert into res values ('client cannot insert purchase', false);
  exception when others then insert into res values ('client cannot insert purchase', true); end;
  begin update profiles set role='admin' where id=auth.uid();
    insert into res select 'client cannot self-promote', (select role from profiles where id=auth.uid())='user';
  exception when others then insert into res values ('client cannot self-promote', true); end;
  begin insert into reviews(user_id,recipe_id,rating) values (auth.uid(),'10000000-0000-0000-0000-000000000002',5);
    insert into res values ('non-buyer cannot review paid', false);
  exception when others then insert into res values ('non-buyer cannot review paid', true); end;
end $$;
-- buyer review is verified and updates aggregate
set request.uid='00000000-0000-0000-0000-00000000000b';
insert into reviews(user_id,recipe_id,rating,verified_purchase) values (auth.uid(),'10000000-0000-0000-0000-000000000002',4,false);
insert into res select 'buyer review verified + aggregate', (select verified_purchase from reviews where user_id=auth.uid()) and (select rating_count from recipes where id='10000000-0000-0000-0000-000000000002')=1;
-- private health data isolated
reset role; insert into private_health values ('00000000-0000-0000-0000-00000000000a','{peanut}','{}'); set role authenticated;
set request.uid='00000000-0000-0000-0000-00000000000c';
insert into res select 'allergies private', count(*)=0 from private_health;
select * from res order by 1;
select count(*) filter (where not ok) as failures from res;
