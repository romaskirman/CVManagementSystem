import { Prisma } from '@prisma/client';
import { prisma } from '../../config/db';

export class SearchRepository {
  async searchPositions(params: {
    query: string;
    skip: number;
    take: number;
  }) {
    const tsQuery = params.query
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .join(' & ');

    const items = await prisma.$queryRaw<Array<{
      id: string;
      title: string;
      shortDescription: string;
      visibilityMode: string;
      company: string | null;
      level: string | null;
      updatedAt: Date;
      rank: number;
      submittedCvCount: number;
    }>>(Prisma.sql`
      SELECT
        p.id,
        p.title,
        p."shortDescription",
        p."visibilityMode",
        p.company,
        p.level,
        p."updatedAt",
        ts_rank(
          to_tsvector('simple', coalesce(p.title, '') || ' ' || coalesce(p."shortDescription", '')),
          to_tsquery('simple', ${tsQuery})
        ) AS rank,
        (
          SELECT COUNT(*)
          FROM "Cv" cv
          WHERE cv."positionId" = p.id
        )::int AS "submittedCvCount"
      FROM "Position" p
      WHERE
        to_tsvector('simple', coalesce(p.title, '') || ' ' || coalesce(p."shortDescription", ''))
        @@ to_tsquery('simple', ${tsQuery})
        OR p.title ILIKE ${`%${params.query}%`}
        OR p."shortDescription" ILIKE ${`%${params.query}%`}
      ORDER BY rank DESC, p."updatedAt" DESC
      OFFSET ${params.skip}
      LIMIT ${params.take}
    `);

    const total = await prisma.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
      SELECT COUNT(*)::bigint AS count
      FROM "Position" p
      WHERE
        to_tsvector('simple', coalesce(p.title, '') || ' ' || coalesce(p."shortDescription", ''))
        @@ to_tsquery('simple', ${tsQuery})
        OR p.title ILIKE ${`%${params.query}%`}
        OR p."shortDescription" ILIKE ${`%${params.query}%`}
    `);

    return {
      items,
      total: Number(total[0]?.count ?? 0)
    };
  }

  async searchCvs(params: {
    query: string;
    skip: number;
    take: number;
  }) {
    const tsQuery = params.query
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .join(' & ');

    const items = await prisma.$queryRaw<Array<{
      id: string;
      status: string;
      publishedAt: Date | null;
      updatedAt: Date;
      positionId: string;
      positionTitle: string;
      candidateUserId: string;
      candidateEmail: string;
      likesCount: number;
      rank: number;
    }>>(Prisma.sql`
      SELECT
        cv.id,
        cv.status,
        cv."publishedAt",
        cv."updatedAt",
        p.id AS "positionId",
        p.title AS "positionTitle",
        u.id AS "candidateUserId",
        u.email AS "candidateEmail",
        (
          SELECT COUNT(*)
          FROM "CvLike" l
          WHERE l."cvId" = cv.id
        )::int AS "likesCount",
        ts_rank(
          to_tsvector(
            'simple',
            coalesce(p.title, '') || ' ' ||
            coalesce(u.email, '')
          ),
          to_tsquery('simple', ${tsQuery})
        ) AS rank
      FROM "Cv" cv
      INNER JOIN "Position" p ON p.id = cv."positionId"
      INNER JOIN "CandidateProfile" cp ON cp.id = cv."candidateProfileId"
      INNER JOIN "User" u ON u.id = cp."userId"
      WHERE
        to_tsvector(
          'simple',
          coalesce(p.title, '') || ' ' ||
          coalesce(u.email, '')
        ) @@ to_tsquery('simple', ${tsQuery})
        OR p.title ILIKE ${`%${params.query}%`}
        OR u.email ILIKE ${`%${params.query}%`}
      ORDER BY rank DESC, cv."updatedAt" DESC
      OFFSET ${params.skip}
      LIMIT ${params.take}
    `);

    const total = await prisma.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
      SELECT COUNT(*)::bigint AS count
      FROM "Cv" cv
      INNER JOIN "Position" p ON p.id = cv."positionId"
      INNER JOIN "CandidateProfile" cp ON cp.id = cv."candidateProfileId"
      INNER JOIN "User" u ON u.id = cp."userId"
      WHERE
        to_tsvector(
          'simple',
          coalesce(p.title, '') || ' ' ||
          coalesce(u.email, '')
        ) @@ to_tsquery('simple', ${tsQuery})
        OR p.title ILIKE ${`%${params.query}%`}
        OR u.email ILIKE ${`%${params.query}%`}
    `);

    return {
      items,
      total: Number(total[0]?.count ?? 0)
    };
  }

  async searchUsers(params: {
    query: string;
    skip: number;
    take: number;
  }) {
    const tsQuery = params.query
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .join(' & ');

    const items = await prisma.$queryRaw<Array<{
      id: string;
      email: string;
      isBlocked: boolean;
      createdAt: Date;
      rank: number;
    }>>(Prisma.sql`
      SELECT
        u.id,
        u.email,
        u."isBlocked",
        u."createdAt",
        ts_rank(
          to_tsvector('simple', coalesce(u.email, '')),
          to_tsquery('simple', ${tsQuery})
        ) AS rank
      FROM "User" u
      WHERE
        to_tsvector('simple', coalesce(u.email, '')) @@ to_tsquery('simple', ${tsQuery})
        OR u.email ILIKE ${`%${params.query}%`}
      ORDER BY rank DESC, u."createdAt" DESC
      OFFSET ${params.skip}
      LIMIT ${params.take}
    `);

    const total = await prisma.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
      SELECT COUNT(*)::bigint AS count
      FROM "User" u
      WHERE
        to_tsvector('simple', coalesce(u.email, '')) @@ to_tsquery('simple', ${tsQuery})
        OR u.email ILIKE ${`%${params.query}%`}
    `);

    return {
      items,
      total: Number(total[0]?.count ?? 0)
    };
  }
}
