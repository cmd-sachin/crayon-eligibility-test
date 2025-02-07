import { createGoogleGenerativeAI } from "@ai-sdk/google";
import systemPrompt from "../../prompts/phase-1.js";
import { generateObject } from "ai";
import { z } from "zod";

const google = createGoogleGenerativeAI({
  apiKey: "AIzaSyAGTGNA2-mYa8nqSHLnL3IZnfsqaAMU_v4",
});

export async function POST(req) {
  const { messages, questionNumber, questions } = await req.json();

  const questionSchema = z.object({
    questionNumber: z.number(),
    question: z.string(),
    codeSnippet: z.string().optional(),
    options: z.array(z.string()).optional(),
    feedbackForPreviousQuestion: z.string(),
  });

  const finalResultSchema = z.object({
    feedbackForPreviousQuestion: z.string(),
    score: z.string(),
    category: z.string(),
    areasToImprove: z.string(),
    feedbackAboutStudent: z.string(),
    Task: z.string().optional(),
  });

  let schema = questionSchema;
  if (questionNumber === 35) {
    schema = finalResultSchema;
  }

  let result = await generateObject({
    model: google("gemini-2.0-flash-exp"),
    system: systemPrompt,
    messages: messages,
    schema: schema,
    temperature: 1,
  });

  console.log(questions);
  console.log(result.object);

  if (questions.includes(result.object.question) === true) {
    result = await generateObject({
      model: google("gemini-2.0-flash-exp"),
      system: systemPrompt,
      messages: messages,
      prompt: `Question : ${result.object.question} already generated , generate a different question which is not is messages array `,
      schema: schema,
      temperature: 1,
    });
  }

  return new Response(JSON.stringify({ result: result.object }), {
    headers: { "Content-Type": "application/json" },
  });
}
