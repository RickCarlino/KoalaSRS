import { useVoiceRecorder } from "@/hooks/use-recorder";
import { Button } from "@mantine/core";
import { useHotkeys } from "@mantine/hooks";

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, _) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}
type Props = {
  onRecord: (data: string) => void;
  quizType: string;
};
export function RecordButton(props: Props) {
  const { isRecording, stop, start } = useVoiceRecorder(async (data) => {
    props.onRecord(await blobToBase64(data));
  });
  useHotkeys([
    ['z', () => {
      (isRecording ? stop : start)();
    }],
  ])
  let buttonText = "Record";
  switch(props.quizType) {
    case "dictation":
      buttonText = "Say it in Korean";
      break;
    case "listening":
      buttonText = "Translate to English";
      break;
    case "speaking":
      buttonText = "Translate to Korean?";
      break;
  }
  return isRecording ? (
    <Button onClick={stop} color="red">⏹️Submit Answer</Button>
  ) : (
    <Button onClick={start}>⏺️{buttonText} (Z)</Button>
  );
}
