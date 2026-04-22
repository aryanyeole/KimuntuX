import React from 'react';
import styled from 'styled-components';
import BlockchainWorkspace from '../../components/BlockchainWorkspace';
import { crm as C } from '../../styles/crmTheme';

const Page = styled.div`
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
`;

const Hero = styled.section`
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at top right, rgba(0, 200, 150, 0.14), transparent 34%),
    linear-gradient(135deg, rgba(20, 20, 20, 0.98), rgba(10, 10, 10, 1));
  border: 1px solid ${C.border};
  border-radius: ${C.radiusLg};
  padding: 2rem;
`;

const Eyebrow = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.7rem;
  margin-bottom: 1rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${C.accent};
  background: ${C.accentBg};
  border: 1px solid ${C.borderLight};
`;

const Title = styled.h2`
  margin: 0 0 0.75rem;
  color: ${C.text};
  font-size: 2rem;
  font-weight: 800;
  line-height: 1.1;
`;

const Copy = styled.p`
  margin: 0;
  max-width: 760px;
  color: ${C.textMuted};
  font-size: 1rem;
  line-height: 1.7;
`;

const OverviewGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
`;

const OverviewCard = styled.div`
  background: ${C.surface};
  border: 1px solid ${C.border};
  border-radius: ${C.radiusLg};
  padding: 1.3rem;
`;

const OverviewTitle = styled.h3`
  margin: 0 0 0.5rem;
  color: ${C.text};
  font-size: 0.98rem;
  font-weight: 700;
`;

const OverviewBody = styled.p`
  margin: 0;
  color: ${C.textMuted};
  font-size: 0.92rem;
  line-height: 1.6;
`;

export default function CRMFintech() {
  const featureCards = [
    {
      title: 'Blockchain Treasury',
      body: 'Commission pool balances, escrow activity, and smart contract health now live under Fintech Hub for one operational view.',
    },
    {
      title: 'Wallet Onboarding',
      body: 'MetaMask connect now pulls the active account, switches to the local Hardhat chain when needed, and creates the wallet from the user account itself when needed.',
    },
    {
      title: 'Market-Aware Finance',
      body: 'Users now get wallet value, crypto pricing context, and strategy guidance alongside the transaction console so the blockchain workspace feels practical and decision-ready.',
    },
  ];

  return (
    <Page>
      <Hero>
        <Eyebrow>Fintech Hub</Eyebrow>
        <Title>Payments, wallets, and blockchain operations in one place.</Title>
        <Copy>
          Fintech Hub is now the home for wallet connectivity, smart-contract monitoring, escrow flows,
          commission treasury activity, and live market context. That keeps the sidebar clean while preserving a more
          useful blockchain workflow for day-to-day fintech operations.
        </Copy>
      </Hero>

      <OverviewGrid>
        {featureCards.map((card) => (
          <OverviewCard key={card.title}>
            <OverviewTitle>{card.title}</OverviewTitle>
            <OverviewBody>{card.body}</OverviewBody>
          </OverviewCard>
        ))}
      </OverviewGrid>

      <BlockchainWorkspace />
    </Page>
  );
}
