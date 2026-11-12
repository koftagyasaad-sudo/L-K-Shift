DO $$
DECLARE
  foreign_key RECORD;
BEGIN
  FOR foreign_key IN
    SELECT con.conname
    FROM pg_constraint con
    WHERE con.conrelid = 'public.branches'::regclass
      AND con.contype = 'f'
      AND EXISTS (
        SELECT 1
        FROM unnest(con.conkey) AS key_column(attnum)
        JOIN pg_attribute attr
          ON attr.attrelid = con.conrelid
         AND attr.attnum = key_column.attnum
        WHERE attr.attname = 'manager_id'
      )
  LOOP
    EXECUTE format('ALTER TABLE public.branches DROP CONSTRAINT %I', foreign_key.conname);
  END LOOP;
END
$$;

ALTER TABLE public.branches
  ALTER COLUMN manager_id TYPE TEXT USING manager_id::text;
