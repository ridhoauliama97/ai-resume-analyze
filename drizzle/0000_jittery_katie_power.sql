CREATE TYPE "public"."job_layer_status" AS ENUM('none', 'complete', 'inferred', 'unavailable');--> statement-breakpoint
CREATE TYPE "public"."recommendation_layer" AS ENUM('global', 'job');--> statement-breakpoint
CREATE TYPE "public"."recommendation_priority" AS ENUM('high', 'medium', 'low');--> statement-breakpoint
CREATE TYPE "public"."score_band" AS ENUM('red', 'yellow', 'green');--> statement-breakpoint
CREATE TABLE "analyses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"file_name" text NOT NULL,
	"file_type" text NOT NULL,
	"file_size" integer NOT NULL,
	"resume_text" text NOT NULL,
	"target_position" text,
	"job_description" text,
	"market_context" text,
	"job_layer_status" "job_layer_status" NOT NULL,
	"prompt_version" text NOT NULL,
	"model" text NOT NULL,
	"global_score" integer NOT NULL,
	"job_score" integer,
	"overall_score" integer NOT NULL,
	"band" "score_band" NOT NULL,
	"dataset_consent" boolean DEFAULT false NOT NULL,
	"consent_version" text NOT NULL,
	"consented_at" timestamp with time zone NOT NULL,
	"result_json" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "clients_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"analysis_id" uuid NOT NULL,
	"recommendation_id" uuid,
	"rating" smallint,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "feedback_rating_value_check" CHECK ("feedback"."rating" is null or "feedback"."rating" in (-1, 1)),
	CONSTRAINT "feedback_content_check" CHECK ("feedback"."rating" is not null or "feedback"."comment" is not null)
);
--> statement-breakpoint
CREATE TABLE "recommendations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"analysis_id" uuid NOT NULL,
	"layer" "recommendation_layer" NOT NULL,
	"category" text NOT NULL,
	"priority" "recommendation_priority" NOT NULL,
	"title" text NOT NULL,
	"detail" text NOT NULL,
	"evidence" text NOT NULL,
	"example" text,
	"sort_order" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "analyses" ADD CONSTRAINT "analyses_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_analysis_id_analyses_id_fk" FOREIGN KEY ("analysis_id") REFERENCES "public"."analyses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_recommendation_id_recommendations_id_fk" FOREIGN KEY ("recommendation_id") REFERENCES "public"."recommendations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_analysis_id_analyses_id_fk" FOREIGN KEY ("analysis_id") REFERENCES "public"."analyses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "analyses_client_created_idx" ON "analyses" USING btree ("client_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "analyses_dataset_idx" ON "analyses" USING btree ("dataset_consent","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "feedback_analysis_recommendation_unique" ON "feedback" USING btree ("analysis_id","recommendation_id");--> statement-breakpoint
CREATE INDEX "recommendations_analysis_idx" ON "recommendations" USING btree ("analysis_id","sort_order");