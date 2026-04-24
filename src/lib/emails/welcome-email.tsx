import type { CSSProperties } from 'react';
import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Text,
} from '@react-email/components';

interface WelcomeEmailProps {
  userName: string;
}

export function WelcomeEmail({ userName }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to AI ZAHA — your AI architecture studio</Preview>
      <Body style={body}>
        <Container style={container}>
          <Text style={h2}>Hi {userName}, welcome to AI ZAHA!</Text>
          <Text style={p}>
            We are thrilled to have you here. AI ZAHA is an extraordinary AI tool
            for generating architectural imagery. It is built to help you save
            time and energy, ship visuals faster, and grow your bottom line.
          </Text>
          <Text style={p}>
            Whether you are exploring concepts or delivering work to clients, we
            believe it can make your process lighter—and help you turn ideas into
            real value.
          </Text>
          <Text style={p}>
            Jump in and start creating—we cannot wait to see what you build.
          </Text>
          <Text style={footer}>— The AI ZAHA team</Text>
        </Container>
      </Body>
    </Html>
  );
}

const body: CSSProperties = {
  fontFamily:
    'system-ui, -apple-system, Segoe UI, sans-serif',
  color: '#111',
};

const container: CSSProperties = {
  maxWidth: '500px',
  margin: '0 auto',
};

const h2: CSSProperties = {
  fontSize: '20px',
  fontWeight: 600,
  margin: '0 0 12px 0',
};

const p: CSSProperties = {
  fontSize: '15px',
  lineHeight: 1.55,
  margin: '0 0 12px 0',
};

const footer: CSSProperties = {
  fontSize: '15px',
  lineHeight: 1.55,
  color: '#555',
  margin: '20px 0 0 0',
};
