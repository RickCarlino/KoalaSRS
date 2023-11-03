import { Button, Grid, Text, Container } from "@mantine/core";
import Link from "next/link";

export function linkToEditPage(id: number) {
  return <Link href={["cards", id].join("/")}>Edit Card</Link>;
}

export function QuizFailure(props: {
  id: number;
  term: string;
  definition: string;
  lessonType: string;
  userTranscription: string;
  rejectionText: string;
  onFlag: () => void;
  onDiscard?: () => void;
  onClose: () => void;
}) {
  const discardButton = props.onDiscard && (
    <Button onClick={props.onDiscard} color="red">
      Disagree
    </Button>
  );

  return (
    <Container size="xs">
      <Grid grow justify="center" align="center">
        <Grid.Col>
          <header
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "20px",
            }}
          >
            <h1 style={{ fontSize: "24px", fontWeight: "bold" }}>Incorrect</h1>
          </header>
          <Text>You answered the last question incorrectly.</Text>
          <Grid.Col>
            <Text>
              <strong>Quiz type:</strong> {props.lessonType}
            </Text>
            <Text>
              <strong>Term:</strong> {props.term}
            </Text>
            <Text>
              <strong>Definition:</strong> {props.definition}
            </Text>
            <Text>
              <strong>What you said:</strong> {props.userTranscription}
            </Text>
            <Text>
              <strong>Why it's wrong:</strong> {props.rejectionText}
            </Text>
            <Text>{linkToEditPage(props.id)}</Text>
            <Button color="green" onClick={props.onClose}>
              Continue
            </Button>
            <Button onClick={props.onFlag} color="yellow">
              Flag / Pause
            </Button>
            {discardButton}
          </Grid.Col>
        </Grid.Col>
      </Grid>
    </Container>
  );
}
