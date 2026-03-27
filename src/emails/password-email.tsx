import type { CSSProperties } from "react";

import {
  Body,
  Column,
  Container,
  Head,
  Html,
  Link,
  Row,
  Section,
  Text,
} from "@react-email/components";

import type { TeamCredential } from "~/lib/team";

export interface PasswordEmailProps {
  coach: string;
  roundName: string;
  editionName: string;
  teams: TeamCredential[];
  startTime: string;
}

export default function PasswordEmail({
  coach,
  roundName,
  editionName,
  teams,
  startTime,
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
            Tali password sono valide esclusivamente per la {roundName} delle Olimpiadi di
            Informatica a Squadre, edizione {editionName}.
          </Text>
          <Text style={paragraph}>
            Ricordiamo che le seguenti password vanno{" "}
            <strong>consegnate individualmente alle squadre</strong>. Non vanno quindi semplicemente
            inoltrate via mail (o copiate e incollate tutte insieme). Ogni team dovrà ricevere{" "}
            <strong>solo la propria password</strong>.
          </Text>

          <Section style={tableContainer}>
            <Row>
              <Column style={tableHeader}>Nome squadra</Column>
              <Column style={tableHeader}>Username</Column>
              <Column style={tableHeader}>Password</Column>
            </Row>
            {teams.map((team, idx) => (
              <Row key={idx}>
                <Column style={tableCell}>
                  <code>{team.name}</code>
                  {team.junior && " (Esordienti)"}
                </Column>
                <Column style={tableCell}>
                  <code>{team.teamId}</code>
                </Column>
                <Column style={tableCell}>
                  <code>{team.password}</code>
                </Column>
              </Row>
            ))}
          </Section>

          <Text style={paragraph}>
            <strong>Attenzione</strong>: al fine di distribuire il carico sui server durante
            l'inizio della gara a ogni scuola è stato assegnato un orario di inizio casuale. Le 3
            ore di gara della sua scuola iniziano alle ore <strong>{startTime}</strong>. L'orario di
            inizio varia di gara in gara.
          </Text>

          <Text style={paragraph}>
            Se alcune delle squadre per le quali lei è referente non sono presenti nell'elenco, la
            preghiamo di contattare l'organizzazione OIS all'indirizzo email{" "}
            <Link href="mailto:ois@aldini.istruzioneer.it">ois@aldini.istruzioneer.it</Link>.
          </Text>

          <Text style={heading}>Avvisi importanti:</Text>
          <ul style={list}>
            <li style={listItem}>
              Il controllo di regolarità è stato integrato all'interno del sito di gara, che le
              squadre dovranno tenere aperto per{" "}
              <strong>tutta la durata della gara su ognuno dei massimo 2 PC di gara.</strong> Il
              sito vi chiederà di condividere l'<strong>intero schermo</strong>, e poi controllerà
              in tempo reale lo stato del blocco internet e del numero di connessioni, mostrandovene
              il risultato tramite iconcine in basso a destra (le istruzioni per bloccare internet
              possono essere trovate{" "}
              <Link href="https://squadre.olinfo.it/resources/guida.pdf">qui</Link>). La
              condivisione dello schermo non è obbligatoria ma fortemente consigliata per evitare
              contestazioni. Ricordiamo che invece avere il controllo del blocco internet attivo è
              obbligatorio.
            </li>
            <li style={listItem}>
              Per problemi tecnici durante la gara potete rivolgervi allo staff tecnico sul gruppo
              telegram "OIS supporto tecnico". In ogni caso, ogni problema tecnico che comporti la
              violazione del controllo internet va sempre segnalato tempestivamente anche
              all'organizzazione OIS all'indirizzo mail{" "}
              <Link href="mailto:ois@aldini.istruzioneer.it">ois@aldini.istruzioneer.it</Link>,
              affinché al termine della gara possa essere valutato.
            </li>
            <li style={listItem}>
              Verranno forniti template per ogni problema in C, C++ e Python; Java, Pascal e C#
              invece potrebbero avere un template generico (con lettura e scrittura dei dati non
              specifica al problema da risolvere). Altri linguaggi non sono supportati.
            </li>
            <li style={listItem}>
              Come al solito <strong>non</strong> garantiamo che sia possibile, usando Python,
              risolvere completamente (ovvero prendere il massimo dei punti per) un dato problema.
            </li>
            <li style={listItem}>
              La piattaforma di gara ufficiale sarà disponibile poco prima dell'inizio della stessa
              all'indirizzo{" "}
              <Link href="https://gara.squadre.olinfo.it/">https://gara.squadre.olinfo.it</Link>. La
              relativa classifica live sarà disponibile all'indirizzo{" "}
              <Link href="https://gara.squadre.olinfo.it/ranking/">
                https://gara.squadre.olinfo.it/ranking
              </Link>
              .
            </li>
            <li style={listItem}>
              La piattaforma di gara per esordienti sarà disponibile all'indirizzo{" "}
              <Link href="https://gara.squadre.olinfo.it/esordienti/">
                https://gara.squadre.olinfo.it/esordienti
              </Link>
              . La relativa classifica live sarà disponibile all'indirizzo{" "}
              <Link href="https://gara.squadre.olinfo.it/esordienti/ranking/">
                https://gara.squadre.olinfo.it/esordienti/ranking
              </Link>
              .
            </li>
            <li style={listItem}>
              Ricordiamo che anche quest'anno i problemi saranno in inglese e in ordine alfabetico
              (non in ordine di difficoltà). La preghiamo inoltre di ricordare ai suoi studenti di
              leggere tutti gli <i>Announcements</i> che saranno disponibili sulla piattaforma di
              gara già prima dell'inizio della competizione stessa, in modo da consentire loro una
              competizione equa con gli altri partecipanti.
            </li>
            <li style={listItem}>
              Inoltre, i problemi indicheranno il "livello di syllabus", riportato in forma grafica
              nel testo di ciascun problema per indicare la quantità di conoscenze richieste per
              risolvere un determinato subtask. Il PDF con il syllabus di riferimento si può trovare
              all'indirizzo{" "}
              <Link href="https://gara.squadre.olinfo.it/resources/syllabus.pdf">
                https://gara.squadre.olinfo.it/resources/syllabus.pdf
              </Link>
              .
            </li>
            <li style={listItem}>
              Per accedere ai testi dei problemi, oppure per far partecipare squadre non ufficiali
              di riserve, si può accedere alla gara non ufficiale. Durante la practice è disponibile
              direttamente all'indirizzo{" "}
              <Link href="https://mirror.squadre.olinfo.it/">https://mirror.squadre.olinfo.it</Link>
              , mentre durante i round sarà disponibile in anteprima tramite un link speciale
              protetto da autenticazione:
              <ul style={subList}>
                <li style={listItem}>
                  <b> Indirizzo gara non ufficiale: </b>{" "}
                  <Link href="https://mirror.squadre.olinfo.it/preview/">
                    https://mirror.squadre.olinfo.it/preview/
                  </Link>
                </li>
                <li style={listItem}>
                  <b> Username: </b> <code>ois</code>
                </li>
                <li style={listItem}>
                  <b> Password: </b> <code>natererai</code>
                </li>
              </ul>
              Una volta eseguita l'autenticazione, può procedere con la normale registrazione di un
              account e il login alla piattaforma di gara non ufficiale.
            </li>
            <li style={listItem}>
              Con le stesse modalità sarà disponibile anche una mirror della gara per esordienti,
              all'indirizzo{" "}
              <Link href="https://mirror-esordienti.squadre.olinfo.it/">
                https://mirror-esordienti.squadre.olinfo.it
              </Link>
              .
            </li>
          </ul>

          <Text style={paragraph}>
            Buona gara alle sue studentesse e ai suoi studenti!
            <br />
            Staff OIS
          </Text>
          <Text style={ps}>
            <b>P.S.</b> questa mail è stata generata automaticamente, non rispondere a questo
            indirizzo.
          </Text>
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

const heading: CSSProperties = {
  fontSize: "20px",
  fontWeight: "bold",
  lineHeight: "26px",
  color: "#3c3f44",
  marginTop: "32px",
};

const list: CSSProperties = {
  marginTop: "16px",
  marginBottom: "16px",
};

const subList: CSSProperties = {
  marginTop: "8px",
  marginBottom: "8px",
};

const listItem: CSSProperties = {
  fontSize: "16px",
  lineHeight: "26px",
  color: "#3c3f44",
  marginBottom: "8px",
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

const ps: CSSProperties = {
  fontSize: "14px",
  lineHeight: "24px",
  color: "#8898aa",
  marginTop: "32px",
};
