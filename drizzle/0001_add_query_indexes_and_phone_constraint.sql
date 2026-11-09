CREATE INDEX "attendance_logs_user_work_date_idx" ON "attendance_logs" USING btree ("user_id","work_date");--> statement-breakpoint
CREATE INDEX "attendance_logs_branch_work_date_idx" ON "attendance_logs" USING btree ("branch_id","work_date");--> statement-breakpoint
CREATE INDEX "attendance_logs_work_date_idx" ON "attendance_logs" USING btree ("work_date");--> statement-breakpoint
CREATE INDEX "custom_roles_name_ar_idx" ON "custom_roles" USING btree ("name_ar");--> statement-breakpoint
CREATE INDEX "leave_requests_user_start_date_idx" ON "leave_requests" USING btree ("user_id","start_date");--> statement-breakpoint
CREATE INDEX "notifications_user_created_at_idx" ON "notifications" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "notifications_user_read_idx" ON "notifications" USING btree ("user_id","is_read");--> statement-breakpoint
CREATE UNIQUE INDEX "users_phone_unique_idx" ON "users" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "users_primary_branch_id_idx" ON "users" USING btree ("primary_branch_id");--> statement-breakpoint
