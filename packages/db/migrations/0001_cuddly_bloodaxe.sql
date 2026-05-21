CREATE TABLE "world_boss_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" varchar(64) NOT NULL,
	"boss_name" varchar(128) NOT NULL,
	"location" varchar(128) NOT NULL,
	"spawned_at" timestamp with time zone NOT NULL,
	"reported_by" varchar(128),
	"tier" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "world_boss_history_source_id_unique" UNIQUE("source_id")
);
--> statement-breakpoint
CREATE INDEX "wbh_spawned_at_idx" ON "world_boss_history" USING btree ("spawned_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "wbh_boss_name_idx" ON "world_boss_history" USING btree ("boss_name");