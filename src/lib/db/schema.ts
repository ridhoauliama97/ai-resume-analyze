import { sql } from 'drizzle-orm';
import type { AiResult } from '@/lib/ai/schema';
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import type { Band } from '@/lib/types';

export const scoreBandEnum = pgEnum('score_band', ['red', 'yellow', 'green']);
export const jobLayerStatusEnum = pgEnum('job_layer_status', [
  'none',
  'complete',
  'inferred',
  'unavailable',
]);
export const recommendationLayerEnum = pgEnum('recommendation_layer', ['global', 'job']);
export const recommendationPriorityEnum = pgEnum('recommendation_priority', [
  'high',
  'medium',
  'low',
]);

export const clients = pgTable('clients', {
  id: uuid('id').primaryKey().defaultRandom(),
  tokenHash: text('token_hash').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).defaultNow().notNull(),
});

export const analyses = pgTable(
  'analyses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clientId: uuid('client_id')
      .notNull()
      .references(() => clients.id, { onDelete: 'cascade' }),
    fileName: text('file_name').notNull(),
    fileType: text('file_type').notNull(),
    fileSize: integer('file_size').notNull(),
    resumeText: text('resume_text').notNull(),
    resumeFileKey: text('resume_file_key'),
    targetPosition: text('target_position'),
    jobDescription: text('job_description'),
    marketContext: text('market_context'),
    jobLayerStatus: jobLayerStatusEnum('job_layer_status').notNull(),
    promptVersion: text('prompt_version').notNull(),
    model: text('model').notNull(),
    globalScore: integer('global_score').notNull(),
    jobScore: integer('job_score'),
    overallScore: integer('overall_score').notNull(),
    band: scoreBandEnum('band').$type<Band>().notNull(),
    datasetConsent: boolean('dataset_consent').notNull().default(false),
    consentVersion: text('consent_version').notNull(),
    consentedAt: timestamp('consented_at', { withTimezone: true }).notNull(),
    resultJson: jsonb('result_json').$type<AiResult>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('analyses_client_created_idx').on(table.clientId, table.createdAt.desc()),
    index('analyses_dataset_idx').on(table.datasetConsent, table.createdAt),
  ],
);

export const recommendations = pgTable(
  'recommendations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    analysisId: uuid('analysis_id')
      .notNull()
      .references(() => analyses.id, { onDelete: 'cascade' }),
    layer: recommendationLayerEnum('layer').notNull(),
    category: text('category').notNull(),
    priority: recommendationPriorityEnum('priority').notNull(),
    title: text('title').notNull(),
    detail: text('detail').notNull(),
    evidence: text('evidence').notNull(),
    example: text('example'),
    sortOrder: integer('sort_order').notNull(),
  },
  (table) => [index('recommendations_analysis_idx').on(table.analysisId, table.sortOrder)],
);

export const feedback = pgTable(
  'feedback',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    analysisId: uuid('analysis_id')
      .notNull()
      .references(() => analyses.id, { onDelete: 'cascade' }),
    recommendationId: uuid('recommendation_id').references(() => recommendations.id, {
      onDelete: 'cascade',
    }),
    rating: smallint('rating'),
    comment: text('comment'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('feedback_recommendation_idx').on(table.recommendationId),
    uniqueIndex('feedback_analysis_recommendation_unique').on(
      table.analysisId,
      table.recommendationId,
    ),
    check(
      'feedback_rating_value_check',
      sql`${table.rating} is null or ${table.rating} in (-1, 1)`,
    ),
    check(
      'feedback_content_check',
      sql`${table.rating} is not null or ${table.comment} is not null`,
    ),
  ],
);
