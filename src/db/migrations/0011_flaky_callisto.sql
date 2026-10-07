CREATE TABLE "credit_balance" (
	"user_id" text PRIMARY KEY NOT NULL,
	"balance" integer DEFAULT 5 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "photo_job" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"tool" text NOT NULL,
	"input_url" text NOT NULL,
	"output_url" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"params" jsonb DEFAULT '{}'::jsonb,
	"cost_credits" integer DEFAULT 1 NOT NULL,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "credit_balance" ADD CONSTRAINT "credit_balance_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "photo_job" ADD CONSTRAINT "photo_job_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "photo_job_user_idx" ON "photo_job" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "photo_job_status_idx" ON "photo_job" USING btree ("status");--> statement-breakpoint
CREATE INDEX "photo_job_tool_idx" ON "photo_job" USING btree ("tool");