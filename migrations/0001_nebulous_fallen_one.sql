CREATE TYPE "public"."action_category" AS ENUM('create', 'update', 'delete', 'approve', 'reject', 'login', 'logout');--> statement-breakpoint
CREATE TYPE "public"."audit_log_status" AS ENUM('success', 'failed', 'partial');--> statement-breakpoint
CREATE TYPE "public"."site_setting_data_type" AS ENUM('string', 'number', 'boolean', 'json');--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"action" varchar(100) NOT NULL,
	"action_category" "action_category" NOT NULL,
	"entity_type" varchar(100) NOT NULL,
	"entity_name" varchar(255),
	"changes" jsonb,
	"status" "audit_log_status" NOT NULL,
	"error_message" text,
	"ip_address" varchar(45) NOT NULL,
	"user_agent" text,
	"request_method" varchar(10),
	"request_url" text,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_setting" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" text,
	"description" text,
	"data_type" "site_setting_data_type" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" text,
	CONSTRAINT "site_setting_key_unique" UNIQUE("key")
);
--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_setting" ADD CONSTRAINT "site_setting_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_log_user_id_idx" ON "audit_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_log_action_category_idx" ON "audit_log" USING btree ("action_category");--> statement-breakpoint
CREATE INDEX "audit_log_entity_type_idx" ON "audit_log" USING btree ("entity_type");--> statement-breakpoint
CREATE INDEX "audit_log_created_at_idx" ON "audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "site_setting_data_type_idx" ON "site_setting" USING btree ("data_type");