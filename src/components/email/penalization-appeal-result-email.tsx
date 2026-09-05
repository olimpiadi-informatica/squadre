import type { CSSProperties } from "react";

import { Body, Container, Head, Html, Link, Markdown, Text } from "react-email";

export interface PenalizationAppealResultEmailProps {
  coach: string;
  teams: string;
  approved: boolean;
  detailsUrl: string;
  template: string;
}

export default function PenalizationAppealResultEmail({
  coach,
  teams,
  approved,
  detailsUrl,
  template,
}: PenalizationAppealResultEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Text style={paragraph}>Gentile {coach},</Text>
          <Text style={paragraph}>
            il ricorso relativo alla penalizzazione della squadra {teams} è stato{" "}
            {approved ? "accolto" : "rigettato"}.
          </Text>
          <Text style={paragraph}>
            {approved
              ? "La penalizzazione è stata annullata."
              : "La penalizzazione è stata convertita in codice rosso e la squadra è stata squalificata dal campionato in corso."}
          </Text>
          <Text style={paragraph}>
            I dettagli sono disponibili al seguente link:{" "}
            <Link href={detailsUrl}>{detailsUrl}</Link>
          </Text>
          <Markdown markdownCustomStyles={markdownStyles}>{template}</Markdown>
        </Container>
      </Body>
    </Html>
  );
}

const main: CSSProperties = {
  backgroundColor: "#ffffff",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container: CSSProperties = {
  margin: "0 auto",
  padding: "20px 0 48px",
  maxWidth: "600px",
};

const paragraph: CSSProperties = {
  fontSize: "16px",
  lineHeight: "26px",
  color: "#3c3f44",
};

const markdownStyles: Record<string, CSSProperties> = {
  p: paragraph,
  a: { color: "#067df7", textDecoration: "underline" },
};
