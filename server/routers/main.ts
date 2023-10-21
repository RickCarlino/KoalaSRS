import { prismaClient } from "@/server/prisma-client";
import { z } from "zod";
import { procedure, router } from "../trpc";
import { getNextQuiz, getNextQuizzes } from "./get-next-quizzes";
import { failPhrase, performExam } from "./perform-exam";

async function ingestOne(ko: string, en: string, rootWord: string | undefined) {
  // Find phrase where `rootWord` or `ko` matches
  const phrase = await prismaClient.phrase.findFirst({
    where: {
      term: ko,
    },
  });
  if (!phrase) {
    return await prismaClient.phrase.create({
      data: {
        term: ko,
        definition: en,
        root_word: rootWord || "",
      },
    });
  } else {
    console.log(`(already exists) ${ko} => ${en} `);
    return phrase;
  }
}

export const appRouter = router({
  /** The `faucet` route is a mutation that returns a "Hello, world" string
   * and takes an empty object as its only argument. */
  faucet: procedure
    .input(z.object({}))
    .output(z.object({ message: z.string() }))
    .mutation(async () => {
      return { message: '[]' };
    }),
  importPhrases: procedure
    .input(
      z.object({
        input: z.array(
          z.object({
            korean: z.string(),
            english: z.string(),
            rootWord: z.optional(z.string()),
          }),
        ),
      }),
    )
    .output(
      z.array(
        z.object({
          ko: z.string(),
          en: z.string(),
        }),
      ),
    )
    .mutation(async ({ input, ctx }) => {
      const results: { ko: string; en: string }[] = [];
      for (const { korean, english, rootWord } of input.input) {
        const userId = ctx.user?.id;
        if (userId) {
          const phrase = await ingestOne(korean, english, rootWord);
          if (phrase) {
            const alreadyExists = await prismaClient.card.findFirst({
              where: { userId, phraseId: phrase.id },
            });
            if (!alreadyExists) {
              await prismaClient.card.create({
                data: {
                  userId,
                  phraseId: phrase.id,
                },
              });
              results.push({
                ko: phrase.term,
                en: phrase.definition,
              });
            } else {
              const ERR = "(Duplicate) ";
              results.push({
                ko: ERR + korean,
                en: ERR + english,
              });
            }
          }
        }
      }
      return results;
    }),
  getAllPhrases: procedure
    .input(z.object({}))
    .output(
      z.array(
        z.object({
          id: z.number(),
          flagged: z.boolean(),
          phrase: z.object({
            id: z.number(),
            term: z.string(),
            definition: z.string(),
          }),
        }),
      ),
    )
    .query(async ({ ctx }) => {
      return await prismaClient.card.findMany({
        include: { phrase: true },
        where: { userId: ctx.user?.id || "000" },
        orderBy: { nextReviewAt: "asc" },
      });
    }),
  deleteCard: procedure
    .input(
      z.object({
        id: z.optional(z.number()),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new Error("User not found");
      }

      const card = await prismaClient.card.findFirst({
        where: {
          id: input.id,
          userId,
        },
      });

      if (!card) {
        throw new Error("Card not found");
      }

      await prismaClient.card.delete({
        where: { id: card.id },
      });
    }),
  editCard: procedure
    .input(
      z.object({
        id: z.optional(z.number()),
        en: z.optional(z.string()),
        ko: z.optional(z.string()),
        flagged: z.optional(z.boolean()),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new Error("User not found");
      }

      const card = await prismaClient.card.findFirst({
        where: {
          id: input.id,
          userId,
          flagged: false,
        },
      });

      if (!card) {
        throw new Error("Card not found");
      }

      await prismaClient.card.update({
        where: { id: card.id },
        data: {
          flagged: input.flagged ?? false,
        },
      });
    }),
  getOneCard: procedure
    .input(
      z.object({
        id: z.number(),
      }),
    )
    .output(
      z.object({
        id: z.number(),
        en: z.string(),
        ko: z.string(),
        flagged: z.boolean(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const card = await prismaClient.card.findFirst({
        where: {
          id: input.id,
          userId: ctx.user?.id || "000",
        },
      });
      if (!card) {
        throw new Error("Card not found");
      }
      const phrase = await prismaClient.phrase.findFirst({
        where: { id: card.phraseId },
      });
      if (!phrase) {
        throw new Error("Phrase not found");
      }
      return {
        ...card,
        en: phrase.definition,
        ko: phrase.term,
      };
    }),
  flagPhrase: procedure
    .input(
      z.object({
        id: z.number(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const card = await prismaClient.card.findFirst({
        where: {
          id: input.id,
          userId: ctx.user?.id || "0",
        },
      });
      if (card) {
        await prismaClient.card.update({
          where: { id: card.id },
          data: {
            flagged: true,
          },
        });
      }
    }),
  getNextQuizzes,
  getNextQuiz,
  failPhrase,
  performExam,
});

export type AppRouter = typeof appRouter;
