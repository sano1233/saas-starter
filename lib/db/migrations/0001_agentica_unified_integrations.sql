CREATE TABLE IF NOT EXISTS "integration_keys" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"agentica_api_key" text,
	"agentica_deep_coder_api_key" text,
	"code_rabbit_api" text,
	"cognitive_computations_dolphin_mistral_api_key" text,
	"eleven_labs_api_key" text,
	"gemini_api_key" text,
	"github_api_key" text,
	"glm_45_api_key" text,
	"grok_x_api_key" text,
	"hermes_llama_api_key" text,
	"kimi_dev_moonshot_api_key" text,
	"microsoft_ai_coder_api_key" text,
	"minimax_api_key" text,
	"mistral_ai_api_key" text,
	"mistral_ai_dev_strall_api_key" text,
	"nvidia_nematron_nano_api_key" text,
	"qwen_25_coder_32_instruct_api_key" text,
	"qwen_api_key" text,
	"qwen3_coder_api_key" text,
	"tng_tech_deep_seek_api_key" text,
	"x_api_key" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "integration_keys_team_id_unique" UNIQUE("team_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "integration_keys" ADD CONSTRAINT "integration_keys_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
INSERT INTO "integration_keys" ("team_id")
SELECT "id" FROM "teams"
ON CONFLICT ("team_id") DO NOTHING;
