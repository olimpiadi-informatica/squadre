import type { CSSProperties } from "react";

import { Body, Container, Head, Html, Link, Markdown, Text } from "react-email";

import type { PenalizationLevel, PenalizationType } from "~/lib/db/schema";

export type PenalizationEmailRow = {
  teams: string;
  type: PenalizationType;
  level: PenalizationLevel;
  description: string;
};

export interface PenalizationEmailProps {
  coach: string;
  penalizations: PenalizationEmailRow[];
  detailsUrl: string;
  template: string;
}

const levelLabel: Record<PenalizationLevel, string> = {
  yellow: "Giallo",
  red: "Rosso",
};

const typeLabel: Record<PenalizationType, string> = {
  "screen-recording": "Screen recording",
  "internet-check": "Internet",
  plagiarism: "Copiatura",
  ai: "Uso di strumenti AI",
  other: "Violazione del codice d'onore",
};

export default function PenalizationEmail({
  coach,
  penalizations,
  detailsUrl,
  template,
}: PenalizationEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Text style={paragraph}>Gentile {coach},</Text>
          <Text style={paragraph}>
            durante i controlli post-gara, sono state rilevate le seguenti infrazioni:
          </Text>

          <table style={tableContainer}>
            <thead>
              <tr>
                <th style={tableHeader}>Team</th>
                <th style={tableHeader}>Tipo</th>
                <th style={tableHeader}>Livello</th>
                <th style={tableHeader}>Descrizione</th>
              </tr>
            </thead>
            <tbody>
              {penalizations.map((p, idx) => (
                <tr key={idx}>
                  <td style={tableCell}>{p.teams}</td>
                  <td style={tableCell}>{typeLabel[p.type]}</td>
                  <td style={tableCell}>{levelLabel[p.level]}</td>
                  <td style={tableCell}>{p.description}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <Text style={paragraph}>
            È possibile accedere ai dettagli al seguente link:{" "}
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

const listItem: CSSProperties = {
  fontSize: "16px",
  lineHeight: "26px",
  color: "#3c3f44",
  marginBottom: "8px",
};

const markdownStyles: Record<string, CSSProperties> = {
  p: paragraph,
  h2: {
    fontSize: "20px",
    fontWeight: "bold",
    lineHeight: "26px",
    color: "#3c3f44",
    marginTop: "32px",
  },
  ul: {
    marginTop: "16px",
    marginBottom: "16px",
  },
  ol: {
    marginTop: "16px",
    marginBottom: "16px",
  },
  li: listItem,
  a: {
    color: "#067df7",
    textDecoration: "underline",
  },
};

const tableContainer: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse" as const,
  marginTop: "24px",
  marginBottom: "24px",
};

const tableHeader: CSSProperties = {
  border: "1px solid #e6ebf1",
  padding: "8px",
  fontWeight: "bold",
  textAlign: "left" as const,
  color: "#3c3f44",
};

const tableCell: CSSProperties = {
  border: "1px solid #e6ebf1",
  padding: "8px",
  color: "#3c3f44",
};
