CREATE TABLE "feedback" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"category" text DEFAULT 'suggestion' NOT NULL,
	"content" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "showcase_case" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"photo_job_id" text,
	"title" text NOT NULL,
	"description" text,
	"image_url" text NOT NULL,
	"tool" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "showcase_comment" (
	"id" text PRIMARY KEY NOT NULL,
	"case_id" text NOT NULL,
	"user_id" text,
	"content" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "showcase_case" ADD CONSTRAINT "showcase_case_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "showcase_case" ADD CONSTRAINT "showcase_case_photo_job_id_photo_job_id_fk" FOREIGN KEY ("photo_job_id") REFERENCES "public"."photo_job"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "showcase_comment" ADD CONSTRAINT "showcase_comment_case_id_showcase_case_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."showcase_case"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "showcase_comment" ADD CONSTRAINT "showcase_comment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "feedback_user_idx" ON "feedback" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "feedback_status_idx" ON "feedback" USING btree ("status");--> statement-breakpoint
CREATE INDEX "showcase_case_user_idx" ON "showcase_case" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "showcase_case_status_idx" ON "showcase_case" USING btree ("status");--> statement-breakpoint
CREATE INDEX "showcase_comment_case_idx" ON "showcase_comment" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "showcase_comment_status_idx" ON "showcase_comment" USING btree ("status");