CREATE TABLE "user" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "user_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"prompt" text,
	"character1_Name" text,
	"character2_Name" text,
	"hattle_data" jsonb NOT NULL
);
