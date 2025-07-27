import React, { useCallback } from "react";
import styled from "styled-components";
import { Phone, Email, LocationOn, Chat, Schedule } from "@mui/icons-material";

const Container = styled.section`
  padding: 20px 30px 100px;
  height: 100%;
  overflow-y: auto;
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 30px;
  background: ${({ theme }) => theme.bg || "#f8f9fa"};
  @media (max-width: 768px) {
    padding: 20px 12px;
  }
`;

const Section = styled.div`
  max-width: 1400px;
  padding: 32px 16px;
  display: flex;
  flex-direction: column;
  gap: 28px;
  width: 100%;
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 600;
  text-align: center;
  color: ${({ theme }) => theme.text || "#333"};
`;

const Subtitle = styled.p`
  text-align: center;
  color: ${({ theme }) => theme.subText || "#666"};
  font-size: 16px;
  margin-bottom: 40px;
`;

const ContactGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
`;

const ContactCard = styled.article`
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }
`;

const ContactHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
`;

const IconWrapper = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: ${({ bgColor }) => bgColor || "#ef4444"};
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
`;

const ContactTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.text || "#333"};
  margin: 0;
`;

const ContactInfo = styled.div`
  color: ${({ theme }) => theme.subText || "#666"};
  font-size: 14px;
  line-height: 1.5;
`;

const ContactValue = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: ${({ theme }) => theme.text || "#333"};
  margin-bottom: 4px;
`;

const ContactAction = styled.span`
  display: inline-block;
  margin-top: 16px;
  font-weight: 500;
  color: #ef4444;
  text-decoration: none;
  cursor: pointer;

  &:hover {
    color: #dc2626;
  }
`;

const CONTACT_ITEMS = [
  {
    id: "phone",
    title: "Call Us",
    value: "+234 7046629255",
    subtitle: "Available Mon-Sat, 9am - 6pm",
    action: "Tap to call",
    bgColor: "#10b981",
    icon: <Phone />,
  },
  {
    id: "email",
    title: "Email Support",
    value: "abarikwuchukwuemeka@gmail.com",
    subtitle: "We typically respond within 24 hours",
    action: "Send email",
    bgColor: "#3b82f6",
    icon: <Email />,
  },
  {
    id: "whatsapp",
    title: "WhatsApp Chat",
    value: "https://wa.me/2347046629255",
    subtitle: "Chat with us instantly on WhatsApp",
    action: "Start chat",
    bgColor: "#25d366",
    icon: <Chat />,
  },
  {
    id: "directions",
    title: "Visit Us",
    value: "Caritas University Amorji Nike, Enugu State, Nigeria",
    subtitle: "Caritas University Amorji Nike, Enugu State, Nigeria",
    action: "Get directions",
    bgColor: "#f59e0b",
    icon: <LocationOn />,
  },
];

const Contact = () => {
  const handleContactClick = useCallback((type, value) => {
    switch (type) {
      case "phone":
        window.open(`tel:${value}`, "_self");
        break;
      case "email":
        window.open(`mailto:${value}?subject=Support%20Request&body=Hello,%20I%20need%20help%20with...`, "_blank");
        break;
      case "whatsapp":
        window.open(value, "_blank", "noopener,noreferrer");
        break;
      case "directions":
        window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(value)}`, "_blank");
        break;
      default:
        break;
    }
  }, []);

  return (
    <Container>
      <Section>
        <Title>Get in Touch</Title>
        <Subtitle>Have questions about your order or need help? We're here to assist you!</Subtitle>

        <ContactGrid>
          {CONTACT_ITEMS.map(({ id, title, value, subtitle, action, bgColor, icon }) => (
            <ContactCard key={id} onClick={() => handleContactClick(id, value)} aria-label={`Contact via ${title}`}>
              <ContactHeader>
                <IconWrapper bgColor={bgColor}>{icon}</IconWrapper>
                <ContactTitle>{title}</ContactTitle>
              </ContactHeader>
              <ContactInfo>
                <ContactValue>{value.includes("http") ? "Quick Support" : value}</ContactValue>
                {id === "phone" ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <Schedule fontSize="small" />
                    {subtitle}
                  </div>
                ) : (
                  <div>{subtitle}</div>
                )}
              </ContactInfo>
              <ContactAction>{action}</ContactAction>
            </ContactCard>
          ))}
        </ContactGrid>
      </Section>
    </Container>
  );
};

export default Contact;
