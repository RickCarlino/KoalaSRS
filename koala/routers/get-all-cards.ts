import { z } from "zod";
import { prismaClient } from "../prisma-client";
import { procedure } from "../trpc-procedure";

export const getAllCards = procedure
  .input(z.object({}))
  .output(
    z.array(
      z.object({
        id: z.number(),
        flagged: z.boolean(),
        term: z.string(),
        definition: z.string(),
      }),
    ),
  )
  .query(async ({ ctx }) => {
    return await prismaClient.card.findMany({
      where: { userId: ctx.user?.id || "000" },
      // ORDER BY ease ASC, lapses DESC;
      // Hardest cards first
      orderBy: [{ flagged: "desc" }, { createdAt: "asc" }],
    });
  });
