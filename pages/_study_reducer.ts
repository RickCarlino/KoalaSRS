export type Quiz = {
  id: number;
  ko: string;
  en: string;
  repetitions: number;
  audio: {
    dictation: string;
    listening: string;
    speaking: string;
  };
};

type State = {
  numQuizzesAwaitingServerResponse: number;
  errors: string[];
  quizIDsForLesson: number[];
  phrasesById: Record<string, Quiz>;
};

type LessonType = keyof Quiz["audio"];

type QuizResult = "error" | "failure" | "success";

type Action =
  | { type: "WILL_GRADE"; id: number }
  | { type: "USER_GAVE_UP"; id: number }
  | { type: "FLAG_QUIZ"; id: number }
  | { type: "DID_GRADE"; id: number; result: QuizResult };

export type CurrentQuiz = {
  id: number;
  en: string;
  ko: string;
  quizAudio: string;
  lessonType: "dictation" | "speaking" | "listening";
  repetitions: number;
};

export function gotoNextQuiz(state: State, lastQuizID: number): State {
  const filter = (id: number) => id !== lastQuizID;
  const quizIDsForLesson = state.quizIDsForLesson.filter(filter);
  return { ...state, quizIDsForLesson };
}

export const newQuizState = (state: Partial<State> = {}): State => {
  const phrasesById = state.phrasesById || {};
  const remainingQuizIDs = Object.keys(phrasesById).map((x) => parseInt(x));
  return {
    numQuizzesAwaitingServerResponse: 0,
    phrasesById,
    quizIDsForLesson: remainingQuizIDs,
    errors: [],
    ...state,
  };
};

export function currentQuiz(state: State): CurrentQuiz | undefined {
  const quizID = state.quizIDsForLesson[0];
  const quiz = state.phrasesById[quizID];
  if (!quiz) {
    return undefined;
  }
  let lessonType: LessonType;
  // TODO: Calculating the lessonType on the frontend no longer
  // makes sense and is an artifact of a previous architecture.
  // In the future we should calculate this on the backend and only
  // send audio for the appropriate quiz.
  if (quiz.repetitions < 2) {
    lessonType = "dictation";
  } else {
    const nonce = quiz.id + quiz.repetitions;
    const x = nonce % 2;
    lessonType = x === 0 ? "listening" : "speaking";
  }
  return (
    quiz && {
      id: quiz.id,
      en: quiz.en,
      ko: quiz.ko,
      quizAudio: quiz.audio[lessonType],
      lessonType,
      repetitions: quiz.repetitions,
    }
  );
}

function reduce(state: State, action: Action): State {
  switch (action.type) {
    case "USER_GAVE_UP":
    case "FLAG_QUIZ":
      return gotoNextQuiz(state, action.id);
    case "WILL_GRADE":
      return {
        ...state,
        numQuizzesAwaitingServerResponse:
          state.numQuizzesAwaitingServerResponse + 1,
      };
    case "DID_GRADE":
      let numQuizzesAwaitingServerResponse =
        state.numQuizzesAwaitingServerResponse - 1;
      return gotoNextQuiz(
        {
          ...state,
          numQuizzesAwaitingServerResponse,
        },
        action.id,
      );
    default:
      console.warn("Unhandled action", action);
      return state;
  }
}

export function quizReducer(state: State, action: Action): State {
  const nextState = reduce(state, action);
  // Do debugging here:
  // console.log(action.type);
  return nextState;
}
