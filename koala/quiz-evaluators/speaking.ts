import { YesOrNo, yesOrNo } from "@/koala/openai";
import { QuizEvaluator } from "./types";
import { template } from "radash";
import { FOOTER, strip } from "./evaluator-utils";

const GRAMMAR_PROMPT =
  `Grade a sentence (spoken via speech-to-text) from a
language learning app. Answer YES if the sentence is
grammatically correct and in the specified language
(ISO 639-1:2002 code '{{langCode}}'). Answer NO if it doesn't
follow the language's syntax and semantics or isn't in the
specified language. Avoid vague responses. Incomplete
sentences are OK if they are grammatically correct. Do not
grade spacing. You will be penalized for vague "NO" responses.` + FOOTER;

const MEANING_PROMPT =
  `
Sentence B: "{{term}}" ({{langCode}})
Sentence C: "{{definition}}" (EN)

When translated, is sentence A equivalent to sentence B and C?
The meaning is more important than the words used.
If "NO", why not?
Punctuation and spacing do not matter for the sake of this question.
` + FOOTER;

const gradeGrammar = async (
  userInput: string,
  term: string,
  definition: string,
  langCode: string,
  userID: string,
): Promise<YesOrNo> => {
  const tplData = {
    term,
    definition,
    langCode,
  };
  const question = template(GRAMMAR_PROMPT, tplData);
  const grammarYN = await yesOrNo({
    userInput,
    question,
    userID,
  });
  if (grammarYN.response === "no") {
    return grammarYN;
  }

  const meaningYn = await yesOrNo({
    userInput: `Sentence A: ${userInput} (${langCode})`,
    question: template(MEANING_PROMPT, tplData),
    userID,
  });

  return meaningYn;
};

export const speaking: QuizEvaluator = async ({ userInput, card, userID }) => {
  if (strip(userInput) === strip(card.term)) {
    console.log(`=== Exact match!`);
    return {
      result: "pass",
      userMessage: "Exact match. Nice work!",
    };
  }

  const result = await gradeGrammar(
    userInput,
    card.term,
    card.definition,
    card.langCode,
    userID,
  );
  if (result.response === "no") {
    return {
      result: "fail",
      userMessage: result.whyNot || "No reason provided.",
    };
  }
  return {
    result: "pass",
    userMessage: result.whyNot || "Passed!",
  };
};
