import { prismaClient } from "@/server/prisma-client";
import * as fs from "fs";
import * as readline from "readline";

async function ingest(ko: string, en: string) {
  const phrase = await prismaClient.phrase.findFirst({ where: { term: ko } });
  if (!phrase) {
    console.log(`Ingesting ${ko} => ${en}`);
    await prismaClient.phrase.create({
      data: {
        term: ko,
        definition: en,
      },
    });
  }
}

export function ingestPhrases() {
  const readInterface = readline.createInterface({
    input: fs.createReadStream("phrases.txt"),
    output: process.stdout,
  });

  let isFirstLine = true;

  readInterface.on("line", function (line) {
    if (isFirstLine) {
      isFirstLine = false;
      return;
    }

    let splitLine = line.split(",");
    ingest(splitLine[0], splitLine[1]);
  });
}