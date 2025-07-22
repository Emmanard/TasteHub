import React from "react";
import styled from "styled-components";
import { Phone, Email, LocationOn, Chat, Schedule } from "@mui/icons-material";

const Container = styled.div`
  padding: 20px 30px;
  padding-bottom: 100px;
  height: 100%;
  overflow-y: scroll;
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 30px;
  @media (max-width: 768px) {
    padding: 20px 12px;
  }
  background: ${({ theme }) => theme.bg || '#f8f9fa'};
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
  font-weight: 500;
  text-align: center;
  color: #333;
  margin-bottom: 10px;
`;

const Subtitle = styled.p`
  text-align: center;
  color: #666;
  font-size: 16px;
  margin-bottom: 40px;
`;

const ContactGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
`;

const ContactCard = styled.div`
  background: white;
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
  background: ${({ bgColor }) => bgColor || '#ef4444'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
`;

const ContactTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
`;

const ContactInfo = styled.div`
  color: #666;
  font-size: 14px;
  line-height: 1.5;
`;

const ContactAction = styled.div`
  margin-top: 16px;
  font-weight: 500;
  color: #ef4444;
  text-decoration: none;
  
  &:hover {
    color: #dc2626;
  }
`;





const Contact = () => {
  const handleContactClick = (type, value) => {
    switch (type) {
      case 'phone':
        window.open(`tel:${value}`, '_self');
        break;
      case 'email':
        const subject = encodeURIComponent('Support Request');
        const body = encodeURIComponent('Hello, I need help with...');
        window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${value}&su=${subject}&body=${body}`, '_blank');
        break;
      case 'whatsapp':
        window.open(value, '_blank');
        break;
      case 'directions':
        const address = encodeURIComponent(value);
        window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
        break;
      default:
        break;
    }
  };

  return (
    <Container>
      <Section>
        <Title>Get in Touch</Title>
        <Subtitle>
          Have questions about your order or need help? We're here to assist you!
        </Subtitle>

        <ContactGrid>
          <ContactCard onClick={() => handleContactClick('phone', '+2347046629255')}>
            <ContactHeader>
              <IconWrapper bgColor="#10b981">
                <Phone />
              </IconWrapper>
              <ContactTitle>Call Us</ContactTitle>
            </ContactHeader>
            <ContactInfo>
              <div style={{ fontSize: '16px', fontWeight: '500', color: '#333', marginBottom: '4px' }}>
                +234 7046629255
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Schedule fontSize="small" />
                Available Mon-Sat, 9am - 6pm
              </div>
            </ContactInfo>
            <ContactAction>
              Tap to call
            </ContactAction>
          </ContactCard>

          <ContactCard onClick={() => handleContactClick('email', 'support@yourwebsite')}>
            <ContactHeader>
              <IconWrapper bgColor="#3b82f6">
                <Email />
              </IconWrapper>
              <ContactTitle>Email Support</ContactTitle>
            </ContactHeader>
            <ContactInfo>
              <div style={{ fontSize: '16px', fontWeight: '500', color: '#333', marginBottom: '4px' }}>
                abarikwuchukwuemeka@gmail.com
              </div>
              <div>
                We typically respond within 24 hours
              </div>
            </ContactInfo>
            <ContactAction>
              Send email
            </ContactAction>
          </ContactCard>

          <ContactCard onClick={() => handleContactClick('whatsapp', 'https://wa.me/2348123456789')}>
            <ContactHeader>
              <IconWrapper bgColor="#25d366">
                <Chat />
              </IconWrapper>
              <ContactTitle>WhatsApp Chat</ContactTitle>
            </ContactHeader>
            <ContactInfo>
              <div style={{ fontSize: '16px', fontWeight: '500', color: '#333', marginBottom: '4px' }}>
                Quick Support
              </div>
              <div>
                Chat with us instantly on WhatsApp
              </div>
            </ContactInfo>
            <ContactAction>
              Start chat
            </ContactAction>
          </ContactCard>

          <ContactCard onClick={() => handleContactClick('directions', 'Caritas University Amorji Nike, Enugu State, Nigeria')}>
            <ContactHeader>
              <IconWrapper bgColor="#f59e0b">
                <LocationOn />
              </IconWrapper>
              <ContactTitle>Visit Us</ContactTitle>
            </ContactHeader>
            <ContactInfo>
              <div style={{ fontSize: '16px', fontWeight: '500', color: '#333', marginBottom: '4px' }}>
                Business Address
              </div>
              <div>
                Caritas University Amorji Nike,<br />
                Enugu State, Nigeria
              </div>
            </ContactInfo>
            <ContactAction>
              Get directions
            </ContactAction>
          </ContactCard>
        </ContactGrid>
      </Section>
    </Container>
  );
};

export default Contact;