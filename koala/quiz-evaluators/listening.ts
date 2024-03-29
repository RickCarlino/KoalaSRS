import { template } from "radash";
import { QuizEvaluator } from "./types";
import { yesOrNo } from "@/koala/openai";
import { FOOTER, strip } from "./evaluator-utils";

const PROMPT =
  `
Sentence B: "{{term}}" ({{langCode}})
Sentence C: "{{definition}}" (EN)

When translated, is sentence A equivalent in meaning to sentence B and C?
The meaning is more important than the words used.
Punctuation and spacing do not matter for the sake of this question.
If "NO", why not?
` + FOOTER;
export const listening: QuizEvaluator = async (ctx) => {
  const { userInput, card } = ctx;
  const { term, definition, langCode } = card;
  const tplData = { term, definition, langCode };
  const question = template(PROMPT, tplData);

  if (strip(userInput) === strip(definition)) {
    console.log(`=== Exact match!`);
    return {
      result: "pass",
      userMessage: "Exact match. Nice work!",
    };
  }

  const listeningYN = await yesOrNo({
    userInput: `Sentence A: ${userInput} (EN)`,
    question,
    userID: ctx.userID,
  });

  if (listeningYN.response === "no") {
    return {
      result: "fail",
      userMessage: listeningYN.response,
    };
  }

  return {
    result: "pass",
    userMessage: "You passed the listening quiz!",
  };
};
