import type { CSSProperties } from "react";

import { Body, Container, Head, Html, Link, Markdown, Text } from "@react-email/components";

import type { TeamCredential } from "~/lib/team";

export interface PasswordEmailProps {
  coach: string;
  roundName: string;
  editionYear: string;
  teams: TeamCredential[];
  startTime: string;
  credentialsPdfUrl: string;
  template: string;
}

export default function PasswordEmail({
  coach,
  roundName,
  editionYear,
  teams,
  startTime,
  credentialsPdfUrl,
  template,
}: PasswordEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Text style={paragraph}>Gentile {coach},</Text>
          <Text style={paragraph}>
            le comunichiamo le password delle squadre per le quali lei è referente.
          </Text>
          <Text style={paragraph}>
            Tali password sono valide esclusivamente per {roundName} delle Olimpiadi di Informatica
            a Squadre, edizione {editionYear}.
          </Text>
          <Text style={paragraph}>
            Ricordiamo che le seguenti password vanno{" "}
            <strong>consegnate individualmente alle squadre</strong>. Non vanno quindi semplicemente
            inoltrate via mail (o copiate e incollate tutte insieme). Ogni team dovrà ricevere{" "}
            <strong>solo la propria password</strong>.
          </Text>

          <table style={tableContainer}>
            <thead>
              <tr>
                <th style={tableHeader}>Nome squadra</th>
                <th style={tableHeader}>Username</th>
                <th style={tableHeader}>Password</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team, idx) => (
                <tr key={idx}>
                  <td style={tableCell}>
                    <code>{team.name}</code>
                    {team.junior && " (Esordienti)"}
                  </td>
                  <td style={tableCell}>
                    <code>{team.slug}</code>
                  </td>
                  <td style={tableCell}>
                    <code>{team.password}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <Text style={paragraph}>
            È possibile scaricare le credenziali al seguente link:{" "}
            <Link href={credentialsPdfUrl}>{credentialsPdfUrl}</Link>
          </Text>

          <Text style={paragraph}>
            <strong>Attenzione</strong>: al fine di distribuire il carico sui server durante
            l'inizio della gara a ogni scuola è stato assegnato un orario di inizio casuale. Le 3
            ore di gara della sua scuola iniziano alle ore <strong>{startTime}</strong>. L'orario di
            inizio varia di gara in gara.
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
