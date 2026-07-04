import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components"

// Calm, mentor-toned verification email — no dashboard clutter, matching the
// product voice (PRD 00 §4). Used for both signup verification and password
// reset; the intro line differs by purpose.

interface OtpEmailProps {
  code: string
  purpose: "signup_verification" | "password_reset"
  name?: string | null
}

const intro: Record<OtpEmailProps["purpose"], string> = {
  signup_verification: "Welcome to UrPaisa. Use this code to verify your email and continue setting up your account.",
  password_reset: "We received a request to reset your UrPaisa password. Use this code to continue. If this wasn't you, you can safely ignore this email.",
}

export function OtpEmail({ code, purpose, name }: OtpEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your UrPaisa verification code is {code}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Text style={brand}>UrPaisa</Text>
          <Heading style={heading}>{name ? `Hi ${name},` : "Hi there,"}</Heading>
          <Text style={paragraph}>{intro[purpose]}</Text>
          <Section style={codeBox}>
            <Text style={codeText}>{code}</Text>
          </Section>
          <Text style={muted}>This code expires in 10 minutes. Never share it with anyone — UrPaisa will never ask you for it.</Text>
        </Container>
      </Body>
    </Html>
  )
}

export default OtpEmail

const body = { backgroundColor: "#F6F5F1", fontFamily: "-apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif" }
const container = { margin: "0 auto", padding: "32px 24px", maxWidth: "440px" }
const brand = { fontSize: "20px", fontWeight: 700, color: "#4C7EF3", margin: "0 0 24px" }
const heading = { fontSize: "18px", fontWeight: 600, color: "#2B2A28", margin: "0 0 12px" }
const paragraph = { fontSize: "15px", lineHeight: "24px", color: "#2B2A28", margin: "0 0 24px" }
const codeBox = { backgroundColor: "#EBF1FE", borderRadius: "12px", padding: "20px", textAlign: "center" as const }
const codeText = { fontSize: "32px", fontWeight: 700, letterSpacing: "8px", color: "#2B2A28", margin: 0 }
const muted = { fontSize: "13px", lineHeight: "20px", color: "#6B6A65", margin: "24px 0 0" }
