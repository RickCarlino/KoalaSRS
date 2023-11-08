import { prismaClient } from "@/server/prisma-client";
import { GetServerSidePropsContext } from "next";
import { getSession } from "next-auth/react";
import React from "react";

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getSession({ req: context.req });
  const userID =
    "" +
      (
        await prismaClient.user.findUnique({
          where: { email: session?.user?.email || "" },
        })
      )?.id || "";
  const transcripts = (
    await prismaClient.transcript.findMany({
      where: { card: { userId: userID } },
      orderBy: {
        recordedAt: "desc",
      },
      include: {
        card: true,
      },
    })
  ).map((t) => {
    return {
      id: t.id,
      grade: t.grade,
      value: t.value,
      card: {
        term: t.card.term,
      },
    };
  });
  // Pass the transcripts to the page via props
  return { props: { transcripts } };
}

type Transcript = {
  id: number;
  grade: number;
  value: string;
  card: {
    term: string;
  };
};

type Props = {
  transcripts: Transcript[];
};

const TranscriptsPage = ({ transcripts }: Props) => {
  return (
    <div>
      <h1>Transcripts</h1>
      <table>
        <thead>
          <tr>
            <th>Grade</th>
            <th>Phrase</th>
            <th>What You Said</th>
          </tr>
        </thead>
        <tbody>
          {transcripts.map((transcript) => (
            <tr key={transcript.id}>
              <td>{transcript.grade}</td>
              <td>{transcript.card.term}</td>
              <td>{transcript.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TranscriptsPage;
