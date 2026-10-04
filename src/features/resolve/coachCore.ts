import { taskById } from "../plan/content.ts";
import type { TaskId } from "../plan/content.ts";
export type CoachInput = {
  taskId: TaskId;
  question: string;
  locale: "en" | "pl";
};
export type CoachAnswer = {
  explanation: string;
  nextStep: string;
  why: string;
  checkQuestion: string;
  sourceIds: TaskId[];
};
export type CoachEvent = {
  stage: "reading" | "tool" | "checking" | "ready" | "error";
  tool?: string;
  guide?: TaskId;
  answer?: CoachAnswer;
};
export function coachInput(raw: unknown): CoachInput {
  if (!raw || typeof raw !== "object") throw new Error("input");
  const i = raw as CoachInput;
  if (
    !Object.hasOwn(taskById, i.taskId) ||
    typeof i.question !== "string" ||
    i.question.trim().length < 5 ||
    i.question.length > 500 ||
    !["en", "pl"].includes(i.locale)
  )
    throw new Error("input");
  if (
    /(?:password|passcode|api key|hasło|haslo|kod dostępu|klucz api)\s*(?:is|to|:|=)\s*\S+|\bsk-[a-z0-9-]+|https?:|\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b|(?:\+?\d[\d ()-]{7,}\d)/i.test(
      i.question,
    )
  )
    throw new Error("personal");
  return { taskId: i.taskId, question: i.question.trim(), locale: i.locale };
}
export function coachAnswer(raw: unknown, read: TaskId[]): CoachAnswer {
  if (!raw || typeof raw !== "object") throw new Error("output");
  const a = raw as CoachAnswer;
  for (const key of [
    "explanation",
    "nextStep",
    "why",
    "checkQuestion",
  ] as const)
    if (
      typeof a[key] !== "string" ||
      !a[key].trim() ||
      a[key].length > 900 ||
      /https?:\/\//i.test(a[key])
    )
      throw new Error("output");
  if (
    /(?:guaranteed safe|completely safe|definitely safe|100% safe|you are safe|risk score|twoje konto jest bezpieczne|jesteś bezpieczn)/i.test(
      [a.explanation, a.nextStep, a.why, a.checkQuestion].join(" "),
    )
  )
    throw new Error("scope");
  if (
    !Array.isArray(a.sourceIds) ||
    !a.sourceIds.length ||
    a.sourceIds.some((id) => !read.includes(id))
  )
    throw new Error("output");
  return a;
}
