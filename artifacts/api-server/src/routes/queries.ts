/**
 * Queries REST API — general open-ended queries raised during a conversation.
 *
 * GET /queries                      — list all queries
 * GET /contacts/:id/queries         — list queries for a contact
 * GET /conversations/:id/queries    — list queries for a conversation
 * POST /queries                     — create a query
 * PATCH /queries/:id/answer         — answer a query
 * PATCH /queries/:id                — dismiss/edit a query
 */

import { makeQueryLikeRouter } from "../services/queryLike";

export default makeQueryLikeRouter({
  basePath: "queries",
  isKnowledgeGap: false,
});