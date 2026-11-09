CREATE TYPE "public"."attendance_status" AS ENUM('ON_TIME', 'LATE', 'ABSENT', 'INCOMPLETE', 'EXCUSED', 'HOLIDAY', 'LEAVE', 'SICK_LEAVE', 'DAY_OFF');--> statement-breakpoint
CREATE TYPE "public"."leave_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('SUPER_ADMIN', 'EMPLOYEE');--> statement-breakpoint
CREATE TYPE "public"."verification_mode" AS ENUM('QR_GPS', 'GPS_ONLY', 'GPS_WIFI', 'MANUAL');--> statement-breakpoint
CREATE TABLE "attendance_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"branch_id" integer,
	"work_date" timestamp NOT NULL,
	"check_in_time" timestamp with time zone,
	"check_in_lat" double precision,
	"check_in_lng" double precision,
	"check_in_distance" double precision,
	"check_in_photo_url" text,
	"check_out_time" timestamp with time zone,
	"check_out_lat" double precision,
	"check_out_lng" double precision,
	"check_out_distance" double precision,
	"status" "attendance_status" DEFAULT 'INCOMPLETE' NOT NULL,
	"actual_worked_minutes" integer DEFAULT 0 NOT NULL,
	"late_minutes" integer DEFAULT 0 NOT NULL,
	"overtime_minutes" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "branches" (
	"id" serial PRIMARY KEY NOT NULL,
	"name_ar" text NOT NULL,
	"name_en" text,
	"address" text,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"geofence_radius" integer DEFAULT 100 NOT NULL,
	"qr_secret_key" text,
	"qr_refresh_sec" integer DEFAULT 60,
	"shift_schedule" text,
	"shift_start_time" text,
	"shift_end_time" text,
	"shift_name" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "custom_roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"name_ar" text NOT NULL,
	"permissions" jsonb NOT NULL,
	"branch_scope" text DEFAULT 'ALL' NOT NULL,
	"allowed_branch_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "custom_roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "leave_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"leave_type" text,
	"request_type" text,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"total_days" integer DEFAULT 1,
	"duration_days" integer DEFAULT 1,
	"advance_amount" numeric DEFAULT '0',
	"reason" text,
	"rejection_reason" text,
	"rejection_notes" text,
	"status" "leave_status" DEFAULT 'PENDING' NOT NULL,
	"final_status" text DEFAULT 'PENDING',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"link" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"full_name_ar" text NOT NULL,
	"full_name_en" text,
	"phone" text NOT NULL,
	"national_id" text,
	"password_hash" text NOT NULL,
	"system_role" "user_role" DEFAULT 'EMPLOYEE' NOT NULL,
	"job_role" text NOT NULL,
	"primary_branch_id" integer,
	"verification_mode" "verification_mode" DEFAULT 'QR_GPS' NOT NULL,
	"monthly_salary" numeric,
	"working_hours_per_day" integer DEFAULT 8 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"address" text,
	"emergency_contact" text,
	"employee_number" text,
	"employee_code" text,
	"reset_otp" text,
	"reset_otp_expires_at" timestamp with time zone,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
