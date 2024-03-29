import { z } from "zod";
import { prismaClient } from "../prisma-client";
import { procedure } from "../trpc-procedure";
import { getUserSettings } from "../auth-helpers";
import { errorReport } from "@/koala/error-report";

export const deleteCard = procedure
  .input(
    z.object({
      id: z.optional(z.number()),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const userId = (await getUserSettings(ctx.user?.id)).user.id;

    const card = await prismaClient.card.findFirst({
      where: {
        id: input.id,
        userId,
      },
    });

    if (!card) {
      return errorReport("Card not found");
    }

    await prismaClient.quiz.deleteMany({
      where: {
        cardId: card.id,
      },
    });

    await prismaClient.card.delete({
      where: { id: card.id },
    });
  });
