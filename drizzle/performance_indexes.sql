-- Production indexes verified against the live public schema.
-- Safe to apply repeatedly. Existing equivalent indexes are retained.
CREATE UNIQUE INDEX IF NOT EXISTS users_phone_key
  ON public.users USING btree (phone);

CREATE INDEX IF NOT EXISTS idx_attendance_user_id
  ON public.attendance USING btree (user_id);

CREATE INDEX IF NOT EXISTS attendance_user_check_in_idx
  ON public.attendance USING btree (user_id, check_in);

CREATE INDEX IF NOT EXISTS leave_requests_user_status_idx
  ON public.leave_requests USING btree (user_id, status);

CREATE INDEX IF NOT EXISTS users_primary_branch_id_idx
  ON public.users USING btree (primary_branch_id);

CREATE INDEX IF NOT EXISTS idx_users_branch_id
  ON public.users USING btree (branch_id);
