CREATE TABLE "build_skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"build_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	"rank" integer DEFAULT 1 NOT NULL,
	"slot" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "builds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(128) NOT NULL,
	"description" text,
	"class" text NOT NULL,
	"season" integer NOT NULL,
	"playstyle" text NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "characters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(64) NOT NULL,
	"class" text NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"season" integer NOT NULL,
	"is_hardcore" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"build_id" uuid NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(256) NOT NULL,
	"type" text NOT NULL,
	"class_restriction" text,
	"is_unique" boolean DEFAULT false NOT NULL,
	"is_mythic" boolean DEFAULT false NOT NULL,
	"description" text,
	"required_level" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "party_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"activity" text NOT NULL,
	"description" text,
	"min_level" integer DEFAULT 1 NOT NULL,
	"spots_total" integer DEFAULT 4 NOT NULL,
	"spots_filled" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(128) NOT NULL,
	"class" text NOT NULL,
	"description" text,
	"max_rank" integer DEFAULT 5 NOT NULL,
	"type" text NOT NULL,
	"icon_slug" varchar(128)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"battletag" varchar(64) NOT NULL,
	"email" varchar(256) NOT NULL,
	"password_hash" varchar(256) NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"avatar_url" varchar(512),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_battletag_unique" UNIQUE("battletag"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"build_id" uuid NOT NULL,
	"value" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "build_skills" ADD CONSTRAINT "build_skills_build_id_builds_id_fk" FOREIGN KEY ("build_id") REFERENCES "public"."builds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "build_skills" ADD CONSTRAINT "build_skills_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "builds" ADD CONSTRAINT "builds_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "characters" ADD CONSTRAINT "characters_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_build_id_builds_id_fk" FOREIGN KEY ("build_id") REFERENCES "public"."builds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "party_requests" ADD CONSTRAINT "party_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_build_id_builds_id_fk" FOREIGN KEY ("build_id") REFERENCES "public"."builds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "build_skills_build_idx" ON "build_skills" USING btree ("build_id");--> statement-breakpoint
CREATE INDEX "build_skills_skill_idx" ON "build_skills" USING btree ("skill_id");--> statement-breakpoint
CREATE INDEX "builds_class_season_idx" ON "builds" USING btree ("class","season");--> statement-breakpoint
CREATE INDEX "builds_user_idx" ON "builds" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "builds_featured_idx" ON "builds" USING btree ("is_featured");--> statement-breakpoint
CREATE INDEX "builds_created_at_idx" ON "builds" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "characters_user_idx" ON "characters" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "comments_build_idx" ON "comments" USING btree ("build_id");--> statement-breakpoint
CREATE INDEX "comments_user_idx" ON "comments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "items_type_idx" ON "items" USING btree ("type");--> statement-breakpoint
CREATE INDEX "items_class_restriction_idx" ON "items" USING btree ("class_restriction");--> statement-breakpoint
CREATE INDEX "party_requests_status_activity_idx" ON "party_requests" USING btree ("status","activity");--> statement-breakpoint
CREATE INDEX "party_requests_user_idx" ON "party_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "skills_class_idx" ON "skills" USING btree ("class");--> statement-breakpoint
CREATE UNIQUE INDEX "votes_user_build_unique" ON "votes" USING btree ("user_id","build_id");--> statement-breakpoint
CREATE INDEX "votes_build_idx" ON "votes" USING btree ("build_id");--> statement-breakpoint
CREATE INDEX "votes_user_idx" ON "votes" USING btree ("user_id");